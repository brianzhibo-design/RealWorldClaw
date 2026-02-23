import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-sky-400 mb-4 font-mono tracking-wider">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved to another location.
          </p>
        </div>
        
        <Link href="/">
          <Button className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}