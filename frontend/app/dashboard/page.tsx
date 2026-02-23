"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, MessageSquare, File, Printer, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { apiFetch } from "@/lib/api-client";

interface DashboardStats {
  myPosts: number;
  myOrders: number;
  myFiles: number;
  myNodes: number;
}

interface RecentPost {
  id: string;
  title: string;
  post_type: string;
  created_at: string;
  upvotes: number;
  comment_count: number;
  author_id?: string;
}

interface PostsResponse {
  posts?: RecentPost[];
}

interface OrdersResponse {
  as_customer?: unknown[];
  as_maker?: unknown[];
}

interface FilesResponse {
  files?: unknown[];
}

interface NodeItem {
  id: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchDashboardData = async () => {
      try {
        const [postsResponse, ordersResponse, filesResponse, nodesResponse] = await Promise.allSettled([
          apiFetch<RecentPost[] | PostsResponse>('/community/posts'),
          apiFetch<unknown[] | OrdersResponse>('/orders'),
          apiFetch<unknown[] | FilesResponse>('/files/my'),
          apiFetch<NodeItem[]>('/nodes/my-nodes'),
        ]);

        // Safely extract arrays from API responses (backends return various formats)
        const postsRaw = postsResponse.status === 'fulfilled' ? postsResponse.value : {};
        const allPosts: RecentPost[] = Array.isArray(postsRaw) ? postsRaw : ((postsRaw as PostsResponse)?.posts ?? []);
        const userPosts = allPosts.filter((post) => post.author_id === user?.id);
        
        const ordersRaw = ordersResponse.status === 'fulfilled' ? ordersResponse.value : {};
        const orders: unknown[] = Array.isArray(ordersRaw) ? ordersRaw : [...((ordersRaw as OrdersResponse)?.as_customer ?? []), ...((ordersRaw as OrdersResponse)?.as_maker ?? [])];
        
        const filesRaw = filesResponse.status === 'fulfilled' ? filesResponse.value : {};
        const files: unknown[] = Array.isArray(filesRaw) ? filesRaw : ((filesRaw as FilesResponse)?.files ?? []);
        
        const nodesRaw = nodesResponse.status === 'fulfilled' ? nodesResponse.value : [];
        const nodes: NodeItem[] = Array.isArray(nodesRaw) ? nodesRaw : [];

        setStats({
          myPosts: userPosts.length,
          myOrders: Array.isArray(orders) ? orders.length : 0,
          myFiles: Array.isArray(files) ? files.length : 0,
          myNodes: Array.isArray(nodes) ? nodes.length : 0,
        });

        // Set recent posts (latest 5)
        setRecentPosts(
          userPosts
            .sort((a: RecentPost, b: RecentPost) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        );
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setStats({
          myPosts: 0,
          myOrders: 0,
          myFiles: 0,
          myNodes: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user?.id]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return "Good evening";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "discussion": return "💬";
      case "request": return "🙋";
      case "task": return "📋";
      case "showcase": return "🏆";
      default: return "📝";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {getGreeting()}, {user?.username} 👋
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Welcome to your RealWorldClaw dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6 hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">My Posts</p>
              <p className="text-xl sm:text-2xl font-bold">
                {loading ? "—" : stats?.myPosts ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">My Orders</p>
              <p className="text-xl sm:text-2xl font-bold">
                {loading ? "—" : stats?.myOrders ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <File className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">My Files</p>
              <p className="text-xl sm:text-2xl font-bold">
                {loading ? "—" : stats?.myFiles ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">My Nodes</p>
              <p className="text-xl sm:text-2xl font-bold">
                {loading ? "—" : stats?.myNodes ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Link href="/community/new">
            <Card className="p-3 sm:p-4 hover:bg-accent/50 transition-colors cursor-pointer min-h-[120px] sm:min-h-[140px]">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-lg sm:text-xl">
                  💬
                </div>
                <h3 className="font-semibold mb-1 text-sm sm:text-base">New Post</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Share with community</p>
              </div>
            </Card>
          </Link>

          <Link href="/submit">
            <Card className="p-3 sm:p-4 hover:bg-accent/50 transition-colors cursor-pointer min-h-[120px] sm:min-h-[140px]">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center text-lg sm:text-xl">
                  📤
                </div>
                <h3 className="font-semibold mb-1 text-sm sm:text-base">Submit Design</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Upload your files</p>
              </div>
            </Card>
          </Link>

          <Link href="/register-node">
            <Card className="p-3 sm:p-4 hover:bg-accent/50 transition-colors cursor-pointer min-h-[120px] sm:min-h-[140px]">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-sky-500/20 text-sky-400 rounded-lg flex items-center justify-center text-lg sm:text-xl">
                  🤖
                </div>
                <h3 className="font-semibold mb-1 text-sm sm:text-base">Register Node</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Add your machine</p>
              </div>
            </Card>
          </Link>

          <Link href="/orders/new">
            <Card className="p-3 sm:p-4 hover:bg-accent/50 transition-colors cursor-pointer min-h-[120px] sm:min-h-[140px]">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-sky-500/20 text-sky-400 rounded-lg flex items-center justify-center text-lg sm:text-xl">
                  📋
                </div>
                <h3 className="font-semibold mb-1 text-sm sm:text-base">Create Order</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Start manufacturing</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">My Recent Posts</h2>
          <Link href="/community" className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium">
            <span className="hidden sm:inline">View All Posts</span>
            <span className="sm:hidden">View All</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 inline" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <Card className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getTypeIcon(post.post_type)}</span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {post.post_type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2 hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      👍 {post.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      💬 {post.comment_count}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Start sharing your ideas with the community
            </p>
            <Button asChild>
              <Link href="/community/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Post
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}