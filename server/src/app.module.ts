import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserActivityInterceptor } from './common/interceptors/user-activity.interceptor';
import { appConfig, databaseConfig, jwtConfig, redisConfig } from './config';
import { DatabaseModule } from './core/database/database.module';
import { FileModule } from './core/file/file.module';
import { RedisModule } from './core/redis/redis.module';
import { WebsocketModule } from './core/websocket/websocket.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticModule } from './modules/analytic/analytic.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentModule } from './modules/comment/comment.module';
import { DiscussionModule } from './modules/discussion/discussion.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReportModule } from './modules/report/report.module';
import { UserModule } from './modules/user/user.module';
import { VoteModule } from './modules/vote/vote.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig, appConfig, jwtConfig, redisConfig] }),
    DatabaseModule,
    AuthModule,
    DiscussionModule,
    AttachmentModule,
    CommentModule,
    VoteModule,
    WebsocketModule,
    FileModule,
    ReportModule,
    AdminModule,
    UserModule,
    NotificationModule,
    AnalyticModule,
    RedisModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: UserActivityInterceptor,
    },
  ],
})
export class AppModule {}
