import { registerAs } from '@nestjs/config';
import { GoogleOAuthConfig } from './google-oauth-config.type';

export const googleOAuthConfig = registerAs('googleOAuth', (): GoogleOAuthConfig => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID) {
    throw new Error('Google OAuth configuration is incomplete. Required environment variables: GOOGLE_CLIENT_ID');
  }

  if (!clientSecret) {
    throw new Error('Google OAuth configuration is incomplete. Required environment variables: GOOGLE_CLIENT_SECRET');
  }

  if (!callbackURL) {
    throw new Error('Google OAuth configuration is incomplete. Required environment variables: GOOGLE_CALLBACK_URL');
  }

  return {
    clientID,
    clientSecret,
    callbackURL,
  };
});
