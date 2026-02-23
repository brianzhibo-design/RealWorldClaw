"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { githubAuthAPI } from '@/lib/api-client';
import { Card } from '@/components/ui/card';

function GitHubCallbackContent() {
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
      setError('GitHub authentication was cancelled or failed');
      return;
    }

    if (!code) {
      setStatus('error');
      setError('No authorization code received from GitHub');
      return;
    }

    const handleGitHubAuth = async () => {
      try {
        const res = await githubAuthAPI(code);
        
        login(res.access_token, {
          id: res.user.id,
          username: res.user.username,
          email: res.user.email,
          role: res.user.role as "customer" | "maker" | "admin",
        });
        
        setStatus('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
        
      } catch (error) {
        console.error('GitHub auth error:', error);
        setStatus('error');
        setError('OAuth coming soon');
      }
    };

    handleGitHubAuth();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <span className="text-3xl">
            {status === 'loading' && '⏳'}
            {status === 'success' && '✅'}
            {status === 'error' && '❌'}
          </span>
          <h1 className="text-xl font-semibold mt-3">
            {status === 'loading' && 'Signing you in...'}
            {status === 'success' && 'Welcome to RealWorldClaw!'}
            {status === 'error' && 'Sign in failed'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {status === 'loading' && 'Processing GitHub authentication...'}
            {status === 'success' && 'Redirecting to dashboard...'}
            {status === 'error' && error}
          </p>
        </div>

        <Card className="p-6 border-border/50">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>GitHub authentication successful!</p>
              <p className="mt-2">Taking you to your dashboard...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-primary hover:underline"
              >
                ← Back to Login
              </button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <GitHubCallbackContent />
    </Suspense>
  );
}