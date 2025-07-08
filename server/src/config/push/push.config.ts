import { registerAs } from '@nestjs/config';
import { PushConfig } from './push-config.type';

export const pushConfig = registerAs('push', (): PushConfig => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey) {
    throw new Error('Push notification configuration is incomplete. Required environment variables: VAPID_PUBLIC_KEY');
  }

  if (!privateKey) {
    throw new Error('Push notification configuration is incomplete. Required environment variables: VAPID_PRIVATE_KEY');
  }

  if (!subject) {
    throw new Error('Push notification configuration is incomplete. Required environment variables: VAPID_SUBJECT');
  }

  return {
    publicKey,
    privateKey,
    subject,
  };
});
