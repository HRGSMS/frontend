import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Execute the real store with isolated API and browser-storage dependencies.
function setup(checkOut) {
  const booking = { id: 'booking-1', publicId: 'booking-1', bookingStatus: 'Checked-In' };
  let stored = JSON.stringify([booking]);
  const localStorage = {
    getItem: () => stored,
    setItem: (_key, value) => { stored = value; },
  };
  const source = readFileSync(new URL('../src/lib/bookingStore.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  const require = (name) => {
    if (name === '../api/reservationApi') return { reservationApi: { checkOut } };
    return {};
  };
  new Function('require', 'exports', 'localStorage', outputText)(require, exports, localStorage);
  return { store: exports.bookingStore, read: () => JSON.parse(stored)[0] };
}

test('checkout stays checked in while the database request is pending', async () => {
  let finish;
  const { store, read } = setup((id) => {
    assert.equal(id, 'booking-1');
    return new Promise((resolve) => { finish = resolve; });
  });
  const pending = store.updateBookingStatus('booking-1', 'Checked-Out');
  assert.equal(read().bookingStatus, 'Checked-In');
  finish({ success: true });
  assert.equal((await pending).bookingStatus, 'Checked-Out');
  assert.equal(read().bookingStatus, 'Checked-Out');
});

for (const reason of ['Outstanding balance prevents checkout', 'Network Error']) {
  test(`checkout preserves the booking and rejects on: ${reason}`, async () => {
    const error = new Error(reason);
    const { store, read } = setup(async () => { throw error; });
    await assert.rejects(store.updateBookingStatus('booking-1', 'Checked-Out'), (err) => err === error);
    assert.equal(read().bookingStatus, 'Checked-In');
  });
}

test('an explicit API rejection does not mark checkout successful', async () => {
  const { store, read } = setup(async () => ({ success: false, message: 'Checkout rejected' }));
  await assert.rejects(store.updateBookingStatus('booking-1', 'Checked-Out'), /Checkout rejected/);
  assert.equal(read().bookingStatus, 'Checked-In');
});
