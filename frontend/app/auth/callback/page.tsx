'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getAuthConfig } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

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

        // TODO: In production, exchange code for token on backend
        // For now, we'll use a mock token from the code
        // Production flow:
        // 1. Send code to backend auth/exchange endpoint
        // 2. Backend exchanges code for token with Cognito
        // 3. Backend returns JWT token to frontend
        // 4. Frontend stores token in auth store

        // Mock implementation (replace with real backend call)
        const mockToken = `mock_token_${code}`;

        // Store token in session storage
        sessionStorage.setItem('auth_token', mockToken);

        // Mock user (in production, get from decoded JWT)
        const mockUser = {
          userId: 'mock-user-id',
          email: 'user@example.com',
        };

        setUser(mockUser, mockToken);

        // Redirect to home page
        router.push('/');
      } catch (err) {
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
