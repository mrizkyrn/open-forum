import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../comment/entities/comment.entity';
import { DiscussionModule } from '../discussion/discussion.module';
import { DiscussionSpace } from '../discussion/entities/discussion-space.entity';
import { Discussion } from '../discussion/entities/discussion.entity';
import { Report } from '../report/entities/report.entity';
import { ReportModule } from '../report/report.module';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { Vote } from '../vote/entities/vote.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Discussion, User, Report, Comment, DiscussionSpace, Vote]),
    UserModule,
    ReportModule,
    DiscussionModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
