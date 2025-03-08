import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWTConfig } from 'src/config';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { UserService } from 'src/modules/user/user.service';
import { TokenPayload } from 'src/modules/auth/interfaces/token-payload.interface';
import { DiscussionResponseDto } from 'src/modules/discussion/dto/discussion-response.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
@Injectable()
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly onlineUsers = new Map<number, Socket[]>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Server Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.error('Socket connection rejected: No token provided');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get<JWTConfig>('jwt')!.accessTokenSecret,
      });

      // Get user
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        this.logger.error(`Socket connection rejected: User ${payload.sub} not found`);
        client.disconnect();
        return;
      }

      // Set up user data
      client.data.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      };

      // Join user's private room for notifications
      client.join(`user:${user.id}`);

      // Track online status
      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, []);
        // Broadcast user is online (only for the first connection)
        this.server.emit('userStatusChange', { userId: user.id, online: true });
      }

      this.onlineUsers.get(user.id)!.push(client);

      this.logger.log(`Client connected: ${client.id} (User: ${user.id})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.id;

    if (userId) {
      // Remove this connection
      const connections = this.onlineUsers.get(userId) || [];
      const remainingConnections = connections.filter((conn) => conn.id !== client.id);

      if (remainingConnections.length === 0) {
        // User is now completely offline
        this.onlineUsers.delete(userId);
        // Broadcast user is offline
        this.server.emit('userStatusChange', { userId, online: false });
      } else {
        // User still has other connections
        this.onlineUsers.set(userId, remainingConnections);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Room management
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: { roomName: string }) {
    const { roomName } = payload;
    const userId = client.data.user.id;

    client.join(roomName);

    this.logger.log(`User ${userId} joined room ${roomName}`);
    return { success: true, room: roomName };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: { roomName: string }) {
    const { roomName } = payload;
    const userId = client.data.user.id;

    client.leave(roomName);

    this.logger.log(`User ${userId} left room ${roomName}`);
    return { success: true, room: roomName };
  }

  // Discussion specific rooms
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinDiscussion')
  handleJoinDiscussion(client: Socket, payload: { discussionId: number }) {
    const { discussionId } = payload;
    const userId = client.data.user.id;
    const roomName = `discussion:${discussionId}`;

    client.join(roomName);

    this.logger.log(`User ${userId} joined discussion ${discussionId}`);
    return { success: true, discussionId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveDiscussion')
  handleLeaveDiscussion(client: Socket, payload: { discussionId: number }) {
    const { discussionId } = payload;
    const userId = client.data.user.id;
    const roomName = `discussion:${discussionId}`;

    client.leave(roomName);

    this.logger.log(`User ${userId} left discussion ${discussionId}`);
    return { success: true, discussionId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('checkUserStatus')
  handleCheckUserStatus(client: Socket, userId: number) {
    const isOnline = this.onlineUsers.has(userId);
    return { success: true, userId, online: isOnline };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers() {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    return { success: true, users: onlineUserIds };
  }

  // Utility methods for other services to use

  // Send notification to specific user
  sendNotification(userId: number, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    return true;
  }

  // Send update to all users in a discussion
  sendDiscussionUpdate(discussionId: number, data: any) {
    this.server.to(`discussion:${discussionId}`).emit('discussionUpdate', data);
    return true;
  }

  // Send a new comment notification
  sendNewComment(discussionId: number, comment: any) {
    this.server.to(`discussion:${discussionId}`).emit('newComment', comment);
    return true;
  }

  // Broadcast message to all connected clients
  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
    return true;
  }

  // Check if a user is online
  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  notifyNewDiscussion() {
    this.server.emit('newDiscussion');
    return true;
  }

  notifyNewComment(comment: any) {
    const discussionId = comment.discussionId;

    const payload = {
      discussionId,
      commentId: comment.id,
      isReply: !!comment.parentId,
      parentId: comment.parentId || null,
    };

    this.server.to(`discussion:${discussionId}`).emit('newComment', payload);
    return true;
  }
}
