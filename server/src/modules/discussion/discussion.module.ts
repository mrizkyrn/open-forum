import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../../core/file/file.module';
import { WebsocketModule } from '../../core/websocket/websocket.module';
import { AnalyticModule } from '../analytic/analytic.module';
import { AttachmentModule } from '../attachment/attachment.module';
import { VoteModule } from '../vote/vote.module';
import { DiscussionSpaceService } from './discusison-space.service';
import { DiscussionSpaceController } from './discussion-space.controller';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';
import { Bookmark } from './entities/bookmark.entity';
import { DiscussionSpace } from './entities/discussion-space.entity';
import { Discussion } from './entities/discussion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Discussion, Bookmark, DiscussionSpace]),
    AttachmentModule,
    forwardRef(() => VoteModule),
    FileModule,
    AnalyticModule,
    WebsocketModule,
  ],
  providers: [DiscussionService, DiscussionSpaceService],
  controllers: [DiscussionController, DiscussionSpaceController],
  exports: [DiscussionService, DiscussionSpaceService],
})
export class DiscussionModule {}
