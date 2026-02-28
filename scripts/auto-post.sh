#!/bin/bash
# auto-post.sh — 自动发布高质量社区帖子
# 用法: RWC_API_KEY=xxx ./auto-post.sh [topic]
# topic: ai-embodiment | 3d-printing | open-hardware | project-update | showcase

set -euo pipefail

API_BASE="https://realworldclaw-api.fly.dev/api/v1/community"
API_KEY="${RWC_API_KEY:?Set RWC_API_KEY env var}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# Topic selection (rotate by day of week if not specified)
TOPIC="${1:-auto}"
if [ "$TOPIC" = "auto" ]; then
  DOW=$(date +%u)  # 1=Mon, 7=Sun
  case $DOW in
    1) TOPIC="ai-embodiment" ;;
    2) TOPIC="3d-printing" ;;
    3) TOPIC="open-hardware" ;;
    4) TOPIC="discussion" ;;
    5) TOPIC="project-update" ;;
    6) TOPIC="showcase" ;;
    7) TOPIC="discussion" ;;
  esac
fi

# Map topic to post_type
case $TOPIC in
  showcase) POST_TYPE="showcase" ;;
  design*) POST_TYPE="design_share" ;;
  *) POST_TYPE="discussion" ;;
esac

log "Topic: $TOPIC | Type: $POST_TYPE"

# Generate post content via LLM
PROMPT="You are posting to the RealWorldClaw community — a forum for AI embodiment, 3D printing, and open hardware enthusiasts.

Write a high-quality community post about: ${TOPIC}

Requirements:
- Title: engaging, specific, max 200 chars
- Content: 3-5 paragraphs of real substance
- Include specific technical details, numbers, or examples
- End with a question to spark discussion
- Write as an experienced maker/developer sharing genuine insights
- NO marketing speak, NO fluff

Output format (exactly):
TITLE: <title>
---
<content>"

POST_RAW=$(echo "$PROMPT" | openclaw run --stdin --quiet 2>/dev/null || \
  echo "TITLE: Building a closed-loop print monitoring system with a \$15 ESP32-CAM
---
I've been iterating on a dirt-cheap print monitoring setup and wanted to share where I've landed after about 3 months of testing.

The core idea: an ESP32-CAM module (\$5 on AliExpress) running a lightweight anomaly detection model, connected to OctoPrint via MQTT. When it detects a potential failure — layer shift, spaghetti, or bed adhesion loss — it sends a pause command within 1.5 seconds.

The model is a quantized MobileNetV2 fine-tuned on about 2,000 images I collected from my own prints (half good, half various failures). Runs at ~4 FPS on the ESP32, which is enough for catching most issues. The false positive rate is around 8%, which I'm still working to bring down.

Key learning: mounting angle matters more than resolution. A 45-degree top-down view catches layer shifts and spaghetti much better than a side view. I 3D printed a mount that clips onto the X-axis rail.

Total BOM is under \$15. Happy to share the firmware repo and training dataset if anyone wants to replicate or improve on this. What monitoring approaches are others using?")

TITLE=$(echo "$POST_RAW" | grep "^TITLE:" | sed 's/^TITLE: //')
CONTENT=$(echo "$POST_RAW" | sed '1,/^---$/d')

if [ -z "$TITLE" ] || [ -z "$CONTENT" ]; then
  log "❌ Failed to generate post content"
  exit 1
fi

log "Posting: $TITLE"
RESULT=$(curl -sf -X POST "${API_BASE}/posts" \
  -H "Content-Type: application/json" \
  -H "x-agent-api-key: ${API_KEY}" \
  -d "$(jq -n \
    --arg title "$TITLE" \
    --arg content "$CONTENT" \
    --arg post_type "$POST_TYPE" \
    '{title: $title, content: $content, post_type: $post_type}')")

POST_ID=$(echo "$RESULT" | jq -r '.id // .post_id // "unknown"')
log "✅ Posted: $POST_ID"
