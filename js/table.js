// Rendering av poster som ruta med box-drawing-tecken. Bredder räknas i kodpunkter.

import { formatAmount } from './money.js';

const MIN_NOTE = 4;
const MIN_AMOUNT = 9;
const DATE_WIDTH = 10;

/**
 * Beräknar kolumnbredder så att en rad blir exakt `cols` kodpunkter.
 * Beloppskolumnen växer med längsta formaterade belopp; noten tar resten.
 * @param {number} cols
 * @param {{ amount: number }[]} entries
 * @returns {{ date: number, amount: number, note: number }}
 */
export function layout(cols, entries) {
  let amount = MIN_AMOUNT;
  for (const e of entries) {
    amount = Math.max(amount, Array.from(formatAmount(e.amount)).length);
  }
  // Ramen använder 6 tecken utöver kolumnerna: ┌ ┬ ┬ ┬ ─ ┐.
  const note = Math.max(MIN_NOTE, cols - DATE_WIDTH - amount - 6);
  return { date: DATE_WIDTH, amount, note };
}

/**
 * Kapar `text` till `width` kodpunkter (med … om den är för lång) och fyller ut med mellanslag.
 * @param {string} text
 * @param {number} width
 * @returns {string}
 */
export function fit(text, width) {
  if (width <= 0) return '';
  const chars = Array.from(text);
  if (chars.length > width) {
    return chars.slice(0, width - 1).join('') + '…';
  }
  return text + ' '.repeat(width - chars.length);
}

/**
 * Cellinnehåll för en rad. Belopp är högerställt.
 * @param {{ date: string, amount: number, note: string }} entry
 * @param {{ date: number, amount: number, note: number }} lay
 * @returns {{ date: string, amount: string, note: string }}
 */
export function rowCells(entry, lay) {
  return {
    date: fit(entry.date, lay.date),
    amount: formatAmount(entry.amount).padStart(lay.amount),
    note: fit(entry.note, lay.note),
  };
}

function border(lay, left, mid, right) {
  return (
    left +
    '─'.repeat(lay.date) +
    mid +
    '─'.repeat(lay.amount) +
    mid +
    '─'.repeat(lay.note) +
    mid +
    '─' +
    right
  );
}

/**
 * Översta kantlinjen: ┌──┬──┬──┬─┐
 * @param {{ date: number, amount: number, note: number }} lay
 * @returns {string}
 */
export function topLine(lay) {
  return border(lay, '┌', '┬', '┐');
}

/**
 * Nedersta kantlinjen: └──┴──┴──┴─┘
 * @param {{ date: number, amount: number, note: number }} lay
 * @returns {string}
 */
export function bottomLine(lay) {
  return border(lay, '└', '┴', '┘');
}

/**
 * Dubbelram runt rader (t.ex. header). Varje rad blir exakt `cols` kodpunkter.
 * @param {string[]} lines
 * @param {number} cols
 * @returns {string[]}
 */
export function boxLines(lines, cols) {
  const inner = cols - 2;
  return [
    '╔' + '═'.repeat(inner) + '╗',
    ...lines.map((l) => '║' + fit(l, inner) + '║'),
    '╚' + '═'.repeat(inner) + '╝',
  ];
}
