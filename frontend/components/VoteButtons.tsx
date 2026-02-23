"use client";

import { useState } from "react";

interface VoteButtonsProps {
  upvotes: number;
  downvotes?: number;
  userVote?: 'up' | 'down' | null;
  postId: string;
  onVote?: (postId: string, voteType: 'up' | 'down') => void;
  size?: 'sm' | 'md';
}

export default function VoteButtons({ 
  upvotes, 
  downvotes = 0, 
  userVote = null, 
  postId, 
  onVote,
  size = 'md'
}: VoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState(userVote);
  const [voteCount, setVoteCount] = useState(upvotes - downvotes);

  const handleVote = async (voteType: 'up' | 'down') => {
    try {
      // Mock API call - 实际实现中应调用API
      // await fetch(`/api/v1/community/posts/${postId}/vote`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ vote_type: voteType })
      // });
      
      let newCount = voteCount;
      let newVote = currentVote;

      if (currentVote === voteType) {
        // Remove vote
        newVote = null;
        newCount += voteType === 'up' ? -1 : 1;
      } else {
        // Change vote or add new vote
        if (currentVote) {
          // Changing from opposite vote
          newCount += voteType === 'up' ? 2 : -2;
        } else {
          // Adding new vote
          newCount += voteType === 'up' ? 1 : -1;
        }
        newVote = voteType;
      }

      setCurrentVote(newVote);
      setVoteCount(newCount);
      
      if (onVote) {
        onVote(postId, voteType);
      }
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const buttonSize = size === 'sm' ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-base';
  const containerSize = size === 'sm' ? 'gap-1' : 'gap-2';

  return (
    <div className={`flex flex-col items-center ${containerSize}`}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('up')}
        className={`${buttonSize} rounded-md border transition-all hover:scale-110 ${
          currentVote === 'up'
            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-orange-500 hover:text-orange-400'
        }`}
        title="Upvote"
      >
        ⬆️
      </button>

      {/* Vote Count */}
      <span className={`font-bold ${
        voteCount > 0 ? 'text-orange-400' : 
        voteCount < 0 ? 'text-blue-400' : 
        'text-slate-400'
      } ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {voteCount > 0 ? '+' : ''}{voteCount}
      </span>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('down')}
        className={`${buttonSize} rounded-md border transition-all hover:scale-110 ${
          currentVote === 'down'
            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400'
        }`}
        title="Downvote"
      >
        ⬇️
      </button>
    </div>
  );
}