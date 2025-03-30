import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticModule } from '../analytic/analytic.module';
import { AttachmentModule } from '../attachment/attachment.module';
import { DiscussionModule } from '../discussion/discussion.module';
import { VoteModule } from '../vote/vote.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment } from './entities/comment.entity';
import { CommentMention } from './entities/comment-mention.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentMention]),
    forwardRef(() => DiscussionModule),
    AttachmentModule,
    forwardRef(() => VoteModule),
    AnalyticModule,
  ],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [CommentService],
})
export class CommentModule {}
