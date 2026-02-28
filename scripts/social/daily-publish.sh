#!/usr/bin/env bash
# 每日定时发布 — 4平台按限额发帖
# Cron: 0 10 * * * ~/Desktop/Realworldclaw/scripts/social/daily-publish.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="/tmp/daily-publish.log"
DRY_RUN=""
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN="--dry-run"

ts() { date '+%Y-%m-%d %H:%M:%S'; }

log() { echo "[$(ts)] $*" | tee -a "$LOG"; }

log "========== 每日发布开始 ${DRY_RUN:+(dry-run)} =========="

# 1. 社区 (限5条)
log "▶ [1/4] 社区发帖 (限5条)"
if [[ -x "$SCRIPT_DIR/community-post.sh" ]]; then
    "$SCRIPT_DIR/community-post.sh" --count 5 $DRY_RUN >> "$LOG" 2>&1 || log "⚠️ 社区发帖失败 (exit $?)"
else
    log "⏭️ community-post.sh 不存在或不可执行，跳过"
fi

# 2. X/Twitter (限2条)
log "▶ [2/4] X发帖 (限2条)"
python3 "$SCRIPT_DIR/post_x.py" --count 2 $DRY_RUN >> "$LOG" 2>&1 || log "⚠️ X发帖失败 (exit $?)"

# 3. 小红书 (限2条)
log "▶ [3/4] 小红书发帖 (限2条)"
python3 "$SCRIPT_DIR/post_xhs_v2.py" --count 2 $DRY_RUN >> "$LOG" 2>&1 || log "⚠️ 小红书发帖失败 (exit $?)"

# 4. Moltbook (限5条)
log "▶ [4/4] Moltbook发帖 (限5条)"
python3 "$SCRIPT_DIR/post_moltbook.py" --count 5 $DRY_RUN >> "$LOG" 2>&1 || log "⚠️ Moltbook发帖失败 (exit $?)"

log "========== 每日发布完成 =========="
