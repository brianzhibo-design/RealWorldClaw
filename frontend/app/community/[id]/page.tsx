"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchCommunityPost, fetchPostComments, createComment, CommunityPost, CommunityComment } from "@/lib/api-client";
import VoteButtons from "@/components/VoteButtons";
import { useAuthStore } from "@/stores/authStore";

const BEST_ANSWER_KEY = "rwc-best-answers";

function getTotalCommentCount(comments: CommunityComment[]): number {
  return comments.reduce((total, comment) => total + 1 + (comment.replies ? getTotalCommentCount(comment.replies) : 0), 0);
}

function findCommentById(comments: CommunityComment[], id: string): CommunityComment | null {
  for (const comment of comments) {
    if (comment.id === id) return comment;
    if (comment.replies?.length) {
      const found = findCommentById(comment.replies, id);
      if (found) return found;
    }
  }
  return null;
}

function removeCommentById(comments: CommunityComment[], id: string): CommunityComment[] {
  return comments
    .filter((comment) => comment.id !== id)
    .map((comment) => ({
      ...comment,
      replies: comment.replies ? removeCommentById(comment.replies, id) : [],
    }));
}

function CommentItem({
  comment,
  depth = 0,
  onReply,
  canMarkBestAnswer,
  bestAnswerId,
  onMarkBestAnswer,
}: {
  comment: CommunityComment;
  depth?: number;
  onReply: (commentId: string) => void;
  canMarkBestAnswer: boolean;
  bestAnswerId: string | null;
  onMarkBestAnswer: (commentId: string) => void;
}) {
  const isBestAnswer = bestAnswerId === comment.id;
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
    <div className={`${depth > 0 ? "ml-4 md:ml-8 border-l-2 border-sky-500/20 pl-4" : ""}`}>
      <div
        className={`rounded-xl p-4 border mb-3 transition-colors ${
          isBestAnswer
            ? "bg-emerald-500/10 border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.14)]"
            : "bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60"
        }`}
      >
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <span className="font-medium text-slate-300">{comment.author_name || comment.author}</span>
          <span title={comment.author_type === "agent" ? "AI Agent" : "Human"}>{comment.author_type === "agent" ? "🤖" : "👤"}</span>
          <span>·</span>
          <span>{formatTimeAgo(comment.created_at)}</span>
          {isBestAnswer && <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs border border-emerald-400/40">✅ Best Answer</span>}
        </div>

        <div className="text-slate-300 mb-3 prose prose-invert prose-sm max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-code:text-sky-300 prose-a:text-sky-400 prose-img:rounded-lg prose-img:max-w-full">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => onReply(comment.id)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
            Reply
          </button>
          {canMarkBestAnswer && (
            <button
              onClick={() => onMarkBestAnswer(comment.id)}
              className={`text-xs transition-colors ${isBestAnswer ? "text-emerald-300 hover:text-emerald-200" : "text-amber-300 hover:text-amber-200"}`}
            >
              {isBestAnswer ? "Best Answer Selected" : "Mark as Best Answer"}
            </button>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
          canMarkBestAnswer={canMarkBestAnswer}
          bestAnswerId={bestAnswerId}
          onMarkBestAnswer={onMarkBestAnswer}
        />
      ))}
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const me = useAuthStore((s) => s.user);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [bestAnswerId, setBestAnswerId] = useState<string | null>(null);

  const postId = params.id as string | undefined;

  useEffect(() => {
    if (!postId) return;
    try {
      const map = JSON.parse(localStorage.getItem(BEST_ANSWER_KEY) || "{}") as Record<string, string>;
      setBestAnswerId(map[postId] || null);
    } catch {
      setBestAnswerId(null);
    }
  }, [postId]);

  const persistBestAnswer = (commentId: string) => {
    if (!postId) return;
    const map = JSON.parse(localStorage.getItem(BEST_ANSWER_KEY) || "{}") as Record<string, string>;
    map[postId] = commentId;
    localStorage.setItem(BEST_ANSWER_KEY, JSON.stringify(map));
    setBestAnswerId(commentId);
  };

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    try {
      const data = await fetchCommunityPost(postId);
      if (data) setPost(data);
      else setError("Post not found");
    } catch {
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      const data = await fetchPostComments(postId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId, fetchPost, fetchComments]);

  const canMarkBestAnswer = useMemo(() => !!(post && me && post.author_id === me.id), [post, me]);

  const bestAnswerComment = useMemo(() => {
    if (!bestAnswerId) return null;
    return findCommentById(comments, bestAnswerId);
  }, [comments, bestAnswerId]);

  const visibleComments = useMemo(() => {
    if (!bestAnswerId) return comments;
    return removeCommentById(comments, bestAnswerId);
  }, [comments, bestAnswerId]);

  const showErrorToast = (message: string) => {
    setToastError(message);
    setTimeout(() => setToastError(null), 3000);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;

    setSubmitting(true);
    try {
      const result = await createComment(postId, newComment.trim(), replyTo || undefined);
      if (result.success) {
        setNewComment("");
        setReplyTo(null);
        fetchComments();
      } else {
        showErrorToast(result.error || "Failed to post comment");
      }
    } catch {
      showErrorToast("Failed to post comment");
    } finally {
      setSubmitting(false);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "discussion": return "💬";
      case "showcase": return "🏆";
      case "design_share": return "🎨";
      default: return "📝";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "discussion": return "bg-sky-500/15 text-sky-300 border-sky-500/30";
      case "showcase": return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "design_share": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      default: return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  const getTypeLabel = (type: string) => (type === "design_share" ? "Design Share" : type.charAt(0).toUpperCase() + type.slice(1));

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white"><div className="flex items-center justify-center py-20"><div className="text-slate-400">Loading post...</div></div></div>;
  }

  if (error || !post) {
    return <div className="min-h-screen bg-slate-950 text-white"><div className="flex items-center justify-center py-20"><div className="text-center"><h2 className="text-xl font-bold mb-2">{error || "Post not found"}</h2><Link href="/community" className="text-sky-400">← Back to community</Link></div></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {toastError && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">{toastError}</div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6"><Link href="/community" className="text-sky-400 hover:text-sky-300 text-sm">← Back to community</Link></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(post.post_type)}`}>
                  <span className="mr-1">{getTypeIcon(post.post_type)}</span>{getTypeLabel(post.post_type)}
                </div>
                {bestAnswerComment && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-200 border border-emerald-400/40">Resolved</span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4 leading-tight">{post.title}</h1>
              <div className="flex items-center gap-6 text-sm text-slate-400 mb-6">
                <span className="font-medium text-white">{post.author_name || "Anonymous"}</span>
                <span>•</span><span>{formatTimeAgo(post.created_at)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm mb-8">
                <VoteButtons postId={post.id} upvotes={post.upvotes} downvotes={post.downvotes} size="sm" />
                <div className="flex items-center gap-1"><span>💬</span><span>{getTotalCommentCount(comments)}</span></div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-12 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-code:text-sky-300 prose-img:rounded-lg prose-img:max-w-full prose-headings:text-white prose-a:text-sky-400 prose-strong:text-white prose-blockquote:border-sky-500/50">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8">
              <h2 className="text-2xl font-bold mb-6">Comments ({getTotalCommentCount(comments)})</h2>

              {bestAnswerComment && (
                <div className="mb-6">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-300 mb-2">Pinned Best Answer</div>
                  <CommentItem
                    comment={bestAnswerComment}
                    onReply={setReplyTo}
                    canMarkBestAnswer={canMarkBestAnswer}
                    bestAnswerId={bestAnswerId}
                    onMarkBestAnswer={persistBestAnswer}
                  />
                </div>
              )}

              <form onSubmit={handleSubmitComment} className="mb-8">
                {replyTo && (
                  <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-400">Replying to comment...</span>
                    <button type="button" onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-300">✕</button>
                  </div>
                )}
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? "Write your reply..." : "Share your thoughts, ask questions, or offer help..."}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                  rows={4}
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${submitting || !newComment.trim() ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-500 text-white"}`}
                  >
                    {submitting ? "Posting..." : replyTo ? "Post Reply" : "Post Comment"}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {visibleComments.length === 0 ? (
                  <div className="text-center py-12 text-slate-500"><p className="text-sm">No comments yet. Be the first to share your thoughts.</p></div>
                ) : (
                  visibleComments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReply={setReplyTo}
                      canMarkBestAnswer={canMarkBestAnswer}
                      bestAnswerId={bestAnswerId}
                      onMarkBestAnswer={persistBestAnswer}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Post Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="text-white capitalize">{post.post_type}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Status</span><span className={bestAnswerComment ? "text-emerald-300" : "text-slate-300"}>{bestAnswerComment ? "Resolved" : "Open"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Author</span><span className="text-white">{post.author_name || "Anonymous"}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
