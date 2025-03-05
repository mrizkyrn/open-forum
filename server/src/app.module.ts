import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig, appConfig, jwtConfig } from './config';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DiscussionModule } from './modules/discussion/discussion.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { CommentModule } from './modules/comment/comment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig, appConfig, jwtConfig] }),
    DatabaseModule,
    AuthModule,
    DiscussionModule,
    AttachmentModule,
    CommentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
