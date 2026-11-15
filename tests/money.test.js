import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, formatAmount, todayISO } from '../js/money.js';

test('parseAmount accepterar svenska och engelska format', () => {
  assert.equal(parseAmount('1 234,5'), 123450);
  assert.equal(parseAmount('12.34'), 1234);
  assert.equal(parseAmount('250'), 25000);
  assert.equal(parseAmount('-500'), -50000);
  assert.equal(parseAmount(' 0,05 '), 5);
});
test('parseAmount avvisar ogiltigt och noll', () => {
  // fler än två decimaler avvisas (”1.234” är tvetydigt: tusental eller decimal?)
  for (const s of ['', '   ', 'abc', '0', '0,00', '1,2,3', '12a', '-', '12.345', '1.234']) {
    assert.equal(parseAmount(s), null, s);
  }
});
test('formatAmount', () => {
  assert.equal(formatAmount(123450), '1 234,50');
  assert.equal(formatAmount(0), '0,00');
  assert.equal(formatAmount(-12345), '-123,45');
  assert.equal(formatAmount(999999999), '9 999 999,99');
});
test('todayISO använder lokal tid', () => {
  assert.equal(todayISO(new Date(2026, 10, 15, 23, 59)), '2026-11-15');
  assert.equal(todayISO(new Date(2026, 0, 3, 0, 1)), '2026-01-03');
});
