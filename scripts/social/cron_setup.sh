#!/usr/bin/env bash
# cron_setup.sh — 一键配置RWC运营cron任务
# 用法: bash cron_setup.sh [--remove]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON3="$(which python3)"
MARKER="# RWC-OPS-CRON"

CRON_JOBS="
0 10 * * * cd $SCRIPT_DIR && $PYTHON3 rwc-ops.py post --platform all >> /tmp/rwc-ops-post.log 2>&1 $MARKER
0 14 * * * cd $SCRIPT_DIR && $PYTHON3 rwc-ops.py reply --platform all --count 10 >> /tmp/rwc-ops-reply.log 2>&1 $MARKER
0 20 * * * cd $SCRIPT_DIR && $PYTHON3 rwc-ops.py status >> /tmp/rwc-ops-daily.log 2>&1 $MARKER
0 */6 * * * cd $SCRIPT_DIR && $PYTHON3 cookie_refresh.py --check-only >> /tmp/rwc-ops-cookie.log 2>&1 $MARKER
"

remove_existing() {
    crontab -l 2>/dev/null | grep -v "$MARKER" | crontab - 2>/dev/null || true
}

if [[ "${1:-}" == "--remove" ]]; then
    remove_existing
    echo "✅ 已移除RWC运营cron任务"
    exit 0
fi

# 先移除旧的，再添加新的
remove_existing
(crontab -l 2>/dev/null; echo "$CRON_JOBS") | crontab -

echo "✅ RWC运营cron任务已配置:"
echo "   10:00 — 全平台发帖"
echo "   14:00 — 全平台回复 (×10)"
echo "   20:00 — 每日报告"
echo "   每6h  — cookie检查"
echo ""
echo "查看: crontab -l | grep RWC"
echo "移除: bash $0 --remove"
