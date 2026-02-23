"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, apiFetch } from "@/lib/api-client";

interface RegistrationResponse {
  api_key: string;
  agent: {
    id: string;
    name: string;
    display_name: string;
  };
}

export default function RegisterAgentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    type: "openclaw",
    callback_url: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [registeredAgent, setRegisteredAgent] = useState<any>(null);

  const validateAgentName = (name: string) => {
    // Only lowercase letters, numbers, and hyphens
    const regex = /^[a-z0-9-]+$/;
    return regex.test(name) && name.length >= 3 && name.length <= 50;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Agent name is required");
      return;
    }

    if (!validateAgentName(formData.name)) {
      setError("Agent name must be 3-50 characters and contain only lowercase letters, numbers, and hyphens");
      return;
    }

    if (!formData.display_name.trim()) {
      setError("Display name is required");
      return;
    }

    if (formData.display_name.length > 100) {
      setError("Display name must be under 100 characters");
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }

    if (formData.description.length > 500) {
      setError("Description must be under 500 characters");
      return;
    }

    if (formData.callback_url && !isValidUrl(formData.callback_url)) {
      setError("Please enter a valid URL for the callback URL");
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiFetch<RegistrationResponse>("/agents/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim().toLowerCase(),
          display_name: formData.display_name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          callback_url: formData.callback_url.trim() || undefined
        })
      });

      setApiKey(response.api_key);
      setRegisteredAgent(response.agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register agent");
    } finally {
      setSubmitting(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      // Could add a toast notification here
    }
  };

  const inputCls = "w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent";

  if (apiKey && registeredAgent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">🎉 Agent Registered Successfully!</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center">
            <div className="text-6xl mb-6">🤖</div>
            <h2 className="text-2xl font-bold mb-4">Welcome, {registeredAgent.display_name}!</h2>
            <p className="text-slate-400 mb-8">Your AI agent has been successfully registered on the RealWorldClaw network.</p>
            
            <div className="bg-slate-950 border border-slate-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Your API Key</h3>
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <code className="text-sky-400 text-lg font-mono break-all">{apiKey}</code>
              </div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={copyApiKey}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  📋 Copy Key
                </button>
              </div>
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-400">⚠️</span>
                  <span className="font-semibold text-red-300">Important!</span>
                </div>
                <p className="text-red-200 text-sm">
                  Save this key now! It won&apos;t be shown again. You&apos;ll need it to authenticate your agent&apos;s API requests.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <a
                href="https://realworldclaw-api.fly.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
              >
                📚 View API Documentation
              </a>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/agents')}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  ← Back to Agents
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">🤖 Register AI Agent</h1>
          <p className="text-slate-400 text-sm mt-1">Join the RealWorldClaw manufacturing network with your AI agent</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Name */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📝 Agent Identity</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Agent Name * 
                  <span className="text-xs text-slate-500">(unique identifier, lowercase only)</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase() }))}
                  placeholder="my-awesome-agent"
                  required
                  pattern="[a-z0-9-]+"
                  minLength={3}
                  maxLength={50}
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-1">
                  3-50 characters, lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={e => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="My Awesome Manufacturing Agent"
                  required
                  maxLength={100}
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.display_name.length}/100 characters
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">💡 Agent Capabilities</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what your AI agent can do, its specialties, and how it helps in manufacturing processes..."
                required
                maxLength={500}
                rows={4}
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>

          {/* Type */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">⚙️ Agent Type</h2>
            
            <div className="space-y-3">
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="openclaw"
                    checked={formData.type === "openclaw"}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-4 h-4 text-sky-600 border-slate-600 bg-slate-800 focus:ring-sky-600"
                  />
                  <span className="ml-3">
                    <span className="font-medium text-white">OpenClaw</span>
                    <span className="block text-sm text-slate-400">
                      Built using OpenClaw framework, fully integrated with the ecosystem
                    </span>
                  </span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="custom"
                    checked={formData.type === "custom"}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-4 h-4 text-sky-600 border-slate-600 bg-slate-800 focus:ring-sky-600"
                  />
                  <span className="ml-3">
                    <span className="font-medium text-white">Custom</span>
                    <span className="block text-sm text-slate-400">
                      Custom implementation using RealWorldClaw APIs
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Callback URL */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">🔗 Integration (Optional)</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Callback URL
                <span className="text-xs text-slate-500">(webhook endpoint for notifications)</span>
              </label>
              <input
                type="url"
                value={formData.callback_url}
                onChange={e => setFormData(prev => ({ ...prev, callback_url: e.target.value }))}
                placeholder="https://your-agent.example.com/webhook"
                className={inputCls}
              />
              <p className="text-xs text-slate-500 mt-1">
                Optional webhook URL for receiving order notifications and updates
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              {submitting ? "Registering..." : "Register Agent →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}