import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JWTConfig } from '../../config';
import { UserModule } from '../../modules/user/user.module';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketEventService } from './websocket-event.servcie';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<JWTConfig>('jwt')!.accessTokenSecret,
        signOptions: {
          expiresIn: configService.get<JWTConfig>('jwt')!.accessTokenExpires,
        },
      }),
    }),
    UserModule,
  ],
  providers: [WebsocketGateway, WebsocketEventService],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
