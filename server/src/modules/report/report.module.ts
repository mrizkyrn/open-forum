import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportReason } from './entities/report-reason.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { DiscussionModule } from '../discussion/discussion.module';
import { CommentModule } from '../comment/comment.module';
import { NotificationModule } from '../notification/notification.module';
import { WebsocketModule } from 'src/core/websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportReason]),
    DiscussionModule,
    CommentModule,
    NotificationModule,
    WebsocketModule,
  ],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
