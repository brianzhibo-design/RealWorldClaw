"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api-client';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError('Google authentication was cancelled or failed');
      return;
    }

    if (!code) {
      setStatus('error');
      setError('No authorization code received from Google');
      return;
    }

    const authenticate = async () => {
      try {
        const data = await apiFetch<{ access_token: string; user: { id: string; username: string; email: string; role: string } }>(
          "/auth/google",
          { method: "POST", body: JSON.stringify({ credential: code }) }
        );
        login(data.access_token, data.user);
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 1000);
      } catch (err: unknown) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Google authentication failed');
      }
    };

    authenticate();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Signing in with Google...</h2>
            <p className="text-slate-400">Please wait while we verify your account</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-emerald-400 text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Welcome!</h2>
            <p className="text-slate-400">Redirecting to dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">✗</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button onClick={() => router.push('/auth/login')} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors">
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
