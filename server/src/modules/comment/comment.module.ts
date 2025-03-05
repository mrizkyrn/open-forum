import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Discussion } from '../discussion/entities/discussion.entity';
import { AttachmentModule } from '../attachment/attachment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Discussion]), AttachmentModule],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
