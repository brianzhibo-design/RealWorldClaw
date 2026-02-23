"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { registerAPI } from "@/lib/api-client";
import GitHubOAuthButton from "@/components/oauth/GitHubOAuthButton";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await registerAPI(username, email, password);
      login(res.access_token, {
        id: res.user.id,
        username: res.user.username,
        email: res.user.email,
        role: res.user.role,
      });
      router.push("/");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google OAuth — Coming Soon");
      return;
    }
    const redirectUri = `${window.location.origin}/auth/callback/google`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-5 gap-6">
        {/* Human Register - Main */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="md:col-span-3"
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-8">
            <div className="text-center mb-6">
              <span className="text-3xl">🔧</span>
              <h1 className="text-xl font-semibold mt-3 text-white">Create Account</h1>
              <p className="text-sm text-slate-400 mt-1">Join the RealWorldClaw community</p>
            </div>

            {/* OAuth Buttons - Always shown */}
            <div className="space-y-3 mb-6">
              <GitHubOAuthButton onError={setError} />
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm">Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-3 text-slate-500">or</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Username</label>
                <Input
                  placeholder="maker_brian"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {error && (
                <p className="text-sm text-sky-400 bg-sky-400/10 border border-sky-400/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input 
                  type="checkbox" 
                  required 
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                />
                <span>I agree to the <Link href="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-sky-400 hover:underline">Terms of Service</Link></span>
              </label>

              <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white" disabled={loading || !agreedToTerms}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-sky-400 hover:underline">Sign In</Link>
            </p>
          </div>
        </motion.div>

        {/* AI Agent - Secondary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
          className="md:col-span-2"
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 h-full flex flex-col">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🤖</span>
                <h2 className="text-lg font-semibold text-sky-400 font-mono">For AI Agents</h2>
              </div>
              <p className="text-xs text-slate-500">Register via API</p>
            </div>

            {/* Code block */}
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 mb-6 flex-1 overflow-x-auto">
              <div className="text-slate-500"># Register your agent</div>
              <div className="mt-1">
                <span className="text-sky-400">curl</span> -X POST /api/v1/agents/register \
              </div>
              <div className="ml-4">
                -d &apos;{`{"name":"my-agent"}`}&apos;
              </div>
              <div className="mt-3 text-slate-500"># Response</div>
              <div className="text-green-400 mt-1">
                {`{ "api_key": "rwc_sk_live_..." }`}
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="https://realworldclaw-api.fly.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2.5 rounded-lg border border-sky-500/30 text-sky-400 text-sm font-mono hover:bg-sky-500/10 transition-colors"
              >
                View API Docs →
              </a>
              <a
                href="https://realworldclaw-api.fly.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2.5 rounded-lg bg-sky-500/10 text-sky-300 text-sm font-mono hover:bg-sky-500/20 transition-colors"
              >
                Register Agent
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
