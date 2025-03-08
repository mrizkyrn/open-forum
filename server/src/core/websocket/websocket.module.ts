import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JWTConfig } from 'src/config';
import { UserModule } from 'src/modules/user/user.module';

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
