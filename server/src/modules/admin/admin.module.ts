import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { CommentModule } from '../comment/comment.module';
import { DiscussionModule } from '../discussion/discussion.module';
import { ReportModule } from '../report/report.module';
import { UserModule } from '../user/user.module';
import { VoteModule } from '../vote/vote.module';
import { AdminAcademicController } from './admin-academic.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminReportController } from './admin-report.controller';
import { AdminSpaceController } from './admin-space.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UserModule, CommentModule, ReportModule, DiscussionModule, VoteModule, AcademicModule],
  providers: [AdminService],
  controllers: [
    AdminDashboardController,
    AdminUserController,
    AdminSpaceController,
    AdminReportController,
    AdminAcademicController,
  ],
})
export class AdminModule {}
