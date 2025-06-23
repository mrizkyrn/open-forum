import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SubscribeToPushDto {
  @ApiProperty({
    description: 'Web Push subscription object from the browser',
    example: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/...',
      keys: {
        auth: '...',
        p256dh: '...',
      },
    },
  })
  @IsNotEmpty()
  @IsObject()
  subscription: PushSubscriptionJSON;

  @ApiProperty({
    description: 'User agent information',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

// Interface matching browser's PushSubscription
interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class VapidPublicKeyDto {
  @ApiProperty({
    description: 'VAPID public key for push notifications',
  })
  publicKey: string;
}
