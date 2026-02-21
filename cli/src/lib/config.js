import fs from 'fs';
import path from 'path';
import os from 'os';

const RWC_DIR = path.join(os.homedir(), '.rwc');
const CONFIG_PATH = path.join(RWC_DIR, 'config.json');
const AUTH_PATH = path.join(RWC_DIR, 'auth.json');

const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:8000/api/v1',
};

function ensureDir() {
  if (!fs.existsSync(RWC_DIR)) {
    fs.mkdirSync(RWC_DIR, { recursive: true });
  }
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

export function getConfig() {
  return { ...DEFAULT_CONFIG, ...readJson(CONFIG_PATH, {}) };
}

export function setConfig(key, value) {
  const config = readJson(CONFIG_PATH, {});
  config[key] = value;
  writeJson(CONFIG_PATH, config);
  return config;
}

export function resetConfig() {
  writeJson(CONFIG_PATH, {});
}

export function getAuth() {
  return readJson(AUTH_PATH, null);
}

export function setAuth(data) {
  writeJson(AUTH_PATH, data);
}

export function clearAuth() {
  try { fs.unlinkSync(AUTH_PATH); } catch { /* noop */ }
}

export function getToken() {
  const auth = getAuth();
  return auth?.token || null;
}

export { CONFIG_PATH, AUTH_PATH, RWC_DIR };
