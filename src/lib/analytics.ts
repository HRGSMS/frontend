// Keep report aggregation independent of rendering so duplicate booking rows cannot inflate room counts.
export function roomCoverage(
  rows: {
    room_public_id?: string;
    room_number: string;
    branch_name: string;
    booking_status: string | null;
  }[],
) {
  const rooms = new Map<string, boolean>();
  for (const row of rows) {
    const key = row.room_public_id || JSON.stringify([row.branch_name, row.room_number]);
    rooms.set(
      key,
      Boolean(rooms.get(key)) || ['Booked', 'Checked-In'].includes(row.booking_status || ''),
    );
  }
  return { total: rooms.size, booked: [...rooms.values()].filter(Boolean).length };
}
export function serviceTotals(
  rows: { service_name: string; total_quantity: string | number; total_amount: string | number }[],
) {
  const services = new Map<string, { name: string; quantity: number; amount: number }>();
  for (const row of rows) {
    const current = services.get(row.service_name) || {
      name: row.service_name,
      quantity: 0,
      amount: 0,
    };
    current.quantity += Number(row.total_quantity) || 0;
    current.amount += Number(row.total_amount) || 0;
    services.set(row.service_name, current);
  }
  return [...services.values()].sort((a, b) => b.amount - a.amount);
}
export function exclusiveEnd(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
