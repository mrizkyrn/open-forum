import { registerAs } from '@nestjs/config';

export interface PushConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}