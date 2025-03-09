import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { Discussion } from './entities/discussion.entity';
import { AttachmentModule } from '../attachment/attachment.module';
import { Bookmark } from './entities/bookmark.entity';
import { VoteModule } from '../vote/vote.module';
import { WebsocketModule } from 'src/core/websocket/websocket.module';
import { DiscussionSpaceService } from './discusison-space.service';
import { DiscussionSpaceController } from './discussion-space.controller';
import { DiscussionSpace } from './entities/discussion-space.entity';
import { FileModule } from '../../core/file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Discussion, Bookmark, DiscussionSpace]),
    AttachmentModule,
    VoteModule,
    WebsocketModule,
    FileModule,
  ],
  providers: [DiscussionService, DiscussionSpaceService],
  controllers: [DiscussionController, DiscussionSpaceController],
})
export class DiscussionModule {}
