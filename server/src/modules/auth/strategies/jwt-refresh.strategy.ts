import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../../config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfigService: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req.cookies?.refreshToken]),
      ignoreExpiration: false,
      secretOrKey: jwtConfigService.refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies?.refreshToken;
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      refreshToken,
    };
  }
}
