"use client";
import { API_BASE as API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


interface UserProfile {
  username: string;
  email: string;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "ai" | "notifications" | "danger">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    email: "",
    created_at: ""
  });
  const [profileChanges, setProfileChanges] = useState({
    username: "",
    email: ""
  });
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  
  // AI Settings (mock)
  const [apiKey, setApiKey] = useState("sk-proj-••••••••••••••••••••••••••••••••••••••••");
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Notifications (mock)
  const [notifications, setNotifications] = useState({
    order_updates: true,
    maker_messages: true,
    marketing: false,
    system_updates: true
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch user profile
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setProfileChanges({
            username: data.username || "",
            email: data.email || ""
          });
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileChanges)
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setSuccess('Profile updated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      if (response.ok) {
        setSuccess('Password changed successfully');
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: ""
        });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const tabs = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "password", label: "Password", icon: "🔐" },
    { key: "ai", label: "AI Connection", icon: "🤖" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
    { key: "danger", label: "Danger Zone", icon: "⚠️" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span>⚙️</span> Settings
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar - Mobile horizontal scroll */}
          <div className="lg:col-span-1">
            <div className="overflow-x-auto lg:overflow-x-visible">
              <nav className="flex lg:flex-col gap-2 lg:gap-1 lg:space-y-1 min-w-max lg:min-w-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key as any);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-[44px] ${
                      activeTab === tab.key
                        ? 'bg-sky-900/50 text-sky-400 border border-sky-800'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/50'
                    }`}
                  >
                    <span className="text-base sm:text-lg">{tab.icon}</span>
                    <span className="lg:block">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-900/50 border border-green-800 rounded-lg text-green-200">
                {success}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                    👤
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Personal Information</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Update your account details
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileChanges.username}
                      onChange={(e) => setProfileChanges(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileChanges.email}
                      onChange={(e) => setProfileChanges(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                      disabled
                      className="w-full px-4 py-4 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 min-h-[44px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors min-h-[44px]"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                    🔐
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Change Password</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Update your account password
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                      required
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent min-h-[44px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors min-h-[44px]"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* AI Connection Tab */}
            {activeTab === "ai" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">AI Connection</h2>
                    <p className="text-slate-400 text-sm">
                      Manage your AI integrations
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      OpenAI API Key
                    </label>
                    <div className="flex gap-3">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        {showApiKey ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      This is a mock setting. Your actual API key would be stored securely.
                    </p>
                  </div>

                  <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2">
                      <span>⚠️</span>
                      <span className="font-medium">Development Mode</span>
                    </div>
                    <p className="text-sm text-yellow-300">
                      AI integrations are currently in development. This section shows mock data for preview purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl">
                    🔔
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Notification Preferences</h2>
                    <p className="text-slate-400 text-sm">
                      Control what notifications you receive
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { key: "order_updates", label: "Order Updates", description: "Get notified when your order status changes" },
                    { key: "maker_messages", label: "Maker Messages", description: "Messages from makers working on your orders" },
                    { key: "system_updates", label: "System Updates", description: "Important platform updates and maintenance notices" },
                    { key: "marketing", label: "Marketing", description: "Tips, feature updates, and platform news" }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div>
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-sm text-slate-400">{item.description}</div>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(item.key as keyof typeof notifications)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications] ? 'bg-sky-600' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <span>ℹ️</span>
                      <span className="font-medium">Note</span>
                    </div>
                    <p className="text-sm text-blue-300">
                      These are mock notification settings for preview purposes. In production, changes would be saved automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center text-2xl">
                    ⚠️
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Danger Zone</h2>
                    <p className="text-slate-400 text-sm">
                      Irreversible and destructive actions
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border border-red-800 rounded-lg p-6 bg-red-900/10">
                    <h3 className="font-semibold text-red-400 mb-2">Delete Account</h3>
                    <p className="text-slate-300 text-sm mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => alert('Account deletion is not implemented in this demo.')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>

                  <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2">
                      <span>⚠️</span>
                      <span className="font-medium">Safety Notice</span>
                    </div>
                    <p className="text-sm text-yellow-300">
                      Account deletion is disabled in this demo. In production, this would permanently remove all your data.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}