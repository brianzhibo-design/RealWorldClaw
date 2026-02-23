'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-4">Something Went Wrong</h1>
          <p className="text-slate-400 mb-6">
            An unexpected error occurred. We've been notified and are working to fix it.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={reset}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white"
          >
            Try Again
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}