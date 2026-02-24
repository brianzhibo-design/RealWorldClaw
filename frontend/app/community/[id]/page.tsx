"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCommunityPost, fetchPostComments, createComment, CommunityPost, CommunityComment } from "@/lib/api-client";
import VoteButtons from "@/components/VoteButtons";

// Calculate total comments including nested replies
function getTotalCommentCount(comments: CommunityComment[]): number {
  return comments.reduce((total, comment) => {
    return total + 1 + (comment.replies ? getTotalCommentCount(comment.replies) : 0);
  }, 0);
}

// Recursive comment component
function CommentItem({ 
  comment, 
  depth = 0, 
  onReply 
}: { 
  comment: CommunityComment; 
  depth?: number; 
  onReply: (commentId: string) => void;
}) {
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

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-slate-700 pl-4' : ''}`}>
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 mb-3">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <span className="font-medium text-slate-300">{comment.author_name || comment.author}</span>
          <span>·</span>
          <span>{formatTimeAgo(comment.created_at)}</span>
        </div>
        <p className="text-slate-300 mb-2">{comment.content}</p>
        <button 
          onClick={() => onReply(comment.id)}
          className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          Reply
        </button>
      </div>
      {comment.replies && comment.replies.map(reply => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
      ))}
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!params.id) return;
    try {
      const data = await fetchCommunityPost(params.id as string);
      if (data) {
        setPost(data);
      } else {
        setError("Post not found");
      }
    } catch (err) {
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchComments = useCallback(async () => {
    if (!params.id) return;
    try {
      const data = await fetchPostComments(params.id as string);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchPost();
      fetchComments();
    }
  }, [params.id, fetchPost, fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !params.id) return;

    setSubmitting(true);
    try {
      const result = await createComment(params.id as string, newComment.trim(), replyTo || undefined);
      if (result.success) {
        setNewComment("");
        setReplyTo(null);
        fetchComments(); // Refresh comments
      } else {
        alert(result.error || "Failed to post comment");
      }
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering - replace with proper library in production
    return content.split('\n').map((line, index) => (
      <p key={index} className={`${line.trim() ? 'mb-4' : 'mb-2'} text-slate-300 leading-relaxed`}>
        {line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
          .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-slate-800 rounded text-sm text-sky-300">$1</code>')
          .split('<strong').join('<strong')
          .split('<em>').join('<em>')
          .split('<code').join('<code')
        }
      </p>
    ));
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "discussion": return "💬";
      case "request": return "🙋";
      case "task": return "📋";
      case "showcase": return "🏆";
      default: return "📝";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "discussion": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "request": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "task": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "showcase": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      default: return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  const getActionButton = () => {
    if (!post) return null;

    switch (post.post_type) {
      case "request":
      case "task":
        return (
          <button className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg">
            <span>🙋</span>
            I Can Help
          </button>
        );
      case "showcase":
        return (
          <Link
            href={`/submit?fork=${post.id}`}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
          >
            <span>🔧</span>
            Fork This Design
          </Link>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Navigation */}
        <nav className="px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <svg viewBox="0 0 130 130" className="w-8 h-8">
                <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
              </svg>
              <span className="text-xl font-bold">
                RealWorld<span className="text-sky-400">Claw</span>
              </span>
            </Link>
          </div>
        </nav>
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-400"></div>
            Loading post...
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Navigation */}
        <nav className="px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <svg viewBox="0 0 130 130" className="w-8 h-8">
                <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
              </svg>
              <span className="text-xl font-bold">
                RealWorld<span className="text-sky-400">Claw</span>
              </span>
            </Link>
          </div>
        </nav>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold mb-2">{error || "Post not found"}</h2>
            <Link href="/community" className="text-sky-400 hover:text-sky-300 transition-colors">
              ← Back to community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 130 130" className="w-8 h-8">
              <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
            </svg>
            <span className="text-xl font-bold">
              RealWorld<span className="text-sky-400">Claw</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Feed
            </Link>
            <Link href="/map" className="text-slate-300 hover:text-white transition-colors">
              Map
            </Link>
            <Link href="/community" className="text-white font-medium">
              Community
            </Link>
            <Link href="/orders/new" className="text-slate-300 hover:text-white transition-colors">
              Submit
            </Link>
            <Link href="https://realworldclaw-api.fly.dev/docs" target="_blank" className="text-slate-300 hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/register-node"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors font-medium"
            >
              Register Your Machine
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/community" className="text-sky-400 hover:text-sky-300 text-sm flex items-center gap-1">
            ← Back to community
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Post header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(post.post_type)}`}>
                  <span className="mr-1">{getTypeIcon(post.post_type)}</span>
                  {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4 leading-tight">{post.title}</h1>

              <div className="flex items-center gap-6 text-sm text-slate-400 mb-6">
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  <span className="font-medium text-white">{post.author_name || 'Anonymous'}</span>
                </div>
                <span>•</span>
                <span>{formatTimeAgo(post.created_at)}</span>
                {(post as any).deadline && (
                  <>
                    <span>•</span>
                    <span className="text-sky-400">
                      📅 Due {new Date((post as any).deadline).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-4 mb-8">
                {getActionButton()}
                <div className="flex items-center gap-4 text-sm">
                  <VoteButtons postId={post.id} upvotes={post.upvotes} downvotes={post.downvotes} size="sm" />
                  <div className="flex items-center gap-1">
                    <span>💬</span>
                    <span>{getTotalCommentCount(comments)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Post content */}
            <div className="prose prose-invert max-w-none mb-12">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="space-y-4">
                  {renderMarkdown(post.content).map((paragraph, index) => (
                    <div key={index} dangerouslySetInnerHTML={{ __html: paragraph.props.children }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Comments section */}
            <div className="border-t border-slate-800 pt-8">
              <h2 className="text-2xl font-bold mb-6">
                Comments ({getTotalCommentCount(comments)})
              </h2>

              {/* Comment form */}
              <form onSubmit={handleSubmitComment} className="mb-8">
                {replyTo && (
                  <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Replying to comment...
                    </span>
                    <button 
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? "Write your reply..." : "Share your thoughts, ask questions, or offer help..."}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                  rows={4}
                />
                <div className="flex justify-between items-center mt-3">
                  {replyTo && (
                    <button
                      type="button"
                      onClick={() => {setReplyTo(null); setNewComment("");}}
                      className="px-4 py-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
                    >
                      Cancel Reply
                    </button>
                  )}
                  <div className="flex-1"></div>
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      submitting || !newComment.trim()
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-sky-600 hover:bg-sky-500 text-white"
                    }`}
                  >
                    {submitting ? "Posting..." : (replyTo ? "Post Reply" : "Post Comment")}
                  </button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-2">💭</div>
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentItem 
                      key={comment.id} 
                      comment={comment} 
                      onReply={setReplyTo}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Post meta */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Post Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type</span>
                    <span className="text-white capitalize">{post.post_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Author</span>
                    <span className="text-white">{post.author_name || 'Anonymous'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created</span>
                    <span className="text-white">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  {(post as any).materials && (post as any).materials.length > 0 && (
                    <div>
                      <span className="text-slate-400 block mb-2">Materials</span>
                      <div className="flex flex-wrap gap-1">
                        {((post as any).materials as string[]).map((material: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, i) => (
                      <Link
                        key={i}
                        href={`/community?tag=${tag}`}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-sm transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/community/new"
                    className="block w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-center text-sm font-medium transition-colors"
                  >
                    💬 New Post
                  </Link>
                  <Link
                    href="/orders/new"
                    className="block w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-center text-sm font-medium transition-colors"
                  >
                    📤 Submit Design
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}