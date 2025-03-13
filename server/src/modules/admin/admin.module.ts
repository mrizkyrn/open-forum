import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discussion } from '../discussion/entities/discussion.entity';
import { User } from '../user/entities/user.entity';
import { Report } from '../report/entities/report.entity';
import { Comment } from '../comment/entities/comment.entity';
import { DiscussionSpace } from '../discussion/entities/discussion-space.entity';
import { Vote } from '../vote/entities/vote.entity';
import { UserModule } from '../user/user.module';
import { ReportModule } from '../report/report.module';

@Module({
  imports: [TypeOrmModule.forFeature([Discussion, User, Report, Comment, DiscussionSpace, Vote]), UserModule, ReportModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
