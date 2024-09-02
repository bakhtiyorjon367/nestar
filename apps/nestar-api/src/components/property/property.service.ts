import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertyInput } from '../../libs/dto/property/property.input';
import { Property } from '../../libs/dto/property/property';
import { Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';

@Injectable()
export class PropertyService {
    constructor(@InjectModel('Property') 
    private readonly propertyModel: Model<Property>, 
    private memberService: MemberService) {}

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

    
}
