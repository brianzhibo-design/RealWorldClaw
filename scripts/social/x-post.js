#!/usr/bin/env node
// x-post.js — X/Twitter自动发帖 (Playwright)
// Usage: node x-post.js [--dry-run] [--count N]

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, '.cookies', 'x.com.json');

const TWEETS = [
  "Just built an AI agent that can physically grab objects using a 3D-printed claw 🦾 Cost? Under $30.\n\nThe future of AI isn't just chat — it's embodied intelligence.\n\n#AIembodiment #RealWorldClaw #OpenHardware",
  
  "Hot take: Every AI researcher should spend a weekend building hardware.\n\nYou learn more about intelligence from a $5 servo that won't cooperate than from 1000 papers.\n\n#AIembodiment #3Dprinting #maker",
  
  "3D printed a robotic arm this weekend. 4-DOF, ESP32-powered, total BOM < $70.\n\nOpen source design dropping soon. 🔧\n\n#3Dprinting #OpenHardware #robotics #RealWorldClaw",
  
  "The sensor fusion stack for our embodied AI project:\n\n• ESP32-S3 (brain)\n• VL53L0X (eyes)\n• DHT22 (touch)\n• MPU6050 (balance)\n\nAll for ~$20. No excuses not to experiment.\n\n#AIembodiment #IoT #ESP32",
  
  "Why I'm bullish on open-source hardware:\n\n1. Costs dropping exponentially\n2. 3D printing removes manufacturing barriers\n3. ESP32/RPi made compute cheap\n4. AI makes design accessible\n\nWe're entering the golden age of maker culture.\n\n#OpenHardware #3Dprinting",
  
  "Built a color-sorting robot with Arduino + OpenCV this weekend.\n\n95% accuracy, 2 sec/object, total cost $40.\n\nThe trick? HSV color space + adaptive thresholds. RGB is a trap.\n\n#robotics #OpenCV #maker #RealWorldClaw",
  
  "Unpopular opinion: The next breakthrough in AI won't come from bigger models.\n\nIt'll come from giving AI a body — sensors, actuators, real-world feedback loops.\n\nEmbodiment > Parameters\n\n#AIembodiment #RealWorldClaw",
  
  "My desk setup for hardware hacking:\n\n• Bambu Lab P2S (3D printer)\n• Soldering station\n• Oscilloscope\n• ESP32 dev boards (10+)\n• Component organizer\n\nAll in 1.5m × 0.8m. Small space, big builds. 🔨\n\n#maker #workspace #3Dprinting",
  
  "RealWorldClaw update: Our community just hit a milestone 🎉\n\nPeople are building embodied AI projects with 3D-printed parts + ESP32 + open-source firmware.\n\nJoin us: realworldclaw.com\n\n#RealWorldClaw #AIembodiment #OpenHardware",
  
  "Skill tree for becoming a hardware maker in 2026:\n\n🟢 Month 1-2: Arduino + breadboard\n🟡 Month 3-6: PCB design + 3D printing\n🔴 Month 6-12: RTOS + mechanical design\n\nPro tip: Start with a project, learn as you go. Don't wait until you're 'ready'.\n\n#maker #learning #engineering"
];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const countIdx = args.indexOf('--count');
  const count = countIdx >= 0 ? parseInt(args[countIdx + 1]) : 1;

  const shuffled = [...TWEETS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, TWEETS.length));

  if (dryRun) {
    console.log('[DRY-RUN] Would post to X/Twitter:');
    selected.forEach((t, i) => {
      console.log(`\n--- Tweet ${i + 1} ---`);
      console.log(t);
      console.log(`(${t.length} chars)`);
    });
    return;
  }

  if (!fs.existsSync(COOKIE_FILE)) {
    console.error(`Cookie file not found: ${COOKIE_FILE}`);
    console.error('Export cookies from X.com using browser extension and save as JSON array.');
    process.exit(1);
  }

  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  await context.addCookies(cookies);

  for (let i = 0; i < selected.length; i++) {
    const tweet = selected[i];
    console.log(`\n[${i + 1}/${selected.length}] Posting tweet (${tweet.length} chars)...`);

    try {
      const page = await context.newPage();
      await page.goto('https://x.com/home', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Click the tweet compose area
      const composeArea = page.locator('[data-testid="tweetTextarea_0"], [role="textbox"][data-testid]');
      await composeArea.waitFor({ timeout: 15000 });
      await composeArea.click();
      await page.waitForTimeout(500);

      // Type the tweet
      await page.keyboard.type(tweet, { delay: 20 });
      await page.waitForTimeout(1000);

      // Click post button
      const postBtn = page.locator('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
      await postBtn.waitFor({ timeout: 5000 });
      await postBtn.click();
      await page.waitForTimeout(3000);

      console.log(`  ✅ Posted!`);
      await page.close();
      await new Promise(r => setTimeout(r, 10000)); // Rate limit between tweets
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
