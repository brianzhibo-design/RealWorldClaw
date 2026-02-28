import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const XHS_COOKIE = `a1=19c8e380ae1gxyhuw0s873lpmp42lpicekek27us030000300049; abRequestId=321cd8d7-2050-5814-ade1-cfdbf0c69e1a; webId=77ccdaee9e8f4dfb29669b9fc6255860; id_token=VjEAAG1PG+DMZIDWyBKUt3avEMfZ/f/zILQEkZF2pmmRxkF5A2ULCdP6JnBqNaNSgaJIlFwJqxOJXoEsDvAPgcGcA/0sR1jrppzqHyLjGpLs4WAcE8NcdDztuznN/c+Nq1xrVEX6; web_session=040069b82285fc8e2073e475a83b4bb1ec1c0b; customerClientId=328592677778424; acw_tc=0ad52d5a17721818241162754e79aa1c9df5e91a93e9b4b9bde39daa9ccaf0; webBuild=5.13.0; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517611464372674920452fr5usm1oparor1lk; acw_tc=0a0d068317721821489515320e5abd18bf5a9ee044aba5ef9f14921aecef69; customer-sso-sid=68c517610321838359855104i6xwxu5y88ulzmk2; galaxy.creator.beaker.session.id=1772182149717066820356; galaxy_creator_session_id=45o2FPJxoepIXpGHX0WLLmxoJI3GwNBm3gRW; x-user-id-creator.xiaohongshu.com=6956c6b40000000037007025; xsecappid=ugc; sec_poison_id=3cf1d779-d69f-4e35-9ce8-774635dac925; websectiga=2845367ec3848418062e761c09db7caf0e8b79d132ccdd1a4f8e64a11d0cac0d; gid=yjSYdqYyW4d4yjSYdqY80TW7dykCvx7E8MYWdM8q1U6U4Tq8J1U3SJ888q8884j8i0W04dYd`;

const POSTS_FILE = '/Users/brianzhibo/openclaw/yangcun/realworldclaw/content/xhs-posts.json';
const LOG_FILE = '/Users/brianzhibo/openclaw/yangcun/realworldclaw/content/posted-log.json';
const IMG_DIR = '/Users/brianzhibo/openclaw/yangcun/realworldclaw/scripts/xhs_covers';

function parseCookies(cookieStr) {
  return cookieStr.split('; ').map(pair => {
    const [name, ...rest] = pair.split('=');
    return {
      name: name.trim(),
      value: rest.join('='),
      domain: '.xiaohongshu.com',
      path: '/'
    };
  });
}

function loadJson(p, def = []) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

async function main() {
  const posts = loadJson(POSTS_FILE).slice(0, 2);
  const log = loadJson(LOG_FILE);
  const cookies = parseCookies(XHS_COOKIE);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 }
  });
  await context.addCookies(cookies);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const imgPath = path.join(IMG_DIR, `cover_${post.id}.jpg`);
    const entry = {
      platform: 'xhs',
      content_id: post.id,
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: null
    };

    try {
      const page = await context.newPage();
      await page.goto('https://creator.xiaohongshu.com/publish/publish', { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Check if we're logged in
      const url = page.url();
      console.log(`Post ${i + 1}: navigated to ${url}`);
      
      if (url.includes('login')) {
        entry.error = 'Cookie expired - redirected to login';
        console.log(`  FAILED: ${entry.error}`);
        log.push(entry);
        await page.close();
        continue;
      }

      // Wait for page to load
      await page.waitForTimeout(3000);
      
      // Click "上传图文" tab via JS
      const clicked = await page.evaluate(() => {
        const els = [...document.querySelectorAll('*')].filter(e => e.textContent.trim() === '上传图文');
        if (els.length > 0) { els[0].click(); return true; }
        // Try tab-like elements
        const tabs = [...document.querySelectorAll('[class*="tab"], [role="tab"]')];
        for (const t of tabs) {
          if (t.textContent.includes('图文')) { t.click(); return true; }
        }
        return false;
      });
      console.log(`  Click 上传图文: ${clicked}`);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(IMG_DIR, `after_tab_${post.id}.png`) });
      
      // Screenshot for debug
      await page.screenshot({ path: path.join(IMG_DIR, `debug_${post.id}.png`) });
      
      // Upload image - find file input
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(imgPath);
        console.log(`  Uploaded image: ${imgPath}`);
      } else {
        // Try to find any upload area
        const uploadInputs = await page.$$('input[accept*="image"]');
        if (uploadInputs.length > 0) {
          await uploadInputs[0].setInputFiles(imgPath);
          console.log(`  Uploaded image via accept=image input`);
        } else {
          entry.error = 'No file input found';
          console.log(`  FAILED: ${entry.error}`);
          log.push(entry);
          await page.close();
          continue;
        }
      }
      
      await page.waitForTimeout(3000);
      
      // Wait for image to process
      await page.waitForTimeout(5000);
      
      // Fill title using placeholder selector
      try {
        const titleEl = page.locator('[placeholder*="标题"]').first();
        await titleEl.click();
        await titleEl.fill(post.title);
        console.log(`  Filled title: ${post.title.slice(0, 30)}...`);
      } catch (e) {
        // fallback: find all inputs/contenteditables
        console.log(`  Title fill failed, trying fallback...`);
        await page.evaluate((title) => {
          const el = document.querySelector('[placeholder*="标题"]') || 
                     document.querySelector('input[class*="title"]');
          if (el) { el.focus(); el.value = title; el.dispatchEvent(new Event('input', {bubbles:true})); }
        }, post.title);
      }
      await page.waitForTimeout(500);
      
      // Fill body - find the description/body area
      try {
        const bodyEl = page.locator('[placeholder*="正文"], [placeholder*="描述"]').first();
        await bodyEl.click();
        const bodyText = post.body.slice(0, 800);
        await bodyEl.fill(bodyText);
        console.log(`  Filled body (${bodyText.length} chars)`);
      } catch (e) {
        console.log(`  Body fill failed, trying fallback...`);
        const editables = await page.$$('[contenteditable="true"]');
        for (const ed of editables) {
          const text = await ed.textContent();
          if (!text || text.length < 5) {
            await ed.click();
            await page.keyboard.type(post.body.slice(0, 500), { delay: 5 });
            console.log(`  Typed body via contenteditable`);
            break;
          }
        }
      }
      
      await page.waitForTimeout(1000);
      // Dismiss any dropdowns
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: path.join(IMG_DIR, `prefill_${post.id}.png`) });
      
      // Click publish button
      try {
        // Try multiple selectors for publish button
        const publishBtn = page.locator('button').filter({ hasText: '发布' }).first();
        await publishBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await publishBtn.click();
        console.log(`  Clicked publish button`);
      } catch (e) {
        // JS fallback
        const clicked = await page.evaluate(() => {
          const btns = [...document.querySelectorAll('button')];
          const pub = btns.find(b => b.textContent.trim().includes('发布'));
          if (pub) { pub.click(); return true; }
          return false;
        });
        console.log(`  JS publish click: ${clicked}`);
      }
      
      await page.waitForTimeout(8000);
      
      // Check for success
      const finalUrl = page.url();
      await page.screenshot({ path: path.join(IMG_DIR, `result_${post.id}.png`) });
      console.log(`  Final URL: ${finalUrl}`);
      
      // Check for success indicators
      const pageText = await page.evaluate(() => document.body.innerText.slice(0, 500));
      if (finalUrl.includes('success') || pageText.includes('发布成功') || pageText.includes('已发布')) {
        entry.status = 'success';
      } else if (finalUrl !== 'https://creator.xiaohongshu.com/publish/publish') {
        entry.status = 'success';
        entry.note = `Redirected to ${finalUrl}`;
      } else {
        entry.error = 'Publish may not have completed - still on publish page';
        entry.status = 'uncertain';
      }
      
      console.log(`  Result: ${entry.status}${entry.error ? ' - ' + entry.error : ''}`);
      log.push(entry);
      await page.close();
      
      if (i < posts.length - 1) {
        console.log('Waiting 15s...');
        await new Promise(r => setTimeout(r, 15000));
      }
    } catch (err) {
      entry.error = err.message;
      console.log(`  ERROR: ${err.message}`);
      log.push(entry);
    }
  }

  await browser.close();
  saveJson(LOG_FILE, log);
  
  const ok = log.filter(e => e.platform === 'xhs' && e.status === 'success').length;
  const total = log.filter(e => e.platform === 'xhs').length;
  console.log(`\nXHS Done. ${ok}/${total} succeeded.`);
}

main().catch(console.error);
