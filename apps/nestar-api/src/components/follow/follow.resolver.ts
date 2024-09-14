import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Follower, Followers, Followings } from '../../libs/dto/follow/follow';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { FollowService } from './follow.service';
import { WithoutGuard } from '../auth/guards/without.guard';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';

@Resolver()
export class FollowResolver {
    constructor(private readonly followService: FollowService){}
   
    @UseGuards(AuthGuard)
    @Mutation(() => Follower)
    public async subscribe(
        @Args('input') input:string, 
        @AuthMember('_id') memberId:ObjectId
    ): Promise<Follower>{
        console.log("Mutation: subscribe ");
        const followingId = shapeIntoMongoObjectId(input);
        return await this.followService.subscribe(memberId, followingId);
    }//____________________________________________________________________________________________________

    @UseGuards(AuthGuard)
    @Mutation(() => Follower)
    public async unsubscribe(
        @Args('input') input:string, 
        @AuthMember('_id') memberId:ObjectId
    ): Promise<Follower>{
        console.log("Mutation: unsubscribe ");
        const followingId = shapeIntoMongoObjectId(input);
      
        return await this.followService.unsubscribe(memberId, followingId);
    }//____________________________________________________________________________________________________

    @UseGuards(WithoutGuard)
    @Mutation(() => Followings)
    public async getMemberFollowings(
        @Args('input') input:FollowInquiry, 
        @AuthMember('_id') memberId:ObjectId
    ): Promise<Followings>{
        console.log("Mutation: getMemberFollowings ");
        const { followerId } = input.search;
        input.search.followerId = shapeIntoMongoObjectId(followerId);
      
        return await this.followService.getMemberFollowings(memberId, input);
    }//____________________________________________________________________________________________________

    @UseGuards(WithoutGuard)
    @Mutation(() => Followers)
    public async getMemberFollowers(
        @Args('input') input:FollowInquiry, 
        @AuthMember('_id') memberId:ObjectId
    ): Promise<Followers>{
        console.log("Mutation: getMemberFollowers ");
        const { followingId } = input.search;
        input.search.followingId = shapeIntoMongoObjectId(followingId);
      
        return await this.followService.getMemberFollowers(memberId, input);
    }//____________________________________________________________________________________________________

}
