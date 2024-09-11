import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class LikeService {
    constructor(@InjectModel('Like') private readonly likeModel:Model<Like>){}

    public async toggleLike(input:LikeInput):Promise<number>{
        const search:T = { memberId: input.memberId, likeRefId: input.likeRefId} = input,
        exist = await this.likeModel.findOne(search).exec();
        let modifier = 1;
        if(exist){
            await this.likeModel.findOneAndDelete(search).exec();
            modifier = -1;
        }else{
            try{
                await this.likeModel.create(input);
            }catch(err){
                console.log("Error: ServiceLike.model", err.message);
                throw new InternalServerErrorException(Message.CREATE_FAILED);
            }
        }
        console.log(`-LikeModifier- ${modifier}-`)
        return modifier;
    }
}
