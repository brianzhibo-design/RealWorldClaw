"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  type: "design" | "showcase" | "discussion";
  design_file_id?: string;
  preview_image?: string;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  created_at: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/community/posts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
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
    try {
      const response = await fetch(`${API_URL}/community/posts/${params.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : data.comments || []);
      }
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
    if (!newComment.trim()) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      alert("Please sign in to comment");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/community/posts/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments(); // Refresh comments
      } else {
        alert("Failed to post comment");
      }
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering - in production, use a proper markdown library
    return content
      .split('\n\n')
      .map((paragraph, index) => (
        <p key={index} className="mb-4 text-slate-300 leading-relaxed">
          {paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                   .replace(/\*(.*?)\*/g, '<em>$1</em>')
                   .split('<strong>').join('<strong class="font-semibold text-white">').split('</strong>').join('</strong>')
                   .split('<em>').join('<em class="italic">').split('</em>').join('</em>')
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
      case "design": return "🎨";
      case "showcase": return "✨";
      case "discussion": return "💬";
      default: return "📝";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-xl font-bold mb-2">{error || "Post not found"}</h2>
          <a href="/community" className="text-sky-400 hover:underline">
            ← Back to community
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="/community" className="text-sky-400 hover:text-sky-300 text-sm flex items-center gap-1 mb-2">
            ← Back to community
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Post header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{getTypeIcon(post.type)}</span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm font-medium uppercase tracking-wide">
              {post.type}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
            <span className="flex items-center gap-1">
              👤 {post.author}
            </span>
            <span>·</span>
            <span>{formatTimeAgo(post.created_at)}</span>
          </div>

          {/* Design file button */}
          {post.design_file_id && (
            <div className="mb-6">
              <a
                href={`/print/${post.design_file_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-sm font-medium transition-colors"
              >
                🖨️ Print this design →
              </a>
            </div>
          )}
        </div>

        {/* Preview image */}
        {post.preview_image && (
          <div className="mb-8">
            <img
              src={post.preview_image}
              alt={post.title}
              className="w-full max-h-96 object-cover rounded-lg bg-slate-800"
            />
          </div>
        )}

        {/* Post content */}
        <div className="prose prose-invert max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content).join('') }} />
        </div>

        {/* Comments section */}
        <div className="border-t border-slate-800 pt-8">
          <h2 className="text-xl font-bold mb-6">Comments ({comments.length})</h2>

          {/* Comment form */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-md text-sm font-medium transition-colors"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-2">💭</div>
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-medium text-white">👤 {comment.author}</span>
                    <span className="text-sm text-slate-400">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}