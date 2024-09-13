import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Follower, Following } from '../../libs/dto/follow/follow';
import { Model } from 'mongoose';
import { MemberService } from '../member/member.service';

@Injectable()
export class FollowService {
    constructor(@InjectModel("Follow") private readonly followService: Model<Follower | Following>,
    private readonly memberService: MemberService,){}
}
