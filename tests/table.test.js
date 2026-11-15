import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fit, layout, rowCells, topLine, bottomLine, boxLines } from '../js/table.js';

test('fit kapar och fyller ut på kodpunkter', () => {
  assert.equal(fit('Mat', 6), 'Mat   ');
  assert.equal(fit('Hyra del två', 8), 'Hyra de…');
  assert.equal(Array.from(fit('Kaffe ☕ och bulle', 7)).length, 7);
});

test('fit hanterar width <= 0 och exakt passform', () => {
  assert.equal(fit('Mat', 0), '');
  assert.equal(fit('Mat', -3), '');
  assert.equal(fit('Mat', 3), 'Mat');
  assert.equal(fit('Mat', 1), '…');
});

test('layout fyller exakt cols och beloppskolumnen växer', () => {
  const small = layout(36, [{ amount: 25000 }]);
  assert.equal(small.date + small.amount + small.note + 1 + 5, 36);
  const big = layout(36, [{ amount: 999999999 }]);
  assert.equal(big.amount, '9 999 999,99'.length);
  assert.ok(big.note >= 4);
});

test('layout med tom lista ger beloppskolumn 9', () => {
  const lay = layout(36, []);
  assert.equal(lay.amount, 9);
  assert.equal(lay.date, 10);
});

test('rowCells högerställer belopp', () => {
  const lay = layout(36, [{ amount: 25000 }]);
  const c = rowCells({ date: '2026-11-02', amount: 25000, note: 'Mat' }, lay);
  assert.equal(c.amount, '250,00'.padStart(lay.amount));
  assert.equal(c.date, '2026-11-02');
  assert.equal(c.note, fit('Mat', lay.note));
});

test('linjer har samma bredd som rader', () => {
  const lay = layout(36, []);
  assert.equal(Array.from(topLine(lay)).length, 36);
  assert.equal(Array.from(bottomLine(lay)).length, 36);
  boxLines(['KVAR', '12 345,67'], 36).forEach(l => assert.equal(Array.from(l).length, 36));
});

test('topLine och bottomLine har rätt övre och nedre skarvar', () => {
  const lay = { date: 10, amount: 9, note: 4 };
  assert.equal(topLine(lay), '┌' + '─'.repeat(10) + '┬' + '─'.repeat(9) + '┬' + '─'.repeat(4) + '┬─┐');
  assert.equal(bottomLine(lay), '└' + '─'.repeat(10) + '┴' + '─'.repeat(9) + '┴' + '─'.repeat(4) + '┴─┘');
});

test('boxLines ritar dubbelram runt rader', () => {
  const [top, row, bottom] = boxLines(['KVAR'], 10);
  assert.equal(top, '╔' + '═'.repeat(8) + '╗');
  assert.equal(row, '║KVAR    ║');
  assert.equal(bottom, '╚' + '═'.repeat(8) + '╝');
});
