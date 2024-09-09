import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { BoardArticleService } from './board-article.service';
import { UseGuards } from '@nestjs/common';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { BoardArticleInput, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';

@Resolver()
export class BoardArticleResolver {
    constructor(private readonly boardArticleService: BoardArticleService) {}

    @UseGuards(AuthGuard)
    @Mutation(() => BoardArticle)
    public async createBoardArticle(
        @Args('input') input:BoardArticleInput, 
        @AuthMember('_id') memberId:ObjectId
    ): Promise<BoardArticle>{
        console.log("Mutation: createBoardArticle ");
        return await this.boardArticleService.createBoardArticle(memberId, input);
    }//____________________________________________________________________________________________________

    @UseGuards(WithoutGuard)
    @Query(() => BoardArticle)
    public async getBoardArticle(
        @Args('memberId') input:string, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticle>{
        console.log("Query: getBoardArticle ");
        const articleId = shapeIntoMongoObjectId(input);
        return await this.boardArticleService.getBoardArticle(memberId, articleId);
    }//____________________________________________________________________________________________________

    @UseGuards(AuthGuard)
    @Mutation(() => BoardArticle)
    public async updateBoardArticle(
        @Args('input') input:BoardArticleUpdate, 
        @AuthMember('_id') memberId:ObjectId): Promise<BoardArticle>{
        console.log("Mutation: updateBoardArticle ");
        input._id = shapeIntoMongoObjectId(input._id);
        return await this.boardArticleService.updateBoardArticle(memberId, input);
    }//____________________________________________________________________________________________________

    @UseGuards(WithoutGuard)
    @Query(() => BoardArticles)
    public async getBoardArticles(
        @Args('memberId') input:BoardArticlesInquiry, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticles>{
        console.log("Query: getBoardArticles ");
        return await this.boardArticleService.getBoardArticles(memberId, input);
    }//____________________________________________________________________________________________________

}
