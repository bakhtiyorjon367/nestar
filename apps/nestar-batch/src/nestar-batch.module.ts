import { Module } from '@nestjs/common';
import { NestarBatchController } from './nestar-batch.controller';
import { NestarBatchService } from './nestar-batch.service';
import {ConfigModule} from "@nestjs/config"
import { LikeModule } from './components/like/like.module';

@Module({
  imports: [ConfigModule.forRoot(), LikeModule],
  controllers: [NestarBatchController],
  providers: [NestarBatchService],
})
export class NestarBatchModule {}

