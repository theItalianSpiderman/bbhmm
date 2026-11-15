import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      map.set(k, String(v));
    },
  };
}

test('balance = start minus poster, negativ post ökar', () => {
  const s = createStore(fakeStorage());
  s.setStart(100000, '2026-11-01');
  s.addEntry({ date: '2026-11-02', amount: 25000, note: 'Mat' });
  s.addEntry({ date: '2026-11-03', amount: -5000, note: 'Retur' });
  assert.equal(s.balance(), 80000);
});

test('balance kan bli negativ', () => {
  const s = createStore(fakeStorage());
  s.setStart(1000, '2026-11-01');
  s.addEntry({ date: '2026-11-02', amount: 13345, note: '' });
  assert.equal(s.balance(), -12345);
});

test('sortering: datum, sedan insättningsordning', () => {
  const s = createStore(fakeStorage());
  s.addEntry({ date: '2026-11-05', amount: 1, note: 'a' });
  s.addEntry({ date: '2026-11-02', amount: 1, note: 'b' });
  s.addEntry({ date: '2026-11-05', amount: 1, note: 'c' });
  assert.deepEqual(s.sortedEntries().map((e) => e.note), ['b', 'a', 'c']);
});

test('removeEntry och persistens över ny store', () => {
  const st = fakeStorage();
  const s = createStore(st);
  s.setStart(5000, '2026-11-01');
  const e = s.addEntry({ date: '2026-11-02', amount: 100, note: 'x' });
  s.addEntry({ date: '2026-11-03', amount: 200, note: 'y' });
  s.removeEntry(e.id);
  const s2 = createStore(st);
  assert.equal(s2.state.entries.length, 1);
  assert.equal(s2.balance(), 4800);
});

test('korrupt JSON eller kastande storage ger tomt läge', () => {
  assert.deepEqual(createStore(fakeStorage({ 'bbhmm.v1': '{nope' })).state, { start: null, entries: [] });
  const throwing = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
  };
  const s = createStore(throwing);
  assert.deepEqual(s.state, { start: null, entries: [] });
  s.setStart(100, '2026-11-01'); // får inte kasta
  assert.equal(s.balance(), 100);
});

test('tomt läge är exakt { start: null, entries: [] }', () => {
  assert.deepEqual(createStore(fakeStorage()).state, { start: null, entries: [] });
  assert.equal(createStore(fakeStorage()).balance(), 0);
});

test('mutationer sparas som JSON under bbhmm.v1', () => {
  const st = fakeStorage();
  const s = createStore(st);
  s.setStart(700, '2026-11-01');
  const saved = JSON.parse(st.getItem('bbhmm.v1'));
  assert.deepEqual(saved, { start: { amount: 700, date: '2026-11-01' }, entries: [] });
});

test('addEntry ger id (UUID) och ökande seq', () => {
  const s = createStore(fakeStorage());
  const a = s.addEntry({ date: '2026-11-01', amount: 1, note: '' });
  const b = s.addEntry({ date: '2026-11-01', amount: 1, note: '' });
  assert.match(a.id, /^[0-9a-f-]{36}$/);
  assert.notEqual(a.id, b.id);
  assert.ok(b.seq > a.seq);
});

test('load sanerar fel form: ogiltig start och ogiltiga poster tas bort', () => {
  // Startbelopp 0 är giltigt här så att balansen blir −100 från den giltiga posten.
  const st = fakeStorage({
    'bbhmm.v1': JSON.stringify({
      start: { amount: 0, date: '2026-11-01' },
      entries: [
        { id: 'x', date: '2026-11-02', amount: 100, note: 'ok', seq: 1 },
        { date: 5 },
      ],
    }),
  });
  const s = createStore(st);
  assert.equal(s.state.entries.length, 1);
  assert.equal(s.balance(), -100);
  const added = s.addEntry({ date: '2026-11-03', amount: 1, note: '' });
  assert.equal(added.seq, 2);
});
