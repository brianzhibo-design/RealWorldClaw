"use client";

import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { googleAuthAPI } from '@/lib/api-client';

interface GoogleOAuthButtonProps {
  onError?: (error: string) => void;
  className?: string;
}

export default function GoogleOAuthButton({ onError, className = "" }: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const credential = credentialResponse.credential;
      const res = await googleAuthAPI(credential);
      
      login(res.access_token, {
        id: res.user.id,
        username: res.user.username,
        email: res.user.email,
        role: res.user.role as "customer" | "maker" | "admin",
      });
      
      router.push("/dashboard");
    } catch (error) {
      console.error('Google auth error:', error);
      onError?.("OAuth coming soon");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    onError?.("Google login failed");
  };

  if (loading) {
    return (
      <div className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium ${className}`}>
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        <span className="text-sm">Signing in...</span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width="100%"
        logo_alignment="left"
      />
    </div>
  );
}