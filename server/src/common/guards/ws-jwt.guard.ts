import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { jwtConfig } from '../../config';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { UserService } from '../../modules/user/user.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfigService: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();

      // Check if user is already authenticated (from handleConnection)
      if (client.data?.user) {
        return true;
      }

      // Extract token from handshake auth object or headers
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // Verify the token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtConfigService.accessTokenSecret,
      });

      // Check if user exists
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new WsException('Unauthorized: User not found');
      }

      // Attach user data to socket
      client.data.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      };

      return true;
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        throw new WsException('Unauthorized: Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new WsException('Unauthorized: Invalid token');
      }

      throw new WsException('Unauthorized: ' + (error.message || 'Authentication failed'));
    }
  }
}
