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
import { CommentMentionService } from './comment-mention.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentMention]),
    forwardRef(() => DiscussionModule),
    AttachmentModule,
    forwardRef(() => VoteModule),
    AnalyticModule,
    UserModule,
  ],
  providers: [CommentService, CommentMentionService],
  controllers: [CommentController],
  exports: [CommentService, CommentMentionService],
})
export class CommentModule {}
