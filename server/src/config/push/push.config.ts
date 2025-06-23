import { registerAs } from '@nestjs/config';
import { PushConfig } from './push-config.type';

export const pushConfig = registerAs(
  'push',
  (): PushConfig => ({
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:webmaster@upnvj-forum.com',
  }),
);
