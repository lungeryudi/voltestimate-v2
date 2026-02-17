import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeZohoCode, saveZohoConnection } from '../../services/zohoIntegration';
import { useAuth } from '../../features/auth/hooks/useAuth';

/**
 * Zoho OAuth Callback Handler
 * Handles the OAuth redirect from Zoho CRM
 */
export default function ZohoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError(`OAuth error: ${errorParam}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }

      if (!user) {
        setStatus('error');
        setError('User not authenticated');
        return;
      }

      try {
        // Exchange code for tokens
        const tokens = await exchangeZohoCode(code);
        
        // Save tokens to database
        await saveZohoConnection(user.id, tokens);
        
        setStatus('success');
        
        // Redirect back to integrations page after a short delay
        setTimeout(() => {
          const returnPath = sessionStorage.getItem('zoho_oauth_return') || '/settings';
          sessionStorage.removeItem('zoho_oauth_return');
          navigate(returnPath);
        }, 2000);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to complete OAuth');
      }
    };

    handleCallback();
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Connecting Zoho CRM</h1>
            <p className="text-slate-400">Please wait while we complete the connection...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Connected!</h1>
            <p className="text-slate-400">Zoho CRM has been successfully connected to your account.</p>
            <p className="text-slate-500 text-sm mt-4">Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Connection Failed</h1>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
