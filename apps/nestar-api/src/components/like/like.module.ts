import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { MongooseModule } from '@nestjs/mongoose';
import LikeSchema from '../../schemas/Like.model';
import { MemberModule } from '../member/member.module';
import { AuthModule } from '../auth/auth.module';
import { PropertyModule } from '../property/property.module';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { BoardArticleModule } from '../board-article/board-article.module';

@Module({
  imports:[
    MongooseModule.forFeature([{
      name:'Like',
      schema: LikeSchema,
    },
  ]),
  AuthModule,
  MemberModule,
  PropertyModule,
  BoardArticleModule,
  ],
  providers: [LikeService],
  exports:[LikeService]
})
export class LikeModule {}
