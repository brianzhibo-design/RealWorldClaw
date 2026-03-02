import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrinters, formatPrinterListJson } from '../src/commands/printer.js';

test('normalizePrinters supports wrapped response', () => {
  const data = { printers: [{ id: 'p1', name: 'A1', model: 'X', status: 'online' }] };
  assert.equal(normalizePrinters(data).length, 1);
});

test('formatPrinterListJson returns stable machine-readable fields', () => {
  const result = formatPrinterListJson([
    { id: 'p1', name: 'A1', model: '', status: 'idle' },
    { id: 'p2', name: 'B2', status: 'printing' },
  ]);

  assert.deepEqual(result, {
    printers: [
      { id: 'p1', name: 'A1', model: '-', status: 'idle' },
      { id: 'p2', name: 'B2', model: '-', status: 'printing' },
    ],
  });
});
