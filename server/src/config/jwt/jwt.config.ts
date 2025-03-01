import { registerAs } from '@nestjs/config';
import { JWTConfig } from './jwt-config.type';

export const jwtConfig = registerAs(
  'jwt',
  (): JWTConfig => ({
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'defaultAccessTokenSecret',
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'defaultRefreshTokenSecret',
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  }),
);
