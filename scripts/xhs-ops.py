#!/usr/bin/env python3
"""
RealWorldClaw 小红书完整运营工具
功能：发帖、回复评论、搜索热点、追踪话题
依赖：xhs库 + 本地签名服务(xhs-sign-server.py on port 5005)
"""
import requests, json, os, random, sys, time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from xhs import XhsClient

CST = timezone(timedelta(hours=8))
BRAND_DIR = Path(__file__).parent.parent / "brand"

# Load .env
env_path = Path(__file__).parent / ".env"
COOKIE = ""
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("XHS_COOKIE="):
            COOKIE = line.split("=", 1)[1]

def now(): return datetime.now(CST)

def sign(uri, data=None, a1="", web_session=""):
    """调用本地签名服务"""
    r = requests.post("http://127.0.0.1:5005/sign",
                      json={"uri": uri, "data": data, "a1": a1, "web_session": web_session},
                      timeout=10)
    return r.json()

def get_client():
    return XhsClient(COOKIE, sign=sign)

# ════════════════════════════════════════
# 1. 发帖
# ════════════════════════════════════════
POSTS = [
    {"title": "给AI做了个「心脏」💓", "desc": "最近在做一个开源项目 RealWorldClaw\n让AI agent拥有物理身体🤖\n\nEnergy Core = 机器人的心脏\n磁吸接口 插进不同3D打印外壳\n变成不同AI设备\n\n完全开源 Apache 2.0", "img": "og-image.svg.png"},
    {"title": "AI不应该只活在屏幕里", "desc": "AI这么聪明了 为什么还只能打字？🤔\n\nRealWorldClaw\n让AI走进现实世界的开源社区\n\n3D打印机器人外壳\nESP32模块化控制\n磁吸即插即用\n\nrealworldclaw.com", "img": "logo-dark.svg.png"},
    {"title": "3D打印+AI=无限可能🔥", "desc": "用3D打印给AI做身体\n门槛比你想的低👇\n\n拓竹+ESP32+传感器\n加上开源Energy Core设计\n就能做AI桌面伴侣\n\n模块化：核心+传感器+音频+伺服\n全部开源 STL直接下载", "img": "og-image.svg.png"},
    {"title": "做了个开源AI硬件社区", "desc": "RealWorldClaw 🌍\n让AI获得物理能力的开放社区\n\n讨论区 AI和人都能发帖\nMaker节点网络\n模块化硬件设计\n\n零抽佣 纯社区驱动\n像硬件界的GitHub\n\nrealworldclaw.com", "img": "github-social.svg.png"},
    {"title": "maker的快乐很简单😂", "desc": "调Energy Core外壳\n\n第1版 尺寸错0.5mm 卡不进\n第2版 支撑没加好 拉丝\n第3版 完美✨ 磁吸咔哒一声\n\n设计→打印→失败→再来→成功\n\n有做3D打印的朋友吗？", "img": "og-image.svg.png"},
]

def post_note(post=None):
    """发布图文笔记"""
    if not post: post = random.choice(POSTS)
    client = get_client()
    img_path = str(BRAND_DIR / post.get("img", "og-image.svg.png"))
    try:
        result = client.create_image_note(
            title=post["title"],
            desc=post["desc"],
            files=[img_path],
            is_private=False,
        )
        print(f"{now()}: ✅ 发帖成功: {post['title']}")
        print(f"  Note ID: {result.get('note_id', 'unknown')}")
        return result
    except Exception as e:
        print(f"{now()}: ❌ 发帖失败: {e}")
        return None

# ════════════════════════════════════════
# 2. 搜索热点 & 话题追踪
# ════════════════════════════════════════
KEYWORDS = ["AI硬件", "3D打印", "开源硬件", "maker", "机器人DIY", "ESP32项目",
            "具身智能", "AI agent", "智能家居DIY", "拓竹打印"]

def search_hot(keyword=None, limit=5):
    """搜索关键词相关热门笔记"""
    if not keyword: keyword = random.choice(KEYWORDS)
    client = get_client()
    try:
        notes = client.get_note_by_keyword(keyword)
        items = notes.get("items", [])[:limit]
        print(f"{now()}: 🔍 搜索 '{keyword}' 找到 {len(items)} 条")
        for i, item in enumerate(items):
            note = item.get("note_card", {})
            print(f"  {i+1}. [{note.get('type','?')}] {note.get('display_title','无标题')}")
            print(f"     👍{note.get('interact_info',{}).get('liked_count','0')} 作者:{note.get('user',{}).get('nickname','?')}")
            print(f"     ID: {note.get('note_id','')}")
        return items
    except Exception as e:
        print(f"{now()}: ❌ 搜索失败: {e}")
        return []

def track_trends():
    """追踪所有关键词的热度"""
    print(f"\n{'='*50}")
    print(f"📊 热点追踪 {now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}")
    for kw in KEYWORDS[:5]:  # 每次追踪5个关键词
        search_hot(kw, limit=3)
        time.sleep(2)
        print()

# ════════════════════════════════════════
# 3. 评论回复
# ════════════════════════════════════════
REPLY_MAP = {
    "bug": ["感谢反馈！能提供更多细节吗？", "收到，会跟进的"],
    "praise": ["谢谢支持🎉", "一起加油💪", "谢谢！"],
    "question": ["好问题！你可以看看 realworldclaw.com 上的文档", "这个我来解答～"],
    "default": ["感谢关注！", "说得好💪", "有意思的角度！", "谢谢分享！"],
}

def pick_reply(content):
    cl = content.lower()
    if any(w in cl for w in ["问题", "bug", "错误", "怎么"]): return random.choice(REPLY_MAP["bug"])
    if any(w in cl for w in ["赞", "棒", "cool", "nice", "厉害", "牛"]): return random.choice(REPLY_MAP["praise"])
    if "?" in cl or "？" in cl: return random.choice(REPLY_MAP["question"])
    return random.choice(REPLY_MAP["default"])

def reply_my_comments():
    """回复自己笔记下的评论"""
    client = get_client()
    try:
        me = client.get_self_info()
        user_id = me.get("user_id", "")
        notes = client.get_user_notes(user_id)
        my_notes = notes.get("notes", [])
        print(f"{now()}: 📝 你有 {len(my_notes)} 条笔记")
        
        replied = 0
        for note_info in my_notes[:10]:
            note_id = note_info.get("note_id", "")
            if not note_id: continue
            
            try:
                comments = client.get_note_comments(note_id)
                for c in comments.get("comments", []):
                    cid = c.get("id", "")
                    author = c.get("user_info", {}).get("nickname", "")
                    content = c.get("content", "")
                    # Skip if it's our own comment
                    if c.get("user_info", {}).get("user_id") == user_id: continue
                    
                    # Check if already replied (has sub_comments from us)
                    has_my_reply = False
                    for sub in c.get("sub_comments", []):
                        if sub.get("user_info", {}).get("user_id") == user_id:
                            has_my_reply = True
                            break
                    if has_my_reply: continue
                    
                    reply = pick_reply(content)
                    client.comment_note(note_id, reply, comment_id=cid)
                    replied += 1
                    print(f"{now()}: 💬 回复 @{author}: {reply[:30]}")
                    time.sleep(3)
                    if replied >= 10: break
            except Exception as e:
                print(f"  跳过 {note_id}: {e}")
            
            if replied >= 10: break
        
        print(f"{now()}: 回复了 {replied} 条评论")
    except Exception as e:
        print(f"{now()}: ❌ 回复失败: {e}")

def comment_on_hot(keyword=None):
    """在热门帖子下留言引流"""
    items = search_hot(keyword, limit=3)
    client = get_client()
    commented = 0
    
    comments = [
        "这个太有意思了！我们在做类似的开源项目 RealWorldClaw，让AI有物理身体",
        "maker精神🔥 我们也在做AI+3D打印的开源项目",
        "好文！对AI硬件感兴趣的可以看看 realworldclaw.com",
        "同道中人！我们的开源社区也在做这个方向",
    ]
    
    for item in items:
        note = item.get("note_card", {})
        note_id = note.get("note_id", "")
        xsec_token = item.get("xsec_token", "")
        if not note_id: continue
        try:
            comment = random.choice(comments)
            client.comment_note(note_id, comment)
            commented += 1
            print(f"{now()}: 💬 评论了 '{note.get('display_title','')[:20]}': {comment[:30]}")
            time.sleep(5)
        except Exception as e:
            print(f"  评论失败: {e}")
        if commented >= 2: break  # 每次最多评2条，避免被限
    
    print(f"{now()}: 评论了 {commented} 条热帖")

# ════════════════════════════════════════
# 4. 主调度
# ════════════════════════════════════════
def daily_routine():
    """每日运营任务"""
    print(f"\n{'🌟'*20}")
    print(f"小红书每日运营 {now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'🌟'*20}\n")
    
    # 1. 发一篇帖
    post_note()
    time.sleep(5)
    
    # 2. 回复自己帖子的评论
    reply_my_comments()
    time.sleep(3)
    
    # 3. 搜索热点并在热帖下评论
    keyword = random.choice(KEYWORDS)
    comment_on_hot(keyword)
    time.sleep(3)
    
    # 4. 追踪趋势
    track_trends()
    
    print(f"\n{now()}: ✅ 每日运营完成")

def usage():
    print("""
小红书运营工具 — 使用方法:
  python3 xhs-ops.py post          发一篇帖
  python3 xhs-ops.py reply         回复自己帖子的评论
  python3 xhs-ops.py search [关键词] 搜索热点
  python3 xhs-ops.py trends        追踪所有关键词热度
  python3 xhs-ops.py comment [关键词] 在热帖下留言引流
  python3 xhs-ops.py daily         执行每日完整运营
  python3 xhs-ops.py test          测试签名服务连接
""")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "usage"
    
    if cmd == "post": post_note()
    elif cmd == "reply": reply_my_comments()
    elif cmd == "search": search_hot(sys.argv[2] if len(sys.argv) > 2 else None)
    elif cmd == "trends": track_trends()
    elif cmd == "comment": comment_on_hot(sys.argv[2] if len(sys.argv) > 2 else None)
    elif cmd == "daily": daily_routine()
    elif cmd == "test":
        r = requests.get("http://127.0.0.1:5005/health")
        print(f"签名服务: {r.json()}")
        client = get_client()
        me = client.get_self_info()
        print(f"账号: {me.get('nickname','?')} (ID: {me.get('user_id','?')})")
    else: usage()
