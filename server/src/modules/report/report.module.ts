import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticModule } from '../analytic/analytic.module';
import { CommentModule } from '../comment/comment.module';
import { DiscussionModule } from '../discussion/discussion.module';
import { NotificationModule } from '../notification/notification.module';
import { ReportReason } from './entities/report-reason.entity';
import { Report } from './entities/report.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportReason]),
    DiscussionModule,
    CommentModule,
    NotificationModule,
    AnalyticModule,
  ],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
