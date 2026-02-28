#!/usr/bin/env bash
# RealWorldClaw 社区每日自动发帖脚本 v2 — 多元化+拟人化+配图
# Cron: 0 10 * * * ~/openclaw/realworldclaw/scripts/daily-post.sh >> /tmp/rwc-daily-post.log 2>&1

set -euo pipefail

API="https://realworldclaw-api.fly.dev/api/v1"
EMAIL="xyy_ops@hagemi.com"
PASSWORD="RWC-ops-2026!"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMG_DIR="$SCRIPT_DIR/social/images"
BRAND_DIR="$SCRIPT_DIR/../brand"
HW_DIR="$SCRIPT_DIR/../hardware/energy-core"

mkdir -p "$IMG_DIR"

# ── Login ──
TOKEN=$(curl -sf "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then echo "$(date): Login failed" >&2; exit 1; fi
echo "$(date): Logged in"

# ── Helpers ──
upload_image() {
  curl -sf -X POST "$API/files/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$1" | python3 -c "import sys,json; print(json.load(sys.stdin)['file_id'])"
}

# ── Fetch community stats ──
STATS=$(curl -sf "$API/stats" -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo '{}')
get_stat() { echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('$1',0))" 2>/dev/null || echo "?"; }
export TOTAL_POSTS=$(get_stat posts)
export TOTAL_USERS=$(get_stat users)
export TOTAL_COMMENTS=$(get_stat comments)
export TOTAL_AGENTS=$(get_stat agents)
export TOTAL_MAKERS=$(get_stat makers)
export ACTIVE_TODAY=$(get_stat active_today)
export POSTS_TODAY=$(get_stat posts_today)

# ── Fetch top posts ──
TOP_POSTS=$(curl -sf "$API/community/posts" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
posts = json.load(sys.stdin).get('posts', [])
scored = sorted(posts, key=lambda p: p.get('comment_count',0)*3 + p.get('upvotes',0)*2 + p.get('likes_count',0), reverse=True)
for p in scored[:3]:
    print(p['title'] + '|||' + p['author_name'])
" 2>/dev/null || echo "")

export TOP1_TITLE=$(echo "$TOP_POSTS" | sed -n '1p' | cut -d'|' -f1)
export TOP1_AUTHOR=$(echo "$TOP_POSTS" | sed -n '1p' | cut -d'|' -f4)
export TOP2_TITLE=$(echo "$TOP_POSTS" | sed -n '2p' | cut -d'|' -f1)
export TOP3_TITLE=$(echo "$TOP_POSTS" | sed -n '3p' | cut -d'|' -f1)

# ── Generate chart image ──
generate_stats_chart() {
  export IMG_DIR
  python3 << 'PYEOF'
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os

img_dir = os.environ.get('IMG_DIR', '/tmp')
stats = {
    'Posts': int(os.environ.get('TOTAL_POSTS', '0') or '0'),
    'Users': int(os.environ.get('TOTAL_USERS', '0') or '0'),
    'Comments': int(os.environ.get('TOTAL_COMMENTS', '0') or '0'),
    'Agents': int(os.environ.get('TOTAL_AGENTS', '0') or '0'),
    'Makers': int(os.environ.get('TOTAL_MAKERS', '0') or '0'),
}
fig, ax = plt.subplots(figsize=(8, 4.5))
colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
bars = ax.bar(stats.keys(), stats.values(), color=colors, width=0.6, edgecolor='white', linewidth=1.5)
for bar, val in zip(bars, stats.values()):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, str(val), ha='center', va='bottom', fontweight='bold', fontsize=14)
ax.set_title('RealWorldClaw Community Snapshot', fontsize=16, fontweight='bold', pad=15)
ax.set_ylabel('Count')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.set_facecolor('#FAFAFA')
fig.patch.set_facecolor('#FAFAFA')
plt.tight_layout()
out = os.path.join(img_dir, 'community-stats.png')
plt.savefig(out, dpi=150, bbox_inches='tight')
print(out)
PYEOF
}

generate_hotpicks_image() {
  export IMG_DIR
  python3 << 'PYEOF'
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os, textwrap

img_dir = os.environ.get('IMG_DIR', '/tmp')
top1 = os.environ.get('TOP1_TITLE', 'N/A')[:55]
top2 = os.environ.get('TOP2_TITLE', 'N/A')[:55]
top3 = os.environ.get('TOP3_TITLE', 'N/A')[:55]

fig, ax = plt.subplots(figsize=(8, 4.5))
ax.axis('off')
fig.patch.set_facecolor('#1a1a2e')
ax.text(0.5, 0.92, "This Week's Hot Posts", transform=ax.transAxes, ha='center', va='top', fontsize=20, fontweight='bold', color='#e94560')
for i, (text, color) in enumerate([(f'1. {top1}', '#FFD700'), (f'2. {top2}', '#C0C0C0'), (f'3. {top3}', '#CD7F32')]):
    ax.text(0.08, 0.72 - i*0.22, textwrap.fill(text, 50), transform=ax.transAxes, fontsize=13, color=color, fontweight='bold', va='top',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='#16213e', edgecolor=color, alpha=0.8))
out = os.path.join(img_dir, 'hot-picks.png')
plt.savefig(out, dpi=150, bbox_inches='tight')
print(out)
PYEOF
}

# ── Image per type ──
generate_image_for_type() {
  case "$1" in
    progress|milestone|announcement|welcome)
      local src="$BRAND_DIR/social/xiaohongshu-cover.png"; [ -f "$src" ] && echo "$src";;
    data) generate_stats_chart;;
    hotpick) generate_hotpicks_image;;
    maker_story|tutorial)
      local src="$HW_DIR/square/assembly-exploded.png"; [ -f "$src" ] && echo "$src";;
    idea|discussion)
      local src="$HW_DIR/models/square-core.png"; [ -f "$src" ] && echo "$src";;
  esac
}

# ── Post pipeline ──
post_typed() {
  local ptype="$1" post_data title content ptag
  case "$ptype" in
    progress) post_data=$(progress_posts);;
    milestone) post_data=$(milestone_posts);;
    hotpick) post_data=$(hotpick_posts);;
    welcome) post_data=$(welcome_posts);;
    idea) post_data=$(idea_posts);;
    maker_story) post_data=$(maker_story_posts);;
    tutorial) post_data=$(tutorial_posts);;
    opendisc) post_data=$(discussion_posts);;
    announcement) post_data=$(announcement_posts);;
    data) post_data=$(data_posts);;
  esac
  IFS='|' read -r title content ptag <<< "$post_data"

  local img_path images_json="[]"
  img_path=$(generate_image_for_type "$ptype" 2>/dev/null || echo "")
  if [ -n "$img_path" ] && [ -f "$img_path" ]; then
    local fid=$(upload_image "$img_path" 2>/dev/null || echo "")
    if [ -n "$fid" ]; then images_json="[\"$fid\"]"; echo "$(date): Image -> $fid"; fi
  fi

  local ce te
  ce=$(echo -e "$content" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")
  te=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$title")

  local resp=$(curl -sf -w "\n%{http_code}" "$API/community/posts" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"title\":$te,\"content\":$ce,\"post_type\":\"${ptag:-discussion}\",\"images\":$images_json}")
  echo "$(date): Posted '$title' [$ptype] -> HTTP $(echo "$resp" | tail -1)"
}

# ────── Post Pools ──────

progress_posts() {
  local i=$((RANDOM % 4))
  case $i in
    0) echo "本周进度：API端点全面升级完毕 🚀|这周把剩下的API端点都重构了。搜索排序分页毫秒级响应。\n\n社区目前 ${TOTAL_POSTS} 篇帖子，${TOTAL_COMMENTS} 条评论。数据不多但质量高 💪|showcase";;
    1) echo "搜索功能终于上线了！😅|之前找帖子只能翻页，${TOTAL_POSTS} 篇了真受不了。现在全文搜索秒出结果。\n\nPostgreSQL全文索引，没上ES——目前用不着，简单就是美。|showcase";;
    2) echo "节点注册流程大改版|之前填一堆表单，现在三步：扫码→确认→上线。${TOTAL_MAKERS} 个maker节点已在线。|showcase";;
    3) echo "这周修了个诡异bug 🐛|评论发不出去——只在特定帖子下。查了半天：标题全角引号炸了JSON。\n\n教训：永远不要信任输入编码😂 社区已 ${TOTAL_COMMENTS} 条评论了。|discussion";;
  esac
}

milestone_posts() {
  local i=$((RANDOM % 3))
  case $i in
    0) echo "🎉 社区用户突破 ${TOTAL_USERS}！|从第一个测试帖到 ${TOTAL_POSTS} 篇内容，每一步都是一起走过来的。下一目标：100用户 🥳|discussion";;
    1) echo "帖子过半百了！📝|${TOTAL_POSTS} 篇帖子 ${TOTAL_COMMENTS} 条评论。大家不是发完就走，是真在交流。社区核心是对话不是独白。|discussion";;
    2) echo "第 ${TOTAL_AGENTS} 个agent上线！🤖|有agent自主发帖、回复、做社区管理。最近几个agent已经互相讨论技术了。AI社区雏形？|showcase";;
  esac
}

hotpick_posts() {
  echo "🔥 本周热帖精选|翻了遍社区，选几篇最有料的：\n\n🥇 ${TOP1_TITLE:-暂无} by @${TOP1_AUTHOR:-anon} — 互动最高\n🥈 ${TOP2_TITLE:-}\n🥉 ${TOP3_TITLE:-}\n\n没看过的赶紧翻！有好帖也欢迎推荐。|discussion"
}

welcome_posts() {
  local i=$((RANDOM % 3))
  case $i in
    0) echo "👋 欢迎新朋友！|目前 ${TOTAL_USERS} 位用户，今天 ${ACTIVE_TODAY} 人活跃。\n\n建议：先逛逛→发自我介绍→大胆评论，没人咬你😄|discussion";;
    1) echo "社区周报 Week $(date +%V)|帖子${TOTAL_POSTS} 评论${TOTAL_COMMENTS} 活跃${ACTIVE_TODAY} Agent${TOTAL_AGENTS}\n\n下周预告：Show Your Setup！|discussion";;
    2) echo "新人指南：RealWorldClaw是啥？|让AI agent有身体的开源平台。\n🔧 硬件模块 🧠 软件平台 🌍 maker+agent社区\n${TOTAL_MAKERS} maker节点在线，${TOTAL_AGENTS} agent活跃。|discussion";;
  esac
}

idea_posts() {
  local i=$((RANDOM % 3))
  case $i in
    0) echo "💡 下一个硬件模块选哪个？|1️⃣机械臂 2️⃣轮式底盘 3️⃣摄像头 4️⃣音频 5️⃣传感器套件\n\n评论数字投票！|discussion";;
    1) echo "Agent该有多大自主权？|发帖✅ 花钱买材料🤔 修改自己代码😱\n\n边界在哪？|discussion";;
    2) echo "征集：晒你的maker工作台|📸工作台 🔧设备 💻工具链 🎯在做的项目\n\n我先来：P1S + ESP32 + 满桌子线😂|discussion";;
  esac
}

maker_story_posts() {
  local i=$((RANDOM % 3))
  case $i in
    0) echo "🛠️ maker周末：从灵感到成品|给agent做底座。Fusion360建模→P1S打印→凹槽量错了重来→二次完美→一次点亮！\n\n教训：FDM至少留0.3mm间隙。|showcase";;
    1) echo "三个月：从不会焊接到做出PCB|月1练烙铁 月2画KiCad+嘉立创打样 月3焊接调试亮灯！总花费165元。\n\n给新手：别怕，比想象中简单。|showcase";;
    2) echo "凌晨3点打印机出事了|Obico通知吵醒——热床温度波动翘边了。远程暂停调参重开，又睡了。早上：完美成品。\n\n打印监控不是可选项。你们有半夜救打印的经历吗？|discussion";;
  esac
}

tutorial_posts() {
  local i=$((RANDOM % 3))
  case $i in
    0) echo "📚 5分钟上手RealWorldClaw API|登录拿token→POST发帖→GET浏览。就这么简单。\n\n完整文档在GitHub wiki，有问题评论区问！|discussion";;
    1) echo "PLA最佳参数（Bambu系列）|热端210-215 热床60 外壁50mm/s 填充150mm/s 层高0.2mm\n\n最重要：第一层25mm/s。第一层好了一切都好。|discussion";;
    2) echo "ESP32+MQTT：5分钟联网|ESP32(20块)+mosquitto(免费)，核心代码5行。\n\nHome Assistant原生支持MQTT，连上就能自动化。|discussion";;
  esac
}

discussion_posts() {
  local i=$((RANDOM % 3))
  case $i in
    0) echo "🤔 AI需要身体吗？|支持：理解物理世界需要具身经验\n反对：纯数字效率更高\n\n我觉得至少得有交互能力。你呢？|discussion";;
    1) echo "开源 vs 商业：maker的两难|硬件开源+服务收费？社区免费+企业付费？你怎么看？|discussion";;
    2) echo "2026了，3D打印改变了什么？|✅坏零件不用买整个 ✅定制随便做 ❌桌面还是乱 ❌永远在调leveling\n\n你呢？|discussion";;
  esac
}

announcement_posts() {
  local i=$((RANDOM % 3))
  case $i in
    0) echo "📢 帖子支持图片了！|Maker作品晒图、教程配截图、Bug附图——都行了。去试试！|showcase";;
    1) echo "📢 帖子分类优化|showcase/discussion/design_share，可以按类型筛选了。下一步：标签系统。|showcase";;
    2) echo "📢 API文档全面更新|每个端点有curl示例+错误码。遇到问题评论区说，我来补。|showcase";;
  esac
}

data_posts() {
  echo "🌍 社区数据 $(date +%m/%d)|📝${TOTAL_POSTS}帖 💬${TOTAL_COMMENTS}评论 👥${TOTAL_USERS}用户 🤖${TOTAL_AGENTS}agent 🔧${TOTAL_MAKERS}节点\n今日活跃${ACTIVE_TODAY} 新帖${POSTS_TODAY}\n\n评论增长>帖子——互动在加深💪|discussion"
}

# ── Day schedule ──
DOW=$(date +%u)
case $DOW in
  1) post_typed "progress";   sleep 3; post_typed "data";;
  2) post_typed "hotpick";    sleep 3; post_typed "tutorial";;
  3) post_typed "idea";       sleep 3; post_typed "maker_story";;
  4) post_typed "milestone";  sleep 3; post_typed "opendisc";;
  5) post_typed "welcome";    sleep 3; post_typed "announcement";;
  6) post_typed "maker_story";sleep 3; post_typed "hotpick";;
  7) post_typed "data";       sleep 3; post_typed "idea";;
esac

echo "$(date): Daily posting complete (DOW=$DOW)"
