'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://150ouvhn24.execute-api.ap-south-1.amazonaws.com/prod';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // Check for Cognito errors
        if (errorParam) {
          const errorDescription = searchParams.get('error_description');
          setError(`Authentication failed: ${errorDescription || errorParam}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received from Cognito');
          setLoading(false);
          return;
        }

        // Exchange authorization code for tokens on backend
        const exchangeResponse = await fetch(`${API_URL}/auth/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '',
          }),
        });

        if (!exchangeResponse.ok) {
          const errorData = await exchangeResponse.json();
          throw new Error(errorData.error || 'Failed to exchange code for token');
        }

        const { idToken, accessToken, user } = await exchangeResponse.json();

        // Store token in session storage
        sessionStorage.setItem('auth_token', accessToken);

        // Store user info
        setUser(user, accessToken);

        // Redirect to home page
        router.push('/');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, setUser, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <div className="text-center">
          {loading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Authenticating...</p>
            </>
          ) : error ? (
            <>
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <a
                href="/auth/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Back to Login
              </a>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
