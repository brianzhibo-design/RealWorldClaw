# 社媒自动发布 Social Publish

RealWorldClaw Team

## 快速开始

```bash
# 1. 安装依赖
pip install patchright pyyaml
python -m patchright install chromium

# 2. 确保 Chrome 中已登录目标平台

# 3. 发布
python publish.py twitter -t "Hello!" -i photo.jpg --tags tech
python publish.py wechat_mp -t "公众号内容" --title "标题" -i img.jpg
python publish.py xiaohongshu -t "小红书笔记" -i img1.jpg img2.jpg --dry-run
```

## 参数

| 参数 | 说明 |
|------|------|
| `platform` | `twitter` / `wechat_mp` / `xiaohongshu` |
| `-t, --text` | 发布文本（必填） |
| `-i, --images` | 图片路径，空格分隔 |
| `--tags` | 标签（不带#） |
| `--title` | 标题（公众号/小红书） |
| `--dry-run` | 只填内容不点发布 |
| `-c, --config` | 自定义配置文件 |

## 配置

编辑 `config.yaml` 修改 Chrome 路径、CDP 端口等。

## 工作原理

1. 启动/连接 Chrome CDP（端口 9222）
2. 复用已登录的 Chrome session
3. 自动导航到发布页面
4. 通过剪贴板粘贴注入文本（反检测）
5. 通过 file input 上传图片
6. 点击发布（或 dry_run 模式下截图保存）

## 注意事项

- 首次使用前请确保已在 Chrome 中登录各平台
- 微信公众号默认**保存草稿**而非直接发布（安全考虑）
- 网页结构可能变化，selector 需要定期维护
- 建议先用 `--dry-run` 测试
