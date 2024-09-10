import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { PropertyService } from '../property/property.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { MemberService } from '../member/member.service';
import { Comments, Comment} from '../../libs/dto/comment/comment';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { T } from '../../libs/types/common';

@Injectable()
export class CommentService {
    constructor(@InjectModel('Comment') private readonly commentModel:Model<Comment>,
    private readonly memberService: MemberService,
    private readonly propertyService: PropertyService,
    private readonly boardArticleService: BoardArticleService,
) {}

    public async createComment(memberId: ObjectId, input: CommentInput):Promise<Comment>{
        input.memberId= memberId;
        let result = null;
        try{
            result = await this.commentModel.create(input);
        }catch(err){
            console.log("Error: CommentService.model",err.message);
            throw new BadRequestException(Message.CREATE_FAILED);
        }

        switch(input.commentGroup){
            case CommentGroup.PROPERTY:
            await this.propertyService.propertyStatsEditor({
            _id: input.commentRefId,
                targetKey:'propertyComments',
                modifier:1
            });
            case CommentGroup.ARTICLE:
            await this.boardArticleService.boardArticleStatsEditior({
            _id: input.commentRefId,
                targetKey:'articleComments',
                modifier:1
            });
            case CommentGroup.MEMBER:
            await this.memberService.memberStatsEditior({
            _id: input.commentRefId,
                targetKey:'memberComments',
                modifier:1
            });
            break;
        }
        if(!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
        return result;
        
    }//____________________________________________________________________________________________________

    public async updateComment(memberId: ObjectId, input:CommentUpdate):Promise<Comment>{
        const {_id} = input;
        const result = await this.commentModel.findOneAndUpdate(
            {
                _id:_id,
                memberId:memberId,
                commentStatus: CommentStatus.ACTIVE
            },
            input,
            {new:true}
        ).exec();
        if(!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        return result;

    }//____________________________________________________________________________________________________


    public async getComments(memberId: ObjectId, input:CommentsInquiry):Promise<Comments>{
        const {commentRefId,} = input.search;
        const match:T = {commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
        const sort:T ={ [input?.sort  ?? 'createdAt']: input?.direction ?? Direction.DESC };
        
        console.log('match', match);

        const result:Comments[] = await this.commentModel.aggregate([
            {$match: match},
            {$sort: sort},
            {
                $facet:{
                    list: [
                        { $skip: (input.page -1)* input.limit }, 
                        { $limit: input.limit },
                        //meLiked
                        lookupMember,
                        {$unwind: "$memberData"},
                    ],
                    metaCounter:[{$count: 'total'}],
                }
            },
        ]).exec();
        if(!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];

    }//____________________________________________________________________________________________________

    public async removeCommentByAdmin(input:ObjectId):Promise<Comment> {
        const result = await this.commentModel.findOneAndDelete(input).exec();
        if(!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

        return result;
    }//____________________________________________________________________________________________________


}
