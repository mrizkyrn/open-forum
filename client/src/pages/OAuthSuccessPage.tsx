import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { OAuthService } from '../shared/services/oauth.service';

const OAuthSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { OAuthLogin } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=oauth_failed');
          return;
        }

        if (!token) {
          console.error('No token received from OAuth');
          navigate('/login?error=no_token');
          return;
        }

        if (token) {
          await OAuthLogin(token);

          // Navigate to home
          navigate('/');
        } else {
          navigate('/login?error=oauth_failed');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed');
      } finally {
        // Clean up OAuth state
        OAuthService.cleanup();
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, OAuthLogin]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Completing OAuth login...</p>
      </div>
    </div>
  );
};

export default OAuthSuccessPage;
