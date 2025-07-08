export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
}

export interface OAuthProvider {
  name: string;
  authUrl: string;
  config: OAuthConfig;
}

// OAuth provider configurations
export const oauthProviders = {
  google: {
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    config: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/oauth-success`,
      scope: 'openid email profile',
    },
  },
  github: {
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    config: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/oauth-success`,
      scope: 'user:email',
    },
  },
};

export class OAuthService {
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  static buildAuthUrl(provider: keyof typeof oauthProviders): string {
    const { authUrl, config } = oauthProviders[provider];
    const state = this.generateState();

    // Store state in localStorage for verification
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_provider', provider);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope || '',
      response_type: 'code',
      state,
    });

    return `${authUrl}?${params.toString()}`;
  }

  static initiateOAuth(provider: keyof typeof oauthProviders): void {
    // Store provider for later use
    localStorage.setItem('oauth_provider', provider);

    // Redirect to backend OAuth endpoint
    const backendAuthUrl = `${import.meta.env.VITE_BASE_API_URL || 'http://localhost:3000'}/api/v1/auth/${provider}`;
    window.location.href = backendAuthUrl;
  }

  static verifyState(returnedState: string): boolean {
    const storedState = localStorage.getItem('oauth_state');
    return storedState === returnedState;
  }

  static cleanup(): void {
    localStorage.removeItem('oauth_state');
    localStorage.removeItem('oauth_provider');
  }
}
