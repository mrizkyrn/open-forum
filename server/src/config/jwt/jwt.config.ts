import { registerAs } from '@nestjs/config';
import { JWTConfig } from './jwt-config.type';

export const jwtConfig = registerAs('jwt', (): JWTConfig => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  const accessTokenExpires = process.env.ACCESS_TOKEN_EXPIRES;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  const refreshTokenExpires = process.env.REFRESH_TOKEN_EXPIRES;

  if (!accessTokenSecret) {
    throw new Error('JWT configuration is incomplete. Required environment variables: ACCESS_TOKEN_SECRET');
  }

  if (!refreshTokenSecret) {
    throw new Error('JWT configuration is incomplete. Required environment variables: REFRESH_TOKEN_SECRET');
  }

  if (!accessTokenExpires) {
    throw new Error('JWT configuration is incomplete. Required environment variables: ACCESS_TOKEN_EXPIRES');
  }

  if (!refreshTokenExpires) {
    throw new Error('JWT configuration is incomplete. Required environment variables: REFRESH_TOKEN_EXPIRES');
  }

  return {
    accessTokenSecret,
    accessTokenExpires,
    refreshTokenSecret,
    refreshTokenExpires,
  };
});
