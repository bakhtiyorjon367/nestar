import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { AgentPropertiesInquiry, AllPropertiesInquiry, OrdinaryInquiry, PropertiesInquiry, PropertyInput } from '../../libs/dto/property/property.input';
import { Properties, Property } from '../../libs/dto/property/property';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import * as moment from 'moment';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import { lookUpAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class PropertyService {
    constructor(@InjectModel('Property') 
    private readonly propertyModel: Model<Property>, 
    private memberService: MemberService,
    private viewService: ViewService,
    private  likeService: LikeService) {}

    public async createProperty(input:PropertyInput):Promise<Property> {
        try{
            const result = await this.propertyModel.create(input);  
            await this.memberService.memberStatsEditior({_id:result.memberId, targetKey:'memberProperties', modifier:1}); //increase memberProperty
            return result;
        }catch(err){
            console.log("Error: PropertyService.model",err.message);
            throw new BadRequestException(Message.CREATE_FAILED);
        }
        
    }//____________________________________________________________________________________________________


    public async getProperty(memberId:ObjectId, propertyId: ObjectId):Promise<Property> {
        const search: T = {
            _id: propertyId,
            propertyStatus: PropertyStatus.ACTIVE,
        };
        const targetProperty: Property = await this.propertyModel.findOne(search).lean().exec();
        if(!targetProperty) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        if(memberId){
            const viewInput = { memberId: memberId, viewRefId: propertyId, viewGroup: ViewGroup.PROPERTY };
            const newView = await this.viewService.recordView(viewInput);
            if(newView) {
                await this.propertyStatsEditor({_id: propertyId, targetKey: 'propertyViews', modifier:1});
                targetProperty.propertyViews++;
            }

            //meLiked
            const likeInput = {memberId:memberId, likeRefId:propertyId, likeGroup: LikeGroup.PROPERTY};
            targetProperty.meLiked = await this.likeService.cheekLikeExistence(likeInput);
        }

        targetProperty.memberData = await this.memberService.getMember(null, targetProperty.memberId);
        return targetProperty;
    }//______________________________________________________________________________________________________

    public async updateProperty(memberId:ObjectId, input:PropertyUpdate):Promise<Property> {
        let { propertyStatus, soldAt, deletedAt} = input;
        const search: T = {
            _id: input._id,
            memberId: memberId,
            propertyStatus: PropertyStatus.ACTIVE,
        };

        if(propertyStatus === PropertyStatus.SOLD) soldAt = moment().toDate();
        else if(propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();

        const result = await this.propertyModel.findOneAndUpdate(search, input, { new: true}).exec();
        if(!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        if(soldAt || deletedAt){
                await this.memberService.memberStatsEditior({_id: memberId, targetKey: 'memberProperties', modifier:-1});
        }
        
        return result;
    }//____________________________________________________________________________________________________


    public async getProperties(memberId:ObjectId, input:PropertiesInquiry):Promise<Properties> {
        const match:T ={ propertyStatus: PropertyStatus.ACTIVE};
        const sort:T ={ [input?.sort  ?? 'createdAt']: input?.direction ?? Direction.DESC };

        this.shapeMatchQuery (match, input);
        console.log('match', match);

        const result = await this.propertyModel.
        aggregate([
            {$match: match},
            {$sort: sort},
            {
                $facet: {
                    list: [
                        {$skip: (input.page - 1)* input.limit},
                        {$limit: input.limit},
                        lookUpAuthMemberLiked(memberId),//meLiked
                        lookupMember,
                        {$unwind: '$memberData'}
                    ],
                    metaCounter: [{$count: 'total'}],
                },
            },
        ]).exec();
        if(!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }
    private shapeMatchQuery(match:T, input:PropertiesInquiry):void {
        const {
            memberId,
            locationList,
            roomsList,
            bedsList,
            typeList,
            periodsRange,
            pricesRange,
            squaresRange,
            options,
            text,
        } = input.search;
        if(memberId) match.memberId = shapeIntoMongoObjectId(memberId);
        if(locationList && locationList.length) match.propertyLocation = {$in: locationList};
        if(roomsList  && roomsList.length) match.propertyRooms = {$in: roomsList};
        if(bedsList  && bedsList.length) match.propertyBeds = {$in: bedsList};
        if(typeList  && typeList.length) match.propertyType = {$in: typeList};

        if(pricesRange) match.propertyPrice = {$gte: pricesRange.start, $lte: pricesRange.end};
        if(periodsRange) match.createAt = {$gte: periodsRange.start, $lte: periodsRange.end};
        if(squaresRange) match.propertySquare = {$gte: squaresRange.start, $lte:squaresRange.end};

        if(text) match.propertyTitle = {$regex: new RegExp(text, 'i')};
        if(options) {
            match['$or'] = options.map((ele) => {
                return { [ele]: true};
            });
        }
    }//____________________________________________________________________________________________________

    public async getFavorites(memberId:ObjectId, input:OrdinaryInquiry):Promise<Properties>{
        return await this.likeService.getFavoriteProperties(memberId,input);
    }//____________________________________________________________________________________________________

    public async getVisited(memberId:ObjectId, input:OrdinaryInquiry):Promise<Properties>{
        return await this.viewService.getVisitedProperties(memberId,input);
    }//____________________________________________________________________________________________________



    public async getAgentProperties(memberId:ObjectId, input:AgentPropertiesInquiry):Promise<Properties> {
        const {propertyStatus} =input.search;
        if(propertyStatus === PropertyStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

        const match: T = {
            memberId: memberId,
            propertyStatus: propertyStatus ?? {$ne: PropertyStatus.DELETE},
        };
        const sort:T ={ [input?.sort  ?? 'createdAt']: input?.direction ?? Direction.DESC };

        const result = await this.propertyModel.
        aggregate([
            {$match: match},
            {$sort: sort},
            {
                $facet: {
                    list: [
                        {$skip: (input.page - 1)* input.limit},
                        {$limit: input.limit},
                        lookUpAuthMemberLiked(memberId),//meLiked
                        lookupMember,
                        {$unwind: '$memberData'}
                    ],
                    metaCounter: [{$count: 'total'}],
                },
            },
        ]).exec();
        if(!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }//____________________________________________________________________________________________________

    public async likeTargetProperty(memberId: ObjectId, likeRefId: ObjectId):Promise<Property>{
        const target:Property = await this.propertyModel.findOne({_id:likeRefId, propertyStatus: PropertyStatus.ACTIVE});
        if(!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        const input:LikeInput ={
            memberId:memberId,
            likeRefId:likeRefId,
            likeGroup:LikeGroup.PROPERTY
        };
        let modifier:number = await this.likeService.toggleLike(input);
        const result = this.propertyStatsEditor({_id:likeRefId, targetKey:'propertyLikes', modifier:modifier});

        if(!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
        
        return result;
    }//_____________________________________________________________________________________________________


    public async getAllPropertiesByAdmin(input:AllPropertiesInquiry):Promise<Properties> {
        const {propertyStatus, propertyLocationList} =input.search;
        const match:T = {};
        const sort:T ={ [input?.sort  ?? 'createdAt']: input?.direction ?? Direction.DESC };

        if(propertyStatus) match.propertyStatus = propertyStatus;
        if(propertyLocationList) match.propertyLocation = {$in: propertyLocationList};

        const result = await this.propertyModel.
        aggregate([
            {$match: match},
            {$sort: sort},
            {
                $facet: {
                    list: [
                        {$skip: (input.page - 1)* input.limit},
                        {$limit: input.limit},
                        lookupMember,
                        {$unwind: '$memberData'}
                    ],
                    metaCounter: [{$count: 'total'}],
                },
            },
        ]).exec();
        if(!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }//___________________________________________________________________________________________________

    public async updatePropertyByAdmin(input:PropertyUpdate):Promise<Property> {
        let { propertyStatus, soldAt, deletedAt} = input;
        const search: T = {
            _id: input._id,
            propertyStatus: PropertyStatus.ACTIVE,
        };

        if(propertyStatus === PropertyStatus.SOLD) soldAt = moment().toDate();
        else if(propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();

        const result = await this.propertyModel.findOneAndUpdate(search, input, { new: true}).exec();
        if(!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        if(soldAt || deletedAt){
                await this.memberService.memberStatsEditior({_id: result.memberId, targetKey: 'memberProperties', modifier:-1});
        }
        
        return result;
    }//____________________________________________________________________________________________________


    public async removePropertyByAdmin(propertyId:ObjectId):Promise<Property> {
        const search : T = {_id: propertyId, propertyStatus: PropertyStatus.DELETE};
        const result = await this.propertyModel.findOneAndDelete(search).exec();
        if(!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

        return result;
    }//____________________________________________________________________________________________________

    public async propertyStatsEditor (input: StatisticModifier):Promise<Property>{
        const { _id, targetKey, modifier} = input;
        return await this.propertyModel.findByIdAndUpdate(
            _id, 
            {$inc: {[targetKey]:modifier}}, 
            {new: true})
            .exec();

    }//____________________________________________________________________________________________________
}