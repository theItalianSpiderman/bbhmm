// DOM-koppling. Affärslogik ligger i money.js, store.js och table.js.

import { parseAmount, formatAmount, todayISO } from './money.js';
import { createStore } from './store.js';
import { layout, rowCells, topLine, bottomLine, boxLines, fit } from './table.js';

function safeStorage() {
  try {
    const s = window.localStorage;
    s.getItem('bbhmm.probe');
    return s;
  } catch {
    const mem = new Map();
    return { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
  }
}

const store = createStore(safeStorage());
const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const els = { probe: $('probe'), header: $('header'), hdr: $('hdr'), list: $('list'), add: $('add'), sheets: $('sheet-root') };

let cols = 0;
let sheetOpen = false;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Mäter teckenbredd och räknar ut antal kolumner. Returnerar true om cols ändrats. */
function measure() {
  const cw = els.probe.getBoundingClientRect().width / 10;
  const main = $('app');
  const cs = getComputedStyle(main);
  const avail = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const next = Math.max(20, Math.floor(avail / cw + 1e-6));
  root.style.setProperty('--w', `${next * cw}px`);
  const changed = next !== cols;
  cols = next;
  return changed;
}

function renderHeader() {
  const { start } = store.state;
  const inner = cols - 2;
  const left = ` START ${start ? formatAmount(start.amount) : '-'}`;
  const right = `${start ? start.date : ''} `;
  const gap = Math.max(1, inner - left.length - right.length);
  const box = boxLines([left + ' '.repeat(gap) + right, ' KVAR', '', ''], cols);
  // box: topp, rad1, KVAR, tom, tom, botten. De två tomma raderna bär det stora beloppet.
  const hdr = el('div', 'hdr');
  box.forEach((t) => hdr.append(el('div', 'line', t)));
  const bal = store.balance();
  hdr.append(el('div', bal < 0 ? 'big neg' : 'big', start ? formatAmount(bal) : ''));
  els.hdr.replaceChildren(hdr);
}

function renderList() {
  const entries = store.sortedEntries();
  const lay = layout(cols, entries);
  const frag = document.createDocumentFragment();
  if (entries.length === 0) {
    frag.append(el('div', 'row', '┌' + '─'.repeat(cols - 2) + '┐'));
    frag.append(el('div', 'row', '│' + fit('inga poster', cols - 2) + '│'));
    frag.append(el('div', 'row', '└' + '─'.repeat(cols - 2) + '┘'));
  } else {
    frag.append(el('div', 'row', topLine(lay)));
    for (const e of entries) {
      const c = rowCells(e, lay);
      const row = el('div', 'row');
      const btn = el('button', 'del', '×');
      btn.type = 'button';
      btn.dataset.id = e.id;
      btn.setAttribute('aria-label', 'Ta bort');
      row.append(`│${c.date}│${c.amount}│${c.note}│`, btn, '│');
      frag.append(row);
    }
    frag.append(el('div', 'row', bottomLine(lay)));
  }
  els.list.replaceChildren(frag);
}

function render() {
  renderHeader();
  renderList();
}

function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight);
}

/** Ritar ett bottenark med dubbelram. fields: [{key,label,type,value,attrs}]. */
function openSheet({ title, fields, cancellable, onSubmit }) {
  if (sheetOpen) return;
  sheetOpen = true;

  const backdrop = el('div', 'backdrop');
  const sheet = el('form', 'sheet');
  sheet.noValidate = true;
  const wrap = el('div', 'wrap');
  sheet.append(wrap);

  const fline = (l, r) => {
    const d = el('div', 'fline');
    d.append(l, el('span', 'mid', '═'.repeat(200)), r);
    return d;
  };
  wrap.append(fline('╔', '╗'));
  const body = el('div', 'fbody');
  wrap.append(body);

  const head = el('div', 'frow');
  const ok = el('button', '', '[√]');
  ok.type = 'submit';
  ok.setAttribute('aria-label', 'Spara');
  head.append(el('span', 'title', title), ok);
  if (cancellable) {
    const cancel = el('button', '', '[×]');
    cancel.type = 'button';
    cancel.setAttribute('aria-label', 'Ångra');
    cancel.addEventListener('click', close);
    head.append(cancel);
  }
  body.append(head);

  const inputs = {};
  const hints = {};
  for (const f of fields) {
    const row = el('div', 'frow');
    const input = el('input');
    input.type = f.type || 'text';
    input.value = f.value ?? '';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', f.label);
    for (const [k, v] of Object.entries(f.attrs || {})) input.setAttribute(k, v);
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      hints[f.key].hidden = true;
    });
    row.append(el('span', 'label', f.label), input);
    if (f.signToggle) {
      const sign = el('button', '', '[-]');
      sign.type = 'button';
      sign.setAttribute('aria-label', 'Växla tecken');
      sign.addEventListener('mousedown', (ev) => ev.preventDefault());
      sign.addEventListener('click', () => {
        input.value = input.value.startsWith('-') ? input.value.slice(1) : `-${input.value}`;
        input.classList.remove('invalid');
        hints[f.key].hidden = true;
        input.focus();
      });
      row.append(sign);
    }
    body.append(row);
    const hintRow = el('div', 'frow hintrow');
    const hint = el('span', 'hint');
    hint.hidden = true;
    hintRow.append(hint);
    hints[f.key] = hint;
    inputs[f.key] = input;
    body.append(hintRow);
  }
  wrap.append(fline('╚', '╝'));

  function close() {
    sheetOpen = false;
    backdrop.remove();
    sheet.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(ev) {
    if (ev.key === 'Escape' && cancellable) close();
  }
  document.addEventListener('keydown', onKey);
  if (cancellable) backdrop.addEventListener('click', close);

  sheet.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const values = Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.value]));
    const errors = onSubmit(values);
    if (!errors) {
      close();
      return;
    }
    for (const [k, msg] of Object.entries(errors)) {
      inputs[k].classList.add('invalid');
      hints[k].textContent = msg;
      hints[k].hidden = false;
      inputs[k].focus();
    }
  });

  els.sheets.append(backdrop, sheet);
  inputs[fields[0].key].focus();
}

function openAdd() {
  openSheet({
    title: 'NY POST',
    cancellable: true,
    fields: [
      { key: 'amount', label: 'BELOPP', value: '', signToggle: true, attrs: { inputmode: 'decimal' } },
      { key: 'date', label: 'DATUM', type: 'date', value: todayISO() },
      { key: 'note', label: 'NOTERING', value: '', attrs: { maxlength: '60' } },
    ],
    onSubmit({ amount, date, note }) {
      const ore = parseAmount(amount);
      if (ore === null) return { amount: 'ogiltigt belopp' };
      store.addEntry({ date: date || todayISO(), amount: ore, note: note.trim() });
      render();
      scrollToBottom();
      return null;
    },
  });
}

function openStart() {
  const { start } = store.state;
  openSheet({
    title: 'STARTPENGAR',
    cancellable: start !== null,
    fields: [
      { key: 'amount', label: 'BELOPP', value: start ? formatAmount(start.amount) : '', attrs: { inputmode: 'decimal' } },
      { key: 'date', label: 'DATUM', type: 'date', value: start ? start.date : todayISO() },
    ],
    onSubmit({ amount, date }) {
      const ore = parseAmount(amount);
      if (ore === null) return { amount: 'ogiltigt belopp' };
      store.setStart(ore, date || todayISO());
      render();
      return null;
    },
  });
}

els.add.addEventListener('click', openAdd);
els.header.addEventListener('click', openStart);
els.header.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    openStart();
  }
});
els.list.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.del');
  if (!btn) return;
  store.removeEntry(btn.dataset.id);
  render();
});
window.addEventListener('resize', () => {
  if (measure()) render();
});

async function init() {
  try {
    history.scrollRestoration = 'manual';
  } catch {
    // Ignoreras.
  }
  try {
    await document.fonts.load('16px "Departure Mono"');
  } catch {
    // Reservfont används; mätningen blir då fel men sidan fungerar.
  }
  measure();
  render();
  try {
    await document.fonts.ready;
  } catch {
    // Ignoreras.
  }
  if (measure()) render();
  scrollToBottom();
  requestAnimationFrame(scrollToBottom);
  if (!store.state.start) openStart();
}
init();
