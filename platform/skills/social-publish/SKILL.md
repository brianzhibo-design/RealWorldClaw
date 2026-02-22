# Skill: Social Publish 社媒自动发布

RealWorldClaw Team — Based on browser automation experience

## 概述

通过 CDP 连接真实 Chrome 浏览器，自动发布内容到多个社交媒体平台。

## 支持平台

| 平台 | Key | 最大图片 | 特殊说明 |
|------|-----|---------|---------|
| X (Twitter) | `twitter` | 4 | 直接发布 |
| 微信公众号 | `wechat_mp` | 9 | 保存草稿（安全） |
| 小红书 | `xiaohongshu` | 9 | 图片必须 |

## 核心技术

- **Patchright** — Playwright fork，反检测优化
- **CDP 连接** — 复用真实 Chrome session，免登录
- **剪贴板粘贴** — `Cmd+V` 注入文本，绕过检测
- **`.first`** — Locator 限定唯一元素
- **`force=True`** — 跳过 overlay div 拦截
- **file input 上传** — 图片走 `set_input_files`

## 使用

```bash
# 安装依赖
pip install patchright pyyaml
python -m patchright install chromium

# 发推
python publish.py twitter -t "Hello World" -i photo.jpg --tags tech ai

# Dry run（只填不发）
python publish.py xiaohongshu -t "测试内容" -i img1.jpg img2.jpg --dry-run
```

## 接口

```python
from publish import get_platform, load_config, PublishRequest

config = load_config()
req = PublishRequest(text="内容", images=["a.jpg"], tags=["test"], dry_run=True)
result = await get_platform("twitter", config).publish(req)
```

## 前提条件

1. Chrome 已安装
2. 目标平台已在 Chrome 中登录
3. `pip install patchright pyyaml`
