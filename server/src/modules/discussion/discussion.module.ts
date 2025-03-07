import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { Discussion } from './entities/discussion.entity';
import { AttachmentModule } from '../attachment/attachment.module';
import { Bookmark } from './entities/bookmark.entity';
import { VoteModule } from '../vote/vote.module';

@Module({
  imports: [TypeOrmModule.forFeature([Discussion, Bookmark]), AttachmentModule, VoteModule],
  providers: [DiscussionService],
  controllers: [DiscussionController],
})
export class DiscussionModule {}
