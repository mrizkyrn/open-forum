import { Module } from '@nestjs/common';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { Discussion } from '../discussion/entities/discussion.entity';
import { Comment } from '../comment/entities/comment.entity';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';
import { WebsocketModule } from 'src/core/websocket/websocket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, Discussion, Comment]), UserModule, NotificationModule, WebsocketModule],
  providers: [VoteService],
  controllers: [VoteController],
  exports: [VoteService],
})
export class VoteModule {}
