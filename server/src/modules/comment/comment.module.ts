import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Discussion } from '../discussion/entities/discussion.entity';
import { AttachmentModule } from '../attachment/attachment.module';
import { VoteModule } from '../vote/vote.module';
import { WebsocketModule } from 'src/core/websocket/websocket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Discussion]), AttachmentModule, VoteModule, WebsocketModule],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [CommentService],
})
export class CommentModule {}
