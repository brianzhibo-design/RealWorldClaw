"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCommunityPosts, CommunityPost, apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

export default function ProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const currentUser = useAuthStore((s) => s.user);
  const isOwnProfile = currentUser?.id === userId;

  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [userNodes, setUserNodes] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [karma, setKarma] = useState<number>(0);
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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

        // Load social data (karma, followers, following)
        try {
          const [karmaData, followersData, followingData] = await Promise.all([
            apiFetch<{ karma: number }>(`/social/karma/${userId}`).catch(() => ({ karma: 0 })),
            apiFetch<{ total?: number }>(`/social/followers/${userId}`).catch(() => ({ total: 0 })),
            apiFetch<{ total?: number }>(`/social/following/${userId}`).catch(() => ({ total: 0 })),
          ]);

          setKarma(karmaData.karma || 0);
          setFollowers(followersData.total || 0);
          setFollowing(followingData.total || 0);

          // Check if current user is following this user
          if (!isOwnProfile && currentUser) {
            try {
              const followStatus = await apiFetch<{ is_following: boolean }>(`/social/is-following/${userId}`);
              setIsFollowing(followStatus.is_following || false);
            } catch {
              setIsFollowing(false);
            }
          }
        } catch (err) {
          console.error("Failed to load social data:", err);
          // Don't show error, just use default values
        }

        // Load nodes and orders only for current user
        if (isOwnProfile) {
          // Load nodes
          try {
            setNodesLoading(true);
            const nodes = await apiFetch<any>('/nodes/my-nodes');
            setUserNodes(Array.isArray(nodes) ? nodes : nodes.nodes || []);
          } catch (err) {
            console.error("Failed to load nodes:", err);
            // Don't show error, just don't show nodes section
          } finally {
            setNodesLoading(false);
          }

          // Load orders
          try {
            setOrdersLoading(true);
            const orders = await apiFetch<any>('/orders');
            setUserOrders(Array.isArray(orders) ? orders : orders.orders || []);
          } catch (err) {
            console.error("Failed to load orders:", err);
            // Don't show error, just don't show orders section
          } finally {
            setOrdersLoading(false);
          }
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

  const handleFollowToggle = async () => {
    if (!currentUser || isOwnProfile || followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await apiFetch(`/social/follow/${userId}`, { method: 'DELETE' });
        setIsFollowing(false);
        setFollowers(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        await apiFetch(`/social/follow/${userId}`, { method: 'POST' });
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

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
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] rounded-lg transition-all">
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profileName || `User ${userId.slice(0, 8)}`}</h1>
              <p className="text-slate-400 mt-1">
                {isOwnProfile && currentUser ? currentUser.role : "Member"}
              </p>
              <p className="text-sky-400 mt-1 font-medium">⭐ Karma: {karma}</p>

              {/* Social stats */}
              <div className="flex items-center gap-6 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-sky-400">👥</span>
                  <span className="font-semibold">{followers}</span>
                  <span className="text-slate-400">followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-400">🔗</span>
                  <span className="font-semibold">{following}</span>
                  <span className="text-slate-400">following</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">📝</span>
                  <span className="font-semibold">{userPosts.length}</span>
                  <span className="text-slate-400">posts</span>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {isOwnProfile ? (
                <Link href="/settings" className="px-4 py-2 bg-slate-700 hover:bg-sky-500 rounded-lg text-sm transition-all hover:shadow-[0_0_18px_rgba(56,189,248,0.35)]">
                  Edit Profile
                </Link>
              ) : currentUser ? (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isFollowing
                      ? 'bg-slate-700 hover:bg-sky-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  } hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              ) : null}
            </div>
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
                    <span className="text-slate-400 text-sm">{formatTimeAgo(post.created_at)}</span>
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-sky-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                    {post.content.substring(0, 200)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-3">
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

        {/* Nodes Section (Only for current user) */}
        {isOwnProfile && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Nodes</h2>
            {nodesLoading ? (
              <div className="text-center py-8 bg-slate-900/50 border border-slate-800 rounded-xl">
                <div className="text-slate-400">Loading nodes...</div>
              </div>
            ) : userNodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userNodes.map((node: Record<string, string>) => (
                  <div key={node.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold">{node.device_brand} {node.device_model}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        node.status === 'online' ? 'bg-green-900/50 text-green-400 border border-green-700' : 
                        node.status === 'busy' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' :
                        'bg-red-900/50 text-red-400 border border-red-700'
                      }`}>
                        {node.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{node.description || 'No description'}</p>
                    <div className="text-xs text-slate-400">
                      <div>Type: {node.device_type}</div>
                      <div>Location: {node.location?.city}, {node.location?.country}</div>
                      {node.build_volume && (
                        <div>Build Volume: {node.build_volume.x}×{node.build_volume.y}×{node.build_volume.z}mm</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
                <div className="text-4xl mb-3">🖨️</div>
                <p className="text-slate-400 mb-4">No nodes registered yet</p>
                <Link href="/register-node" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] rounded-lg text-sm transition-all">
                  Register Node
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Orders Section (Only for current user) */}
        {isOwnProfile && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Orders</h2>
            {ordersLoading ? (
              <div className="text-center py-8 bg-slate-900/50 border border-slate-800 rounded-xl">
                <div className="text-slate-400">Loading orders...</div>
              </div>
            ) : userOrders.length > 0 ? (
              <div className="space-y-4">
                {userOrders.slice(0, 5).map((order: Record<string, string>) => (
                  <Link 
                    key={order.id} 
                    href={`/orders/${order.id}`}
                    className="block bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{order.order_number || `Order ${order.id.slice(0, 8)}`}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' ? 'bg-green-900/50 text-green-400 border border-green-700' :
                        order.status === 'printing' ? 'bg-blue-900/50 text-blue-400 border border-blue-700' :
                        order.status === 'shipping' ? 'bg-purple-900/50 text-purple-400 border border-purple-700' :
                        order.status === 'accepted' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' :
                        'bg-slate-900/50 text-slate-400 border border-slate-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2 line-clamp-1">
                      {order.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{order.material}</span>
                      <span>Qty: {order.quantity}</span>
                      <span>{formatTimeAgo(order.created_at)}</span>
                    </div>
                  </Link>
                ))}
                {userOrders.length > 5 && (
                  <div className="text-center">
                    <Link href="/orders" className="text-sky-400 hover:text-sky-300 text-sm">
                      View all {userOrders.length} orders →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-slate-400 mb-4">No orders yet</p>
                <Link href="/orders/new" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] rounded-lg text-sm transition-all">
                  Create Order
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}