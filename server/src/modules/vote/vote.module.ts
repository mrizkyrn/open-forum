import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticModule } from '../analytic/analytic.module';
import { CommentModule } from '../comment/comment.module';
import { DiscussionModule } from '../discussion/discussion.module';
import { NotificationModule } from '../notification/notification.module';
import { Vote } from './entities/vote.entity';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote]),
    forwardRef(() => DiscussionModule),
    forwardRef(() => CommentModule),
    NotificationModule,
    AnalyticModule,
  ],
  providers: [VoteService],
  controllers: [VoteController],
  exports: [VoteService],
})
export class VoteModule {}
