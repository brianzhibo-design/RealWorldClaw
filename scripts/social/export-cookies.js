#!/usr/bin/env node
// export-cookies.js — Export Chrome cookies for Playwright
// Usage: node export-cookies.js <domain> [--chrome-profile "Default"]
// Requires: npm install better-sqlite3 (or uses sqlite3 CLI fallback)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const domain = process.argv[2];
if (!domain) {
  console.error('Usage: node export-cookies.js <domain>');
  console.error('Example: node export-cookies.js xiaohongshu.com');
  process.exit(1);
}

const profile = process.argv.includes('--chrome-profile')
  ? process.argv[process.argv.indexOf('--chrome-profile') + 1]
  : 'Default';

const cookieDir = path.join(__dirname, '.cookies');
fs.mkdirSync(cookieDir, { recursive: true });

// Chrome cookie DB path (macOS)
const chromeBase = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
const cookieDb = path.join(chromeBase, profile, 'Cookies');

if (!fs.existsSync(cookieDb)) {
  console.error(`Chrome cookie DB not found: ${cookieDb}`);
  console.error('Make sure Chrome is installed and the profile name is correct.');
  process.exit(1);
}

// Copy DB to temp (Chrome locks it)
const tmpDb = path.join(os.tmpdir(), `chrome_cookies_${Date.now()}.db`);
fs.copyFileSync(cookieDb, tmpDb);

try {
  // Query cookies using sqlite3 CLI
  const query = `SELECT host_key, name, path, is_secure, (expires_utc/1000000)-11644473600 as expires, is_httponly, has_expires FROM cookies WHERE host_key LIKE '%${domain.replace(/'/g, "''")}%';`;
  
  const raw = execSync(`sqlite3 -separator '|||' "${tmpDb}" "${query}"`, {
    encoding: 'utf-8',
    timeout: 10000
  }).trim();

  if (!raw) {
    console.error(`No cookies found for domain: ${domain}`);
    console.error('Tips:');
    console.error('  1. Make sure you are logged in to the site in Chrome');
    console.error('  2. Close Chrome completely before exporting (Chrome locks the DB)');
    console.error('  3. Try a broader domain match');
    process.exit(1);
  }

  const cookies = raw.split('\n').map(line => {
    const [host, name, cookiePath, secure, expires, httpOnly, hasExpires] = line.split('|||');
    return {
      name: name,
      value: '<ENCRYPTED - see note below>',
      domain: host,
      path: cookiePath || '/',
      expires: hasExpires === '1' ? Number(expires) : -1,
      httpOnly: httpOnly === '1',
      secure: secure === '1',
      sameSite: 'None'
    };
  });

  console.error(`\n⚠️  Chrome encrypts cookie values on macOS using Keychain.`);
  console.error(`To get actual values, use one of these methods:\n`);
  console.error(`  Method 1: Use EditThisCookie browser extension → export JSON`);
  console.error(`  Method 2: Open Chrome DevTools → Application → Cookies → copy manually`);
  console.error(`  Method 3: Use 'cookie-editor' extension (recommended)\n`);
  console.error(`After getting the JSON, save it to: ${path.join(cookieDir, domain + '.json')}`);
  console.error(`Format should be an array of {name, value, domain, path, expires, httpOnly, secure, sameSite}\n`);

  // Write template
  const outFile = path.join(cookieDir, `${domain}.template.json`);
  fs.writeFileSync(outFile, JSON.stringify(cookies, null, 2));
  console.log(`Template written to: ${outFile}`);
  console.log(`Found ${cookies.length} cookies for ${domain}`);
  console.log(`\nEdit the template to fill in actual cookie values, then rename to ${domain}.json`);

} finally {
  fs.unlinkSync(tmpDb);
}
