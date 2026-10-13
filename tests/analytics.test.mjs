import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomCoverage, serviceTotals, exclusiveEnd } from '../src/lib/analytics.ts';
test('booking coverage deduplicates overlapping reservations without mixing branches', () => {
  const row = { room_number: '101', branch_name: 'Colombo', booking_status: 'Booked' };
  assert.deepEqual(
    roomCoverage([
      row,
      { ...row, booking_status: 'Checked-In' },
      { ...row, booking_status: null },
      { ...row, branch_name: 'Kandy', booking_status: null },
    ]),
    { total: 2, booked: 1 },
  );
  assert.deepEqual(roomCoverage([]), { total: 0, booked: 0 });
});
test('room public identifiers take precedence over display labels', () => {
  assert.deepEqual(
    roomCoverage([
      { room_public_id: 'a', room_number: '1', branch_name: 'Hotel', booking_status: 'Booked' },
      {
        room_public_id: 'a',
        room_number: 'renamed',
        branch_name: 'Hotel',
        booking_status: 'Checked-In',
      },
    ]),
    { total: 1, booked: 1 },
  );
});
test('service analytics aggregate room-level rows using numeric amounts', () => {
  assert.deepEqual(
    serviceTotals([
      { service_name: 'Laundry', total_quantity: '2', total_amount: '120' },
      { service_name: 'Laundry', total_quantity: 1, total_amount: 60 },
      { service_name: 'Spa', total_quantity: 1, total_amount: 300 },
    ]),
    [
      { name: 'Spa', quantity: 1, amount: 300 },
      { name: 'Laundry', quantity: 3, amount: 180 },
    ],
  );
});
test('inclusive report end dates advance across month, leap-day, and year boundaries', () => {
  assert.equal(exclusiveEnd('2026-12-31'), '2027-01-01');
  assert.equal(exclusiveEnd('2024-02-29'), '2024-03-01');
  assert.equal(exclusiveEnd('2026-10-13'), '2026-10-14');
});
