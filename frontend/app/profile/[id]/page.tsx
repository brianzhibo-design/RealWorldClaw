"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCommunityPosts, CommunityPost } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function ProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const currentUser = useAuthStore((s) => s.user);
  const isOwnProfile = currentUser?.id === userId;

  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive user info from their posts or current user
  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isOwnProfile && currentUser) {
          setProfileName(currentUser.username);
        }

        // Fetch posts to find user's activity
        const allPosts = await fetchCommunityPosts();
        const filtered = allPosts.filter(
          (post) => post.author_id === userId || post.author === profileName
        );
        setUserPosts(filtered);

        // If we didn't have the name yet, try to get it from posts
        if (!profileName && filtered.length > 0) {
          setProfileName(filtered[0].author);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, isOwnProfile, currentUser, profileName]);

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex items-center justify-center">
        <div className="text-slate-400">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-3xl">
              {profileName ? profileName[0].toUpperCase() : "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profileName || `User ${userId.slice(0, 8)}`}</h1>
              <p className="text-slate-400 mt-1">
                {isOwnProfile && currentUser ? currentUser.role : "Member"}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {userPosts.length} post{userPosts.length !== 1 ? "s" : ""}
              </p>
            </div>
            {isOwnProfile && (
              <Link href="/settings" className="ml-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* User Posts */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Posts</h2>
          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-sky-900/50 text-sky-300 border border-sky-700 rounded text-xs font-medium">
                      {post.post_type}
                    </span>
                    <span className="text-slate-500 text-sm">{formatTimeAgo(post.created_at)}</span>
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-sky-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                    {post.content.substring(0, 200)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-3">
                    <span>👍 {post.upvotes}</span>
                    <span>💬 {post.comment_count}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-slate-400">No posts yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
