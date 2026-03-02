import test from 'node:test';
import assert from 'node:assert/strict';
import { formatStatusJson } from '../src/commands/status.js';

test('formatStatusJson maps fields', () => {
  const result = formatStatusJson({
    server: 'ok',
    version: '1.0.0',
    printersOnline: 3,
    activeOrders: 2,
    modulesCount: 5,
  });

  assert.deepEqual(result, {
    server: 'ok',
    version: '1.0.0',
    printersOnline: 3,
    activeOrders: 2,
    modulesCount: 5,
  });
});

test('formatStatusJson applies defaults', () => {
  const result = formatStatusJson({});
  assert.equal(result.server, '在线');
  assert.equal(result.version, 'unknown');
  assert.equal(result.printersOnline, 0);
  assert.equal(result.activeOrders, 0);
  assert.equal(result.modulesCount, 0);
});
