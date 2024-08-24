import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { MemberInput } from '../../libs/dto/member/member.input';

@Injectable()
export class MemberService {
    constructor(@InjectModel('Member') private readonly memberModel: Model<Member>) { }

    public async signup(input: MemberInput):Promise<Member>{
        // TODO Hash password

        try{
            const result = await this.memberModel.create(input);
            // Authentication via TOKEN
            return result;
        }catch(err){
            console.log("Error: Service.model",err);
            throw new BadRequestException(err);
        }
        
    }

    public async login():Promise<string>{
        //const result = await this.memberModel.find(memberNick: memberNick)
        return 'login';
    }

    public async updateMember():Promise<string>{
        return 'updateMember';
    }

    public async getMember():Promise<string>{
        return 'getMembers';
    }

    
}
