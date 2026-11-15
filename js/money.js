// Belopp i ören (heltal). Inga flyttal i beräkningar.

const AMOUNT_RE = /^-?\d+(\.\d{1,2})?$/;

/**
 * Tolkar en användarinmatning som belopp i kronor och returnerar ören.
 * Returnerar null om ogiltigt, eller om beloppet är 0.
 * @param {string} input
 * @returns {number | null}
 */
export function parseAmount(input) {
  if (typeof input !== 'string') return null;
  const normalized = input.replace(/\s/g, '').replace(',', '.');
  if (!AMOUNT_RE.test(normalized)) return null;

  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [intPart, decPart = ''] = unsigned.split('.');
  const fracPart = decPart.padEnd(2, '0');

  const ore = Number(intPart) * 100 + Number(fracPart);
  if (ore === 0) return null;
  return negative ? -ore : ore;
}

/**
 * Formaterar ören till svensk visning, t.ex. 123450 -> "1 234,50".
 * @param {number} ore
 * @returns {string}
 */
export function formatAmount(ore) {
  const sign = ore < 0 ? '-' : '';
  const abs = Math.abs(ore);
  const kronor = Math.floor(abs / 100);
  const oreRest = abs % 100;
  const grouped = String(kronor).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${grouped},${String(oreRest).padStart(2, '0')}`;
}

/**
 * Lokalt datum som ÅÅÅÅ-MM-DD.
 * @param {Date} [now]
 * @returns {string}
 */
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
