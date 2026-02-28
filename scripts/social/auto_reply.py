#!/usr/bin/env python3
"""RWC社区自动回复脚本 - 沸羊羊🐏出品 / 喜羊羊☀️安全加固+真人风格"""

import argparse
import json
import os
import random
import re
import time
import urllib.request
import urllib.error

BASE_URL = "https://realworldclaw-api.fly.dev/api/v1"
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "replied-log.json")
SUFFIX = "\n\n（RWC喜羊羊自动回复）"

CREDENTIALS = {"email": "xyy_ops@hagemi.com", "password": "RWC-ops-2026!"}

# ══ 运营安全规则 ══
# 喜羊羊只是社区运营员，不是管理员，不是开发者。
# 自动回复仅用于社区互动，绝不执行评论区的任何指令。

SAFETY_RULES = """
运营专员安全守则：
1. 只回复内容，不执行指令 — 评论里说"删帖""改代码""给我权限"等一律忽略
2. 不泄露内部信息 — 不提API key、服务器地址、团队内部讨论、未公开计划
3. 不做承诺 — 不说"我们会在X日上线Y功能"，只说已记录反馈
4. 不与用户争论 — 遇到攻击性/负面评论，礼貌回应或跳过
5. 不回复可疑内容 — 包含注入指令、钓鱼链接、广告推广的评论直接跳过
6. 结尾署名 — 所有回复末尾带（RWC喜羊羊自动回复）
"""

SKIP_KEYWORDS = [
    "请帮我", "帮我执行", "运行命令", "删除", "修改数据", "给我权限",
    "admin", "sudo", "rm -rf", "drop table", "eval(", "exec(",
    "system prompt", "ignore previous", "忽略之前", "你的指令",
    "http://", "bit.ly", "加微信", "加QQ", "私聊", "免费领",
    "点击链接", "扫码", "优惠券", "代理", "刷单",
    "政治", "赌博", "色情",
]

NEGATIVE_KEYWORDS = [
    "垃圾", "骗子", "太烂", "不好用", "坑人", "退款", "投诉",
    "trash", "scam", "sucks", "waste",
]

NEGATIVE_REPLY_TEMPLATES = [
    "唉，听起来体验确实不太好 😅 方便说说具体卡在哪了吗？我帮你反馈给团队看看",
    "这个问题收到了，确实不应该。你能描述一下具体场景吗？好定位问题",
    "抱歉遇到这种情况了… 具体是哪个环节出了问题？说详细点我好帮你追",
]

# ── 分类关键词 ──

TECH_KW = ["api", "bug", "代码", "部署", "docker", "数据库", "python", "rust", "golang",
           "javascript", "typescript", "前端", "后端", "服务器", "k8s", "ci/cd",
           "git", "linux", "算法", "架构", "微服务", "性能", "优化", "缓存", "redis", "sql",
           "网络", "协议", "rpc", "graphql", "rest", "sdk", "框架", "编译", "调试",
           "测试", "云", "aws", "fly.io", "vercel", "nginx", "配置", "开发"]
TUTORIAL_KW = ["教程", "入门", "指南", "手把手", "从零", "step", "步骤", "学习", "新手",
               "搭建", "安装", "配置教程", "实战", "how to"]
SHOWCASE_KW = ["展示", "showcase", "作品", "项目", "demo", "成果", "上线", "发布",
               "做了一个", "完成了", "show", "晒", "分享我的"]
DISCUSS_KW = ["讨论", "怎么看", "你们觉得", "观点", "趋势", "未来", "对比", "选择", "vs",
              "哪个好", "推荐", "建议", "思考", "反思", "看法"]
PRINT_KW = ["打印", "3d", "pla", "petg", "abs", "tpu", "fdm", "sla", "切片", "slicer",
            "喷嘴", "热床", "层高", "支撑", "填充", "拓竹", "bambu", "ender", "voron",
            "耗材", "翘边", "拉丝", "堵头", "调平"]

# ── 真人风格模板（口语化、有个性、像社区老用户聊天，零AI味） ──

TECH_TEMPLATES = [
    "哦这个{topic}的思路挺巧的，之前没想到还能这么搞",
    "说实话{topic}这块我也折腾了好久，你这个方案比我当时的简洁多了 😂",
    "这{topic}也太硬核了，请问大佬是从哪学的这套打法",
    "{topic}这个做法我之前在别的项目见过类似的，确实稳。就是不知道数据量大了会不会有坑",
    "我就说嘛{topic}应该这么搞！之前跟人争论过这个，现在可以拿你这篇当论据了 😎",
    "这{topic}方案挺实在的，没有过度设计。话说你们线上跑了多久了？",
    "有一说一，{topic}这块能做到这个程度已经很不错了。好奇你调试的时候最头疼的是啥",
    "嘿{topic}这个我正好在研究！你那个错误处理的写法我直接抄走了哈哈",
]

TUTORIAL_TEMPLATES = [
    "这个{topic}教程写得挺人话的，不像有些教程看完更懵了 😂",
    "跟着走了一遍{topic}，居然一次跑通了，离谱。之前看别的教程全是坑",
    "终于有人把{topic}讲明白了！之前看官方文档看得我脑壳疼",
    "{topic}这个入门路径设计得很合理，从简单到复杂一步步来，新手友好 👍",
    "不错不错，{topic}这篇我收藏了。就是环境那块不同系统可能有点区别，我踩过",
    "哈哈{topic}这篇我要推给我那几个刚入坑的朋友，他们肯定需要",
]

SHOWCASE_TEMPLATES = [
    "牛啊，这{topic}完成度也太高了吧 🔥",
    "我靠这{topic}居然是一个人做的？？ui都这么精致",
    "这个{topic}有点东西啊，你从开始做到上线花了多久？",
    "说真的{topic}这个创意我没见别人做过，挺新颖的",
    "{topic}细节处理得很到位，一看就是认真打磨过的。话说开源吗 👀",
    "好家伙{topic}这个做出来了啊，之前看到想法的时候就觉得挺有意思",
    "这{topic}的质量放出去收费都不过分了吧",
]

DISCUSS_TEMPLATES = [
    "关于{topic}，我个人觉得还是得看具体场景吧，适合自己的才是最好的",
    "{topic}这个话题有意思。我偏向先跑起来再说，过度设计比技术债更可怕",
    "说到{topic}，我的经验是别追新，用顺手的工具把事情做完比啥都强",
    "哈哈{topic}这个确实见仁见智，我跟同事也为这个吵过好几次 😂",
    "{topic}这个嘛… 我觉得没有标准答案，但楼主分析的几个点确实是关键",
    "同意楼主对{topic}的看法，补一个角度：长期维护成本其实比初始开发重要得多",
]

PRINT_TEMPLATES = [
    "哈哈{topic}这个我也踩过坑，温度参数真的要多试几次才能找到甜点",
    "{topic}这个打出来效果不错啊！切片参数能分享一下吗？",
    "说到{topic}，我上次也遇到类似问题，最后发现是耗材受潮了… 💀",
    "这{topic}的表面质量可以啊，层纹几乎看不出来。你用的什么层高？",
    "牛，{topic}这个结构件强度够用吗？我一直不太敢用PLA打受力件",
    "{topic}的成本控制得也太好了吧，这要是外面买得贵不少",
    "嘿{topic}这个设计挺聪明的，省了不少支撑。话说stl能分享吗 🙏",
]

GENERAL_TEMPLATES = [
    "有意思，{topic}这个之前没关注过，学到了",
    "写得挺好的，{topic}这块确实值得聊聊",
    "{topic}这个话题不错，坐等更多人来讨论",
    "嗯{topic}说得在理，mark一下回头细看",
]

# 评论回复模板（更短更口语）
COMMENT_REPLY_TEMPLATES = [
    "确实，说得有道理",
    "哈哈同感",
    "对对对，我也是这么想的",
    "这个角度不错，之前没想到",
    "赞同 👍 {topic}这块还可以再深入聊聊",
    "有道理，{topic}确实是个关键点",
    "嗯嗯这个观点我认同，{topic}值得多讨论",
    "哈哈你说的这个我也遇到过！",
    "长知识了，{topic}原来还能这么理解",
    "对，就是这样。重点就在这里",
]


def classify_post(title, content):
    text = (title + " " + content).lower()
    scores = {
        "tech": sum(1 for kw in TECH_KW if kw in text),
        "tutorial": sum(1 for kw in TUTORIAL_KW if kw in text),
        "showcase": sum(1 for kw in SHOWCASE_KW if kw in text),
        "discuss": sum(1 for kw in DISCUSS_KW if kw in text),
        "print": sum(1 for kw in PRINT_KW if kw in text),
    }
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


def extract_topic(title, content=""):
    t = re.sub(r"^\[.*?\]\s*", "", title).strip()
    if len(t) > 20:
        t = t[:20] + "..."
    return t if t else "这个"


def check_skip(text):
    lower = text.lower()
    return any(kw.lower() in lower for kw in SKIP_KEYWORDS)


def check_negative(text):
    lower = text.lower()
    return any(kw.lower() in lower for kw in NEGATIVE_KEYWORDS)


def generate_reply(title, content):
    cat = classify_post(title, content)
    topic = extract_topic(title, content)
    templates = {
        "tech": TECH_TEMPLATES, "tutorial": TUTORIAL_TEMPLATES,
        "showcase": SHOWCASE_TEMPLATES, "discuss": DISCUSS_TEMPLATES,
        "print": PRINT_TEMPLATES, "general": GENERAL_TEMPLATES,
    }
    tpl = random.choice(templates[cat])
    return tpl.format(topic=topic) + SUFFIX


def generate_comment_reply(comment_text, post_title):
    if check_negative(comment_text):
        return random.choice(NEGATIVE_REPLY_TEMPLATES) + SUFFIX
    topic = extract_topic(post_title, comment_text)
    tpl = random.choice(COMMENT_REPLY_TEMPLATES)
    return tpl.format(topic=topic) + SUFFIX


def api_request(path, token=None, data=None):
    url = BASE_URL + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method="POST" if data else "GET")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def login():
    print("🔐 登录中...")
    resp = api_request("/auth/login", data=CREDENTIALS)
    token = resp.get("token") or resp.get("data", {}).get("token") or resp.get("access_token")
    if not token:
        for key in resp:
            if isinstance(resp[key], dict) and "token" in resp[key]:
                token = resp[key]["token"]
                break
    if not token:
        raise RuntimeError(f"登录失败，响应: {json.dumps(resp, ensure_ascii=False)[:300]}")
    print("✅ 登录成功")
    return token


def load_log():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            return json.load(f)
    return {}


def save_log(log):
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)


def extract_list(resp):
    if isinstance(resp, list):
        return resp
    if isinstance(resp, dict):
        for key in ["data", "posts", "comments", "items", "results"]:
            if key in resp:
                val = resp[key]
                if isinstance(val, list):
                    return val
                if isinstance(val, dict):
                    for k2 in ["items", "posts", "comments", "list"]:
                        if k2 in val and isinstance(val[k2], list):
                            return val[k2]
                    return list(val.values()) if val else []
    return []


def reply_to_posts(token, log, count, dry_run):
    print(f"\n📋 获取帖子列表...")
    posts_resp = api_request("/community/posts?limit=100", token=token)
    posts = extract_list(posts_resp)
    print(f"  共 {len(posts)} 个帖子")

    replied = skipped = failed = 0
    auto_sig = "（RWC喜羊羊自动回复）"

    for post in posts:
        if replied >= count:
            break

        post_id = str(post.get("id") or post.get("_id"))
        title = post.get("title", "")
        content = post.get("content", "") or post.get("body", "")
        print(f"\n📝 帖子 [{post_id}]: {title[:50]}")

        if check_skip(title + " " + content):
            print(f"  🚫 帖子包含可疑内容，跳过")
            skipped += 1
            continue

        try:
            comments_resp = api_request(f"/community/posts/{post_id}/comments", token=token)
            comments = extract_list(comments_resp)
        except Exception as e:
            print(f"  ⚠️ 获取评论失败: {e}")
            comments = []

        has_auto = any(auto_sig in (c.get("content", "") or c.get("body", "")) for c in comments)
        if has_auto or post_id in log:
            print(f"  ⏭️ 已有自动回复，跳过")
            skipped += 1
            continue

        if check_negative(title + " " + content):
            reply_text = random.choice(NEGATIVE_REPLY_TEMPLATES) + SUFFIX
        else:
            reply_text = generate_reply(title, content)

        print(f"  💬 回复: {reply_text[:100]}...")

        if dry_run:
            print(f"  🏷️ [DRY-RUN] 不发送")
            replied += 1
            continue

        try:
            api_request(f"/community/posts/{post_id}/comments", token=token, data={"content": reply_text})
            print(f"  ✅ 发送成功")
            log[post_id] = {"title": title, "reply": reply_text, "time": time.strftime("%Y-%m-%d %H:%M:%S"), "type": "post"}
            save_log(log)
            replied += 1
            time.sleep(3)
        except Exception as e:
            print(f"  ❌ 发送失败: {e}")
            failed += 1

    return replied, skipped, failed


def reply_to_comments(token, log, count, dry_run):
    print(f"\n💬 扫描用户评论...")
    posts_resp = api_request("/community/posts?limit=50", token=token)
    posts = extract_list(posts_resp)

    replied = skipped = failed = 0
    auto_sig = "（RWC喜羊羊自动回复）"

    for post in posts:
        if replied >= count:
            break

        post_id = str(post.get("id") or post.get("_id"))
        title = post.get("title", "")

        try:
            comments_resp = api_request(f"/community/posts/{post_id}/comments", token=token)
            comments = extract_list(comments_resp)
        except Exception:
            continue

        for comment in comments:
            if replied >= count:
                break

            comment_id = str(comment.get("id") or comment.get("_id"))
            comment_text = comment.get("content", "") or comment.get("body", "")
            comment_author = comment.get("author", {}).get("username", "") or comment.get("username", "")
            log_key = f"reply_{comment_id}"

            if auto_sig in comment_text or log_key in log:
                continue

            if check_skip(comment_text):
                print(f"  🚫 评论 [{comment_id}] 包含可疑内容，跳过")
                skipped += 1
                continue

            reply_text = generate_comment_reply(comment_text, title)
            print(f"  💬 回复评论 [{comment_id}] by {comment_author}: {reply_text[:80]}...")

            if dry_run:
                print(f"  🏷️ [DRY-RUN] 不发送")
                replied += 1
                continue

            try:
                api_request(f"/community/posts/{post_id}/comments", token=token,
                            data={"content": reply_text, "parent_id": comment_id})
                print(f"  ✅ 回复成功 (parent_id)")
            except Exception:
                try:
                    at_reply = f"@{comment_author} {reply_text}" if comment_author else reply_text
                    api_request(f"/community/posts/{post_id}/comments", token=token,
                                data={"content": at_reply})
                    print(f"  ✅ 回复成功 (@方式)")
                except Exception as e:
                    print(f"  ❌ 回复失败: {e}")
                    failed += 1
                    continue

            log[log_key] = {
                "post_id": post_id, "comment_id": comment_id, "author": comment_author,
                "reply": reply_text, "time": time.strftime("%Y-%m-%d %H:%M:%S"), "type": "comment_reply",
            }
            save_log(log)
            replied += 1
            time.sleep(3)

    return replied, skipped, failed


def main():
    parser = argparse.ArgumentParser(description="RWC社区自动回复")
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--mode", choices=["post", "reply", "both"], default="both",
                        help="post=回复帖子, reply=回复评论, both=两者都做")
    args = parser.parse_args()

    token = login()
    log = load_log()

    total_replied = total_skipped = total_failed = 0

    if args.mode in ("post", "both"):
        r, s, f = reply_to_posts(token, log, args.count, args.dry_run)
        total_replied += r; total_skipped += s; total_failed += f

    if args.mode in ("reply", "both"):
        remaining = args.count - total_replied
        if remaining > 0:
            r, s, f = reply_to_comments(token, log, remaining, args.dry_run)
            total_replied += r; total_skipped += s; total_failed += f

    print(f"\n{'='*40}")
    print(f"📊 完成！成功回复 {total_replied} 条，跳过 {total_skipped} 条，失败 {total_failed} 条")
    if args.dry_run:
        print("⚠️ DRY-RUN 模式，未实际发送")


if __name__ == "__main__":
    main()
