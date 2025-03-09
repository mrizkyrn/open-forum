import 'dotenv/config';
import { Attachment } from 'src/modules/attachment/entities/attachment.entity';
import { Comment } from 'src/modules/comment/entities/comment.entity';
import { Bookmark } from 'src/modules/discussion/entities/bookmark.entity';
import { DiscussionSpace } from 'src/modules/discussion/entities/discussion-space.entity';
import { Discussion } from 'src/modules/discussion/entities/discussion.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Vote } from 'src/modules/vote/entities/vote.entity';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Discussion, Bookmark, Attachment, Comment, Vote, DiscussionSpace],
  migrations: ['src/core/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
});
