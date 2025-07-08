import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsocketModule } from '../../core/websocket/websocket.module';
import { AnalyticModule } from '../analytic/analytic.module';
import { AttachmentModule } from '../attachment/attachment.module';
import { DiscussionModule } from '../discussion/discussion.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { VoteModule } from '../vote/vote.module';
import { CommentMentionService } from './comment-mention.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentMention } from './entities/comment-mention.entity';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentMention]),
    forwardRef(() => DiscussionModule),
    AttachmentModule,
    forwardRef(() => VoteModule),
    AnalyticModule,
    NotificationModule,
    WebsocketModule,
    UserModule,
  ],
  providers: [CommentService, CommentMentionService],
  controllers: [CommentController],
  exports: [CommentService, CommentMentionService],
})
export class CommentModule {}
