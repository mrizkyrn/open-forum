import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { googleOAuthConfig } from '../../../config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleOAuthConfig.KEY)
    private googleConfig: ConfigType<typeof googleOAuthConfig>,
    private authService: AuthService,
  ) {
    super({
      clientID: googleConfig.clientID,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    try {
      const { name, emails, photos } = profile;

      if (!emails || !emails[0] || !emails[0].value) {
        throw new Error('Google OAuth profile missing email information');
      }

      if (!name || !name.givenName || !name.familyName) {
        throw new Error('Google OAuth profile missing name information');
      }

      const user = {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        avatarUrl: photos && photos[0] ? photos[0].value : null,
        accessToken,
        refreshToken,
      };

      const validatedUser = await this.authService.validateOAuthUser(user, 'google');
      done(null, validatedUser);
    } catch (error) {
      done(error, false);
    }
  }
}
