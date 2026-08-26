import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countdownParts } from './countdown';

const MIN = 60_000;
const H = 3_600_000;

test('countdownParts : décompose le temps restant en h/m/s, borné à 0', () => {
  const cases: Array<[number, { h: number; m: number; s: number }]> = [
    [0, { h: 0, m: 0, s: 0 }],
    [-5_000, { h: 0, m: 0, s: 0 }],          // passé → borné à 0
    [59_999, { h: 0, m: 0, s: 59 }],
    [1 * MIN, { h: 0, m: 1, s: 0 }],
    [1 * H + 4 * MIN + 33_000, { h: 1, m: 4, s: 33 }],
    [25 * H, { h: 25, m: 0, s: 0 }],
  ];
  for (const [diff, expected] of cases) {
    assert.deepEqual(countdownParts(Date.now() + diff, Date.now()), expected);
  }
});
