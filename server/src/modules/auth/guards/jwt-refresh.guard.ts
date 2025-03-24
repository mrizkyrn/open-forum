import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // JWT expiration error
    if (info instanceof Error) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    // No token provided
    if (!user) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Token is valid, user is authenticated
    return user;
  }
}
