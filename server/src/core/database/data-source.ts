import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../../config';
import { UserActivity } from '../../modules/analytic/entities/user-activity.entity';
import { Attachment } from '../../modules/attachment/entities/attachment.entity';
import { BugReport } from '../../modules/bug-report/entities/bug-report.entity';
import { CommentMention } from '../../modules/comment/entities/comment-mention.entity';
import { Comment } from '../../modules/comment/entities/comment.entity';
import { Bookmark } from '../../modules/discussion/entities/bookmark.entity';
import { DiscussionSpace } from '../../modules/discussion/entities/discussion-space.entity';
import { Discussion } from '../../modules/discussion/entities/discussion.entity';
import { Notification } from '../../modules/notification/entities/notification.entity';
import { PushSubscription } from '../../modules/notification/entities/push-subscription.entity';
import { ReportReason } from '../../modules/report/entities/report-reason.entity';
import { Report } from '../../modules/report/entities/report.entity';
import { User } from '../../modules/user/entities/user.entity';
import { Vote } from '../../modules/vote/entities/vote.entity';

const isDevelopment = process.env.NODE_ENV !== 'production';
const dbConfig = databaseConfig();

export default new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  synchronize: isDevelopment,
  logging: false,
  entities: [
    User,
    UserActivity,
    Attachment,
    BugReport,
    CommentMention,
    Comment,
    Bookmark,
    DiscussionSpace,
    Discussion,
    Notification,
    ReportReason,
    Report,
    Vote,
    PushSubscription,
  ],
  migrations: isDevelopment ? ['dist/src/core/database/migrations/*.js'] : ['src/core/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});
