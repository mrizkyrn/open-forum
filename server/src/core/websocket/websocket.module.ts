import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JWTConfig } from '../../config';
import { UserModule } from '../../modules/user/user.module';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
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
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
