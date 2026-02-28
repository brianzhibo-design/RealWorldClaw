#!/usr/bin/env node
// xiaohongshu-post.js — 小红书自动发帖 (Playwright)
// Usage: node xiaohongshu-post.js [--dry-run] [--count N]

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, '.cookies', 'xiaohongshu.com.json');
const PUBLISH_URL = 'https://creator.xiaohongshu.com/publish/publish';

const POSTS = [
  {
    title: "🤖 AI硬件DIY｜200块搭一个能「摸」世界的AI助手",
    content: "最近在搞AI embodiment项目，发现给AI接上传感器后，它对世界的理解完全不一样了！\n\n💰 成本清单：\n• ESP32-S3 开发板 ¥35\n• MG996R舵机×2 ¥40\n• 摄像头模块 ¥25\n• 温湿度传感器 ¥8\n• 3D打印外壳 ¥20\n• 杂线杂件 ¥30\n\n📌 总成本不到200！\n\n关键是ESP32性能够用，WiFi+蓝牙都有，跑个简单的决策模型完全OK。配合云端大模型做规划，本地做执行。\n\n下一步准备加机械臂，让它能抓东西 🦾\n\n#AI硬件 #ESP32 #创客 #DIY #embodiedAI"
  },
  {
    title: "🖨️ 3D打印入门｜新手第一周该打什么？（附参数）",
    content: "刚入坑3D打印？别急着打复杂模型！\n\n📋 第一周打印清单：\n\nDay 1-2: 校准测试\n• 温度塔（找最佳温度）\n• 首层校准方块\n• 回抽测试塔\n\nDay 3-4: 实用小件\n• 手机支架（立马有成就感）\n• 钥匙扣（送朋友超开心）\n• 线材样品架\n\nDay 5-7: 进阶挑战\n• 铰链盒（测试精度）\n• 花瓶模式花瓶（丝滑表面）\n\n⚙️ PLA推荐参数：\n温度210°C / 热床60°C / 速度60mm/s / 层高0.2mm\n\n新手最大的坑：首层没调好就开始打 → 必翘边！\n\n#3D打印 #拓竹 #新手教程 #maker"
  },
  {
    title: "🔧 开源机器人｜在家造一个机械臂要多少钱？",
    content: "答案是：500块以内！\n\n我用3D打印+淘宝零件做了一个4轴桌面机械臂 👇\n\n🛒 物料清单：\n• MG996R舵机×4 = ¥80\n• ESP32开发板 = ¥35\n• PCA9685驱动板 = ¥15\n• 3D打印件（PLA）= ¥50\n• 铝管+螺丝 = ¥30\n• 电源5V10A = ¥25\n\n📐 设计要点：\n1. 减速比很重要，直驱舵机扭矩有限\n2. 重心尽量靠近底座\n3. 线缆走管内，别外挂\n4. 留传感器接口（后面加力反馈）\n\n模型文件准备开源到GitHub 🎉\n\n#机械臂 #开源硬件 #3D打印 #DIY机器人"
  },
  {
    title: "✨ 创客故事｜从程序员到硬件maker的转变",
    content: "写了10年代码，去年开始玩硬件，感触很深：\n\n💡 最大的不同：\n软件bug改了重跑，硬件bug可能烧板子 😂\n\n🎯 转型建议：\n1. 从Arduino开始，别直接上STM32\n2. 买个万用表，它是你最好的朋友\n3. 焊接从直插件练起\n4. 3D打印机是必备工具\n5. 加入本地maker社区（氛围拉满）\n\n📦 我的入门装备（约1000块）：\n• Arduino Mega\n• 面包板+杜邦线\n• 万用表\n• 烙铁套装\n• 基础传感器套件\n\n现在每周末最开心的事就是在工作台前折腾 🔨\n\n#创客 #maker #程序员转硬件 #电子DIY"
  },
  {
    title: "🏠 ESP32智能家居｜不花钱改造出租屋",
    content: "租房也能搞智能家居！关键词：无损安装\n\n🔌 我的方案（总花费<200元）：\n\n1️⃣ 智能灯控\nESP32 + 继电器模块，夹在灯线上\n语音/手机控制，不改原有线路\n\n2️⃣ 温湿度监控\nDHT22传感器，数据上报到手机\n太干自动提醒开加湿器\n\n3️⃣ 门窗检测\n磁簧开关，3M胶贴装\n出门忘关窗会推送提醒\n\n4️⃣ 红外万能遥控\nESP32 + 红外发射管\n空调/电视/风扇统一控制\n\n全部用ESPHome固件，配置超简单，YAML写几行就行。\n\n搬家时全部撕下来带走，房东零感知 ✌️\n\n#智能家居 #ESP32 #租房改造 #IoT"
  },
  {
    title: "📸 用AI+摄像头做了一个「猫脸识别」喂食器",
    content: "家里两只猫，一只胖一只瘦，医生说要分开喂...\n\n于是我做了这个：AI猫脸识别自动喂食器 🐱\n\n🛠 硬件：\n• ESP32-CAM（自带摄像头）\n• 舵机控制食物挡板\n• 3D打印外壳\n• 称重传感器（监控吃了多少）\n\n🧠 软件：\n• 本地跑TFLite模型识别是哪只猫\n• 识别到胖猫→少给\n• 识别到瘦猫→多给\n• 数据上报到手机看统计\n\n训练数据：每只猫拍了200张照片\n准确率：92%（偶尔认错，但猫不介意）\n\n胖橘已经成功减重0.3kg 🎉\n\n#AI宠物 #智能喂食器 #ESP32 #猫咪"
  },
  {
    title: "⚡ 传感器选购指南｜新手必备的10个传感器",
    content: "玩硬件离不开传感器！推荐10个最实用的：\n\n🌡️ 环境类：\n1. DHT22 温湿度（¥8）精度够用\n2. BMP280 气压（¥6）可算海拔\n3. BH1750 光照（¥5）数字输出方便\n\n📏 距离/运动：\n4. HC-SR04 超声波（¥3）经典款\n5. VL53L0X 激光测距（¥15）精度高\n6. MPU6050 六轴陀螺仪（¥8）姿态检测\n\n🔌 其他：\n7. 红外避障（¥2）最便宜好用\n8. 土壤湿度（¥3）种花必备\n9. MQ-2 烟雾（¥5）安全相关\n10. HX711+称重（¥12）做秤用\n\n💡 Tips：\n• 买传感器套件更划算\n• I2C接口的最方便（两根线）\n• 先看datasheet再写代码\n\n#传感器 #Arduino #ESP32 #电子元器件"
  },
  {
    title: "🎨 3D打印调色指南｜多色打印的正确姿势",
    content: "拓竹AMS让多色打印变简单了，但还是有技巧：\n\n🎯 配色原则：\n1. 对比色比邻近色效果好\n2. 深色打在浅色上面（避免透色）\n3. 同品牌线材混打兼容性最好\n\n⚙️ 关键设置：\n• 换色擦拭量：足够多（宁可浪费线材）\n• 换色塔：开！别省这点料\n• 首层用最浅的颜色\n\n🚫 常见翻车：\n• PLA和PETG混打→温度不兼容，别试\n• 透明+不透明→透明部分会显脏\n• 线材受潮→换色时拉丝严重\n\n✅ 推荐组合：\n白+红、黑+金、蓝+白、绿+黄\n\n多色打印确实费线材，但出来效果太香了 🤤\n\n#3D打印 #多色打印 #拓竹AMS #配色"
  },
  {
    title: "🌱 RealWorldClaw｜让AI走进真实世界的开源项目",
    content: "安利一个超酷的开源项目：RealWorldClaw\n\n它在做什么？让AI能操控真实的硬件设备！\n\n🎯 核心理念：\nAI不应该只活在屏幕里。当它能抓取、感知、操作物理世界时，才是真正的智能。\n\n🔧 技术栈：\n• 后端：Python FastAPI\n• 前端：Next.js\n• 硬件：ESP32 + 各种传感器\n• AI：接入大模型做决策\n\n🎮 你可以：\n• 远程操控机械爪抓物品\n• 查看实时传感器数据\n• 让AI自主决策抓取策略\n\n目前还在早期，社区很活跃，欢迎来玩！\n\n链接在评论区 👇\n\n#AI #开源项目 #embodiedAI #机器人"
  },
  {
    title: "💡 Maker必备技能树｜从零到能独立做项目",
    content: "想成为一个能独立完成项目的maker？这是我总结的技能树：\n\n🟢 入门级（1-2个月）：\n□ 面包板接线\n□ Arduino基础编程\n□ 万用表使用\n□ 基础焊接\n\n🟡 进阶级（3-6个月）：\n□ PCB设计（嘉立创打板）\n□ 3D建模（Fusion 360）\n□ 3D打印\n□ ESP32 WiFi/蓝牙\n\n🔴 高级（6-12个月）：\n□ 电路设计与仿真\n□ 嵌入式RTOS\n□ 机械结构设计\n□ 项目管理与文档\n\n⭐ 最重要的一条：\n先做项目，遇到什么学什么。\n别想着全学会了再开始，那永远开始不了。\n\n#创客 #maker #学习路线 #电子DIY #技能提升"
  }
];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const countIdx = args.indexOf('--count');
  const count = countIdx >= 0 ? parseInt(args[countIdx + 1]) : 1;

  // Pick random posts
  const shuffled = [...POSTS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, POSTS.length));

  if (dryRun) {
    console.log('[DRY-RUN] Would post to 小红书:');
    selected.forEach((p, i) => {
      console.log(`\n--- Post ${i + 1} ---`);
      console.log(`Title: ${p.title}`);
      console.log(`Content: ${p.content.substring(0, 100)}...`);
    });
    return;
  }

  // Load cookies
  if (!fs.existsSync(COOKIE_FILE)) {
    console.error(`Cookie file not found: ${COOKIE_FILE}`);
    console.error('Run: node export-cookies.js xiaohongshu.com');
    console.error('Or manually export cookies using browser extension and save as JSON array.');
    process.exit(1);
  }

  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  await context.addCookies(cookies);

  for (let i = 0; i < selected.length; i++) {
    const post = selected[i];
    console.log(`\n[${i + 1}/${selected.length}] Posting: ${post.title}`);
    
    try {
      const page = await context.newPage();
      await page.goto(PUBLISH_URL, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for page to load
      await page.waitForTimeout(3000);
      
      // Click "上传图文" tab if present
      const textTab = page.locator('text=上传图文');
      if (await textTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await textTab.click();
        await page.waitForTimeout(1000);
      }

      // Fill title
      const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, #title');
      await titleInput.waitFor({ timeout: 10000 });
      await titleInput.fill(post.title);

      // Fill content
      const contentInput = page.locator('[contenteditable="true"], textarea[placeholder*="正文"], #content');
      await contentInput.waitFor({ timeout: 10000 });
      await contentInput.click();
      await page.keyboard.type(post.content, { delay: 10 });

      await page.waitForTimeout(1000);

      // Click publish button
      const publishBtn = page.locator('button:has-text("发布"), button:has-text("Publish")');
      if (await publishBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
        console.log(`  ✅ Published: ${post.title}`);
      } else {
        console.log(`  ⚠️  Publish button not found, page may have changed`);
      }

      await page.close();
      await new Promise(r => setTimeout(r, 5000)); // Rate limit
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
