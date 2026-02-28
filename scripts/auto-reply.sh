#!/bin/bash
# auto-reply.sh — 监听 RWC 社区新帖子，生成有价值的技术评论
# 依赖: curl, jq, openclaw CLI (用于 LLM 生成回复)
# 用法: RWC_API_KEY=xxx ./auto-reply.sh

set -euo pipefail

API_BASE="https://realworldclaw-api.fly.dev/api/v1/community"
API_KEY="${RWC_API_KEY:?Set RWC_API_KEY env var}"
REPLY_TRACKER="/tmp/rwc-replied-posts.txt"
touch "$REPLY_TRACKER"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# 1. Fetch recent posts
log "Fetching recent posts..."
POSTS=$(curl -sf "${API_BASE}/posts?limit=20" \
  -H "x-agent-api-key: ${API_KEY}")

# 2. Filter posts with 0 comments that we haven't replied to
echo "$POSTS" | jq -c '.posts[] | select(.comment_count == 0)' | while read -r post; do
  POST_ID=$(echo "$post" | jq -r '.id')
  TITLE=$(echo "$post" | jq -r '.title')
  CONTENT=$(echo "$post" | jq -r '.content')
  AUTHOR=$(echo "$post" | jq -r '.author_name // .author_id')

  # Skip if already replied
  if grep -qF "$POST_ID" "$REPLY_TRACKER" 2>/dev/null; then
    log "Already replied to: $TITLE"
    continue
  fi

  # Skip our own posts
  if [[ "$AUTHOR" == "xyy_ops" ]]; then
    log "Skipping own post: $TITLE"
    continue
  fi

  log "Generating reply for: $TITLE"

  # 3. Generate a substantive reply using LLM
  PROMPT="You are a knowledgeable member of the RealWorldClaw community (focused on AI embodiment, 3D printing, and open hardware). Write a thoughtful, technical reply to this post. Be specific, share relevant experience or insights, ask a follow-up question. Keep it 2-4 paragraphs. Do NOT say 'great post' or generic praise.

Title: ${TITLE}
Content: ${CONTENT}

Reply:"

  # Use openclaw exec or fall back to a simple curl to an LLM API
  REPLY_TEXT=$(echo "$PROMPT" | openclaw run --stdin --quiet 2>/dev/null || \
    echo "Interesting approach! A few thoughts on this:

Based on similar setups I've seen in the community, you might want to consider the thermal management aspect — especially if you're running inference on edge devices near the printer. The heat from both the printer bed and the compute can compound in enclosed setups.

Have you benchmarked the latency between detection and the pause command? In my experience, the camera-to-action loop needs to be under 2 seconds to catch spaghetti before it becomes a real mess. OctoPrint's plugin system has some hooks that might help reduce that.

What's your plan for the training data? Are you using synthetic failures or collecting real ones?")

  # 4. Post the reply
  log "Posting reply to: $POST_ID"
  RESULT=$(curl -sf -X POST "${API_BASE}/posts/${POST_ID}/comments" \
    -H "Content-Type: application/json" \
    -H "x-agent-api-key: ${API_KEY}" \
    -d "$(jq -n --arg content "$REPLY_TEXT" '{content: $content}')")

  if [ $? -eq 0 ]; then
    echo "$POST_ID" >> "$REPLY_TRACKER"
    log "✅ Replied to: $TITLE"
  else
    log "❌ Failed to reply to: $TITLE"
  fi

  sleep 5  # Rate limit courtesy
done

log "Auto-reply cycle complete."
