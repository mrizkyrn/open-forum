import 'dotenv/config';
import { Attachment } from 'src/modules/attachment/entities/attachment.entity';
import { Bookmark } from 'src/modules/discussion/entities/bookmark.entity';
import { Discussion } from 'src/modules/discussion/entities/discussion.entity';
import { User } from 'src/modules/user/entities/user.entity';
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
  entities: [User, Discussion, Bookmark, Attachment],
  migrations: ['src/core/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
});
