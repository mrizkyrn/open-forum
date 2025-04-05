import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Faculty } from '../../modules/academic/entity/faculty.entity';
import { StudyProgram } from '../../modules/academic/entity/study-program.entity';
import { UserActivity } from '../../modules/analytic/entities/user-activity.entity';
import { Attachment } from '../../modules/attachment/entities/attachment.entity';
import { CommentMention } from '../../modules/comment/entities/comment-mention.entity';
import { Comment } from '../../modules/comment/entities/comment.entity';
import { Bookmark } from '../../modules/discussion/entities/bookmark.entity';
import { DiscussionSpace } from '../../modules/discussion/entities/discussion-space.entity';
import { Discussion } from '../../modules/discussion/entities/discussion.entity';
import { Notification } from '../../modules/notification/entities/notification.entity';
import { ReportReason } from '../../modules/report/entities/report-reason.entity';
import { Report } from '../../modules/report/entities/report.entity';
import { User } from '../../modules/user/entities/user.entity';
import { Vote } from '../../modules/vote/entities/vote.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV === 'development',
  logging: false,
  entities: [
    User,
    Discussion,
    Bookmark,
    Attachment,
    Comment,
    CommentMention,
    Vote,
    DiscussionSpace,
    Report,
    ReportReason,
    Notification,
    UserActivity,
    Faculty,
    StudyProgram,
  ],
  migrations: ['src/core/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
});
