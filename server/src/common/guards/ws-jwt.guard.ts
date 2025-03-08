import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../modules/user/user.service';
import { TokenPayload } from '../../modules/auth/interfaces/token-payload.interface';
import { JWTConfig } from 'src/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get<JWTConfig>('jwt')!.accessTokenSecret,
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
