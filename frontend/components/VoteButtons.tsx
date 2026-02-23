"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api-client";

interface VoteButtonsProps {
  upvotes: number;
  downvotes?: number;
  userVote?: 'up' | 'down' | null;
  postId: string;
  size?: 'sm' | 'md';
}

export default function VoteButtons({ 
  upvotes, 
  downvotes = 0, 
  userVote = null, 
  postId, 
  size = 'md'
}: VoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState(userVote);
  const [voteCount, setVoteCount] = useState(upvotes - downvotes);
  const [loading, setLoading] = useState(false);

  const handleVote = async (voteType: 'up' | 'down') => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ vote_type: voteType })
      });
      if (res.ok) {
        const data = await res.json();
        setVoteCount((data.upvotes ?? upvotes) - (data.downvotes ?? downvotes));
        setCurrentVote(data.user_vote === voteType ? voteType : null);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const buttonSize = size === 'sm' ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-base';

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote('up')}
        disabled={loading}
        aria-label="Upvote"
        className={`${buttonSize} rounded-md border transition-all hover:scale-110 ${
          currentVote === 'up'
            ? 'bg-sky-500/20 border-sky-500 text-sky-400'
            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-sky-500 hover:text-sky-400'
        }`}
      >▲</button>
      <span className={`font-bold text-sm ${
        voteCount > 0 ? 'text-sky-400' : voteCount < 0 ? 'text-blue-400' : 'text-slate-400'
      }`}>{voteCount}</span>
      <button
        onClick={() => handleVote('down')}
        disabled={loading}
        className={`${buttonSize} rounded-md border transition-all hover:scale-110 ${
          currentVote === 'down'
            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400'
        }`}
      >▼</button>
    </div>
  );
}
