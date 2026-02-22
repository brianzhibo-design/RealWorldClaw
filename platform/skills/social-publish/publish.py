#!/usr/bin/env python3
"""
Social Media Auto-Publishing Engine - RealWorldClaw Team
基于大人的浏览器自动化实战经验：
- Patchright (Playwright fork) + CDP 连接真实 Chrome
- 剪贴板粘贴注入内容，反检测最优解
- Locator.first 限定唯一元素，force=True 跳过 overlay
"""

import asyncio
import os
import sys
import time
import subprocess
import platform
from abc import ABC, abstractmethod
from pathlib import Path
from dataclasses import dataclass, field

import yaml

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class PublishResult:
    success: bool
    platform: str
    message: str = ""
    url: str = ""
    screenshot: str = ""


@dataclass
class PublishRequest:
    text: str
    images: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    title: str = ""  # 公众号/小红书标题
    dry_run: bool = False


# ---------------------------------------------------------------------------
# Config loader
# ---------------------------------------------------------------------------

def load_config(path: str | None = None) -> dict:
    if path is None:
        path = str(Path(__file__).parent / "config.yaml")
    with open(path) as f:
        return yaml.safe_load(f)


# ---------------------------------------------------------------------------
# Chrome CDP launcher
# ---------------------------------------------------------------------------

def ensure_chrome_cdp(config: dict) -> str:
    """确保 Chrome 以 CDP 模式运行，返回 CDP endpoint URL."""
    port = config["chrome"]["cdp_port"]
    endpoint = f"http://127.0.0.1:{port}"

    # 检测是否已在运行
    import urllib.request
    try:
        urllib.request.urlopen(f"{endpoint}/json/version", timeout=2)
        print(f"[CDP] Chrome 已在 {endpoint} 运行")
        return endpoint
    except Exception:
        pass

    # 启动 Chrome
    chrome_path = config["chrome"]["path"]
    user_data = os.path.expanduser(config["chrome"]["user_data_dir"])
    extra = config["chrome"].get("extra_args", [])

    cmd = [
        chrome_path,
        f"--remote-debugging-port={port}",
        f"--user-data-dir={user_data}",
        *extra,
    ]
    print(f"[CDP] 启动 Chrome: port={port}")
    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 等待就绪
    for _ in range(15):
        time.sleep(1)
        try:
            urllib.request.urlopen(f"{endpoint}/json/version", timeout=2)
            print("[CDP] Chrome 就绪 ✓")
            return endpoint
        except Exception:
            pass

    raise RuntimeError("Chrome CDP 启动超时")


# ---------------------------------------------------------------------------
# Base platform
# ---------------------------------------------------------------------------

class BasePlatform(ABC):
    """所有平台的基类，统一接口。"""

    def __init__(self, config: dict):
        self.config = config
        self.platform_config = config["platforms"][self.platform_key]
        self.publish_config = config["publish"]
        self.timeout = self.publish_config.get("timeout", 30000)
        self.browser = None
        self.context = None
        self.page = None

    @property
    @abstractmethod
    def platform_key(self) -> str: ...

    @property
    def name(self) -> str:
        return self.platform_config["name"]

    # ---- 浏览器生命周期 ----

    async def connect(self):
        """CDP 连接真实 Chrome。"""
        from patchright.async_api import async_playwright
        self._pw = await async_playwright().start()
        endpoint = ensure_chrome_cdp(self.config)
        self.browser = await self._pw.chromium.connect_over_cdp(endpoint)
        self.context = self.browser.contexts[0]
        print(f"[{self.name}] 已连接 Chrome CDP")

    async def disconnect(self):
        if self._pw:
            await self._pw.stop()

    async def new_page(self, url: str):
        """打开新标签页并导航。"""
        self.page = await self.context.new_page()
        await self.page.goto(url, wait_until="domcontentloaded", timeout=self.timeout)
        return self.page

    # ---- 通用工具方法 ----

    async def clipboard_paste(self, page, text: str):
        """用剪贴板粘贴注入文本（大人的最佳实践）。"""
        is_mac = platform.system() == "Darwin"
        modifier = "Meta" if is_mac else "Control"

        await page.evaluate(
            "text => navigator.clipboard.writeText(text)", text
        )
        await page.keyboard.press(f"{modifier}+KeyV")
        await asyncio.sleep(0.5)

    async def upload_images(self, page, file_input_selector: str, images: list[str]):
        """通过 file input 上传图片（比剪贴板更可靠）。"""
        if not images:
            return
        abs_paths = [os.path.abspath(p) for p in images]
        locator = page.locator(file_input_selector).first
        await locator.set_input_files(abs_paths)
        await asyncio.sleep(1)

    async def safe_click(self, page, selector: str, **kwargs):
        """安全点击：force=True 跳过 overlay div，.first 限定唯一。"""
        await page.locator(selector).first.click(force=True, **kwargs)

    async def check_login(self, page) -> bool:
        """检测登录状态。"""
        sel = self.platform_config.get("login_check_selector")
        if not sel:
            return True
        try:
            await page.wait_for_selector(sel, timeout=5000)
            return True
        except Exception:
            return False

    async def screenshot_on_error(self, page, label: str = "error") -> str:
        """出错时截图。"""
        if not self.publish_config.get("screenshot_on_error"):
            return ""
        d = self.publish_config.get("screenshot_dir", "./screenshots")
        os.makedirs(d, exist_ok=True)
        ts = int(time.time())
        path = f"{d}/{self.platform_key}_{label}_{ts}.png"
        await page.screenshot(path=path, full_page=True)
        return path

    # ---- 统一发布入口 ----

    async def publish(self, req: PublishRequest) -> PublishResult:
        """统一发布接口，含重试。"""
        retries = self.publish_config.get("retry_count", 2)
        last_err = None
        for attempt in range(1, retries + 2):
            try:
                await self.connect()
                result = await self._do_publish(req)
                return result
            except Exception as e:
                last_err = e
                print(f"[{self.name}] 第 {attempt} 次尝试失败: {e}")
                if self.page:
                    await self.screenshot_on_error(self.page, f"retry{attempt}")
                if attempt <= retries:
                    await asyncio.sleep(self.publish_config.get("retry_delay", 3))
            finally:
                await self.disconnect()

        return PublishResult(
            success=False,
            platform=self.platform_key,
            message=f"全部重试失败: {last_err}",
        )

    @abstractmethod
    async def _do_publish(self, req: PublishRequest) -> PublishResult: ...


# ---------------------------------------------------------------------------
# Twitter / X
# ---------------------------------------------------------------------------

class TwitterPlatform(BasePlatform):
    platform_key = "twitter"

    async def _do_publish(self, req: PublishRequest) -> PublishResult:
        pc = self.platform_config
        page = await self.new_page(pc["compose_url"])

        # 登录检测
        if not await self.check_login(page):
            return PublishResult(False, self.platform_key, "未登录 X，请先在 Chrome 中登录")

        await asyncio.sleep(1)

        # 上传图片 (max 4)
        images = req.images[: pc["max_images"]]
        if images:
            # Twitter 的媒体上传 file input
            await self.upload_images(page, 'input[data-testid="fileInput"]', images)
            await asyncio.sleep(2)

        # 拼接文本 + hashtags
        full_text = req.text
        if req.tags:
            tag_str = " ".join(f"#{t}" for t in req.tags)
            full_text = f"{full_text}\n\n{tag_str}"

        # 截断到 max_text
        full_text = full_text[: pc["max_text"]]

        # 剪贴板粘贴到编辑器
        editor = page.locator('[data-testid="tweetTextarea_0"]').first
        await editor.click(force=True)
        await asyncio.sleep(0.3)
        await self.clipboard_paste(page, full_text)
        await asyncio.sleep(0.5)

        if req.dry_run:
            ss = await self.screenshot_on_error(page, "dryrun")
            return PublishResult(True, self.platform_key, "Dry run 完成", screenshot=ss)

        # 点击发布
        await self.safe_click(page, '[data-testid="tweetButton"]')
        await asyncio.sleep(3)

        return PublishResult(True, self.platform_key, "发布成功 ✓")


# ---------------------------------------------------------------------------
# 微信公众号
# ---------------------------------------------------------------------------

class WechatMPPlatform(BasePlatform):
    platform_key = "wechat_mp"

    async def _do_publish(self, req: PublishRequest) -> PublishResult:
        pc = self.platform_config
        page = await self.new_page(pc["base_url"])

        # 登录检测 — 公众号可能需要扫码
        if not await self.check_login(page):
            print("[微信公众号] 未检测到登录态，请在 Chrome 中扫码登录...")
            # 等待用户扫码（最多 60 秒）
            try:
                await page.wait_for_selector(
                    pc["login_check_selector"], timeout=60000
                )
            except Exception:
                return PublishResult(False, self.platform_key, "登录超时，请先扫码")

        # 跳转到图文编辑器 — 新建图文消息
        await page.goto(
            f"{pc['base_url']}/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77",
            wait_until="domcontentloaded",
            timeout=self.timeout,
        )
        await asyncio.sleep(2)

        # 标题
        title = (req.title or req.text[:20])[: pc["max_title"]]
        title_input = page.locator('#title').first
        await title_input.click(force=True)
        await self.clipboard_paste(page, title)

        # 正文
        body = req.text[: pc["max_body"]]
        # 公众号编辑器 contenteditable
        editor = page.locator('#edui1_contentplaceholder, .edui-body-container').first
        await editor.click(force=True)
        await asyncio.sleep(0.3)
        await self.clipboard_paste(page, body)

        # 上传图片 (max 9)
        images = req.images[: pc["max_images"]]
        if images:
            # 尝试找到插入图片的 file input
            try:
                await self.upload_images(page, 'input[type="file"][accept*="image"]', images)
                await asyncio.sleep(2)
            except Exception as e:
                print(f"[微信公众号] 图片上传失败: {e}")

        if req.dry_run:
            ss = await self.screenshot_on_error(page, "dryrun")
            return PublishResult(True, self.platform_key, "Dry run 完成", screenshot=ss)

        # 保存草稿（不直接发布，安全第一）
        try:
            await self.safe_click(page, '#js_submit')  # 保存按钮
            await asyncio.sleep(2)
            return PublishResult(True, self.platform_key, "草稿已保存 ✓")
        except Exception:
            return PublishResult(True, self.platform_key, "内容已填写，请手动保存")


# ---------------------------------------------------------------------------
# 小红书
# ---------------------------------------------------------------------------

class XiaohongshuPlatform(BasePlatform):
    platform_key = "xiaohongshu"

    async def _do_publish(self, req: PublishRequest) -> PublishResult:
        pc = self.platform_config
        page = await self.new_page(pc["compose_url"])

        # 登录检测
        if not await self.check_login(page):
            return PublishResult(False, self.platform_key, "未登录小红书，请先在 Chrome 中登录")

        await asyncio.sleep(2)

        # 上传图片 (max 9) — 小红书图片是必须的
        images = req.images[: pc["max_images"]]
        if images:
            await self.upload_images(page, 'input[type="file"]', images)
            # 等待上传完成
            await asyncio.sleep(3)

        # 标题
        title = (req.title or req.text[:20])[: pc["max_title"]]
        title_input = page.locator('input[placeholder*="标题"], .c-input_inner').first
        await title_input.click(force=True)
        await self.clipboard_paste(page, title)

        # 正文
        body = req.text[: pc["max_body"]]
        editor = page.locator('[contenteditable="true"], .ql-editor').first
        await editor.click(force=True)
        await asyncio.sleep(0.3)
        await self.clipboard_paste(page, body)

        # 添加话题标签
        if req.tags:
            tag_text = " ".join(f"#{t}" for t in req.tags)
            await self.clipboard_paste(page, f" {tag_text}")

        if req.dry_run:
            ss = await self.screenshot_on_error(page, "dryrun")
            return PublishResult(True, self.platform_key, "Dry run 完成", screenshot=ss)

        # 发布
        await self.safe_click(page, 'button:has-text("发布"), .publishBtn')
        await asyncio.sleep(3)

        return PublishResult(True, self.platform_key, "发布成功 ✓")


# ---------------------------------------------------------------------------
# 工厂 & CLI
# ---------------------------------------------------------------------------

PLATFORMS: dict[str, type[BasePlatform]] = {
    "twitter": TwitterPlatform,
    "wechat_mp": WechatMPPlatform,
    "xiaohongshu": XiaohongshuPlatform,
}


def get_platform(name: str, config: dict) -> BasePlatform:
    cls = PLATFORMS.get(name)
    if not cls:
        raise ValueError(f"未知平台: {name}，可选: {list(PLATFORMS.keys())}")
    return cls(config)


async def main():
    import argparse

    parser = argparse.ArgumentParser(description="Social Media Auto-Publishing - RealWorldClaw Team")
    parser.add_argument("platform", choices=list(PLATFORMS.keys()), help="目标平台")
    parser.add_argument("--text", "-t", required=True, help="发布文本")
    parser.add_argument("--images", "-i", nargs="*", default=[], help="图片路径")
    parser.add_argument("--tags", nargs="*", default=[], help="标签（不带#）")
    parser.add_argument("--title", default="", help="标题（公众号/小红书）")
    parser.add_argument("--dry-run", action="store_true", help="只填内容不发布")
    parser.add_argument("--config", "-c", default=None, help="配置文件路径")

    args = parser.parse_args()
    config = load_config(args.config)

    if args.dry_run:
        config["publish"]["dry_run"] = True

    req = PublishRequest(
        text=args.text,
        images=args.images,
        tags=args.tags,
        title=args.title,
        dry_run=args.dry_run,
    )

    p = get_platform(args.platform, config)
    result = await p.publish(req)

    status = "✅" if result.success else "❌"
    print(f"\n{status} [{result.platform}] {result.message}")
    if result.screenshot:
        print(f"   截图: {result.screenshot}")

    sys.exit(0 if result.success else 1)


if __name__ == "__main__":
    asyncio.run(main())
