import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { getConfig, getToken } from './config.js';

class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(method, endpoint, { body, query, auth = true, formData } = {}) {
  const config = getConfig();
  let url = `${config.apiUrl}${endpoint}`;

  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params}`;
  }

  const headers = {};

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const opts = { method, headers };

  if (formData) {
    // multipart upload
    const { FormData, fileFromPath } = await import('node-fetch');
    // For file uploads we'll use raw body approach
    const fileBuffer = fs.readFileSync(formData.filePath);
    const boundary = '----RWCBoundary' + Date.now();
    headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
    const fileName = path.basename(formData.filePath);
    const parts = [];
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
    if (formData.fields) {
      for (const [k, v] of Object.entries(formData.fields)) {
        parts.push(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}`);
      }
    }
    opts.body = Buffer.concat([
      Buffer.from(parts[0]),
      fileBuffer,
      ...parts.slice(1).map(p => Buffer.from(p)),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    throw new ApiError(0, `无法连接到服务器 (${config.apiUrl}): ${err.message}`);
  }

  let data;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const msg = data?.detail || data?.message || (typeof data === 'string' ? data : res.statusText);
    throw new ApiError(res.status, msg, data);
  }

  return data;
}

export const api = {
  get: (endpoint, opts) => request('GET', endpoint, opts),
  post: (endpoint, opts) => request('POST', endpoint, opts),
  put: (endpoint, opts) => request('PUT', endpoint, opts),
  patch: (endpoint, opts) => request('PATCH', endpoint, opts),
  delete: (endpoint, opts) => request('DELETE', endpoint, opts),
};

export { ApiError };
