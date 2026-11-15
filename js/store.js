// Lokal lagring av startbelopp och poster. Belopp i ören (heltal), datum som ÅÅÅÅ-MM-DD.

const KEY = 'bbhmm.v1';

/**
 * @typedef {{ id: string, date: string, amount: number, note: string, seq: number }} Entry
 * @typedef {{ start: { amount: number, date: string } | null, entries: Entry[] }} State
 */

function emptyState() {
  return { start: null, entries: [] };
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

/** Behåller bara välformade start/poster. Felaktiga delar kastas tyst. */
function sanitizeStart(raw) {
  if (!isObject(raw) || !isFiniteNumber(raw.amount) || typeof raw.date !== 'string') {
    return null;
  }
  return { amount: raw.amount, date: raw.date };
}

function sanitizeEntry(raw) {
  if (
    !isObject(raw) ||
    typeof raw.id !== 'string' ||
    typeof raw.date !== 'string' ||
    !isFiniteNumber(raw.amount) ||
    !isFiniteNumber(raw.seq)
  ) {
    return null;
  }
  return {
    id: raw.id,
    date: raw.date,
    amount: raw.amount,
    note: typeof raw.note === 'string' ? raw.note : '',
    seq: raw.seq,
  };
}

/** Läser sparat läge. Korrupt data eller kastande storage ger tomt läge. */
function load(storage) {
  try {
    const raw = storage.getItem(KEY);
    if (raw == null) return emptyState();
    const parsed = JSON.parse(raw);
    if (!isObject(parsed) || !Array.isArray(parsed.entries)) {
      return emptyState();
    }
    const entries = parsed.entries.map(sanitizeEntry).filter((e) => e !== null);
    return { start: sanitizeStart(parsed.start), entries };
  } catch {
    return emptyState();
  }
}

/**
 * Skapar en store ovanpå ett storage-liknande objekt ({getItem, setItem}).
 * Varje mutation sparas direkt. Fel vid läs/skriv kastas aldrig vidare.
 * @param {{ getItem: (k: string) => string | null, setItem: (k: string, v: string) => void }} storage
 */
export function createStore(storage) {
  /** @type {State} */
  let state = load(storage);

  function save() {
    try {
      storage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Lagring otillgänglig: läget finns kvar i minnet.
    }
  }

  return {
    get state() {
      return state;
    },

    /** @param {number} amount @param {string} date */
    setStart(amount, date) {
      state = { ...state, start: { amount, date } };
      save();
    },

    /** @param {{date: string, amount: number, note: string}} input @returns {Entry} */
    addEntry({ date, amount, note }) {
      const seq = state.entries.reduce((max, e) => Math.max(max, e.seq), 0) + 1;
      const entry = { id: crypto.randomUUID(), date, amount, note, seq };
      state = { ...state, entries: [...state.entries, entry] };
      save();
      return entry;
    },

    /** @param {string} id */
    removeEntry(id) {
      state = { ...state, entries: state.entries.filter((e) => e.id !== id) };
      save();
    },

    /** Datum stigande, sedan insättningsordning (seq). @returns {Entry[]} */
    sortedEntries() {
      return [...state.entries].sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq,
      );
    },

    /** start.amount − Σ entry.amount, 0 om start saknas. @returns {number} */
    balance() {
      if (!state.start) return 0;
      const spent = state.entries.reduce((sum, e) => sum + e.amount, 0);
      return state.start.amount - spent;
    },
  };
}
