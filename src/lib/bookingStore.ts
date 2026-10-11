import { reservationApi } from '../api/reservationApi';

export type BookingStatus = 'Booked' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Refunded';

export interface Booking {
  id: number | string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  branchName: string;
  roomNumbers: string;
  roomType?: string;
  bookingTime: string;
  checkIn: string;
  checkOut: string;
  cancellationTime?: string | null;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  totalCharge: number;
  outstandingAmount: number;
  totalTaxAmount?: number;
  source?: string;
  nights?: number;
  specialRequests?: string;
}

const LOCAL_STORAGE_KEY = 'hrgms_frontdesk_bookings_v2';

export const sampleBookings: Booking[] = [
  {
    id: 1001,
    guestName: 'John Smith',
    guestEmail: 'john.smith@example.com',
    guestPhone: '+94 77 123 4567',
    branchName: 'Colombo Grand',
    roomNumbers: '101',
    roomType: 'Deluxe King',
    bookingTime: new Date(Date.now() - 86400000 * 3).toISOString(),
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    bookingStatus: 'Booked',
    paymentStatus: 'Paid',
    totalCharge: 45000,
    outstandingAmount: 0,
    totalTaxAmount: 4500,
    source: 'Website',
    nights: 3,
    specialRequests: 'High floor preferred, airport pickup requested.',
  },
  {
    id: 1002,
    guestName: 'Jane Doe',
    guestEmail: 'jane.doe@example.com',
    guestPhone: '+94 71 987 6543',
    branchName: 'Colombo Grand',
    roomNumbers: '105',
    roomType: 'Superior Twin',
    bookingTime: new Date(Date.now() - 86400000 * 4).toISOString(),
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    bookingStatus: 'Booked',
    paymentStatus: 'Partially Paid',
    totalCharge: 32000,
    outstandingAmount: 12000,
    totalTaxAmount: 3200,
    source: 'Direct Phone',
    nights: 2,
    specialRequests: 'Late arrival expected at 18:00.',
  },
  {
    id: 1003,
    guestName: 'Daniel Perera',
    guestEmail: 'daniel.p@example.com',
    guestPhone: '+94 76 555 1212',
    branchName: 'Kandy Hills Resort',
    roomNumbers: '201',
    roomType: 'Deluxe King',
    bookingTime: new Date(Date.now() - 86400000 * 5).toISOString(),
    checkIn: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    bookingStatus: 'Checked-In',
    paymentStatus: 'Paid',
    totalCharge: 38000,
    outstandingAmount: 0,
    totalTaxAmount: 3800,
    source: 'OTA Booking',
    nights: 2,
    specialRequests: 'Extra pillows requested upon check-in.',
  },
  {
    id: 1004,
    guestName: 'Sophie Chen',
    guestEmail: 'sophie.chen@example.com',
    guestPhone: '+65 9123 4567',
    branchName: 'Galle Fort Heritage',
    roomNumbers: '302',
    roomType: 'Executive Suite',
    bookingTime: new Date(Date.now() - 86400000 * 7).toISOString(),
    checkIn: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    checkOut: new Date().toISOString().split('T')[0],
    bookingStatus: 'Checked-In',
    paymentStatus: 'Paid',
    totalCharge: 95000,
    outstandingAmount: 0,
    totalTaxAmount: 9500,
    source: 'Website',
    nights: 2,
    specialRequests: 'Express check-out requested.',
  },
  {
    id: 1005,
    guestName: 'Liam Fernando',
    guestEmail: 'liam.f@example.com',
    guestPhone: '+94 70 333 4444',
    branchName: 'Colombo Grand',
    roomNumbers: '108',
    roomType: 'Superior Twin',
    bookingTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    bookingStatus: 'Booked',
    paymentStatus: 'Pending',
    totalCharge: 16000,
    outstandingAmount: 16000,
    totalTaxAmount: 1600,
    source: 'Walk-in',
    nights: 1,
  },
  {
    id: 1006,
    guestName: 'Isabella Martin',
    guestEmail: 'isabella.m@example.com',
    guestPhone: '+44 20 7946 0991',
    branchName: 'Kandy Hills Resort',
    roomNumbers: '204',
    roomType: 'Deluxe King',
    bookingTime: new Date(Date.now() - 86400000 * 10).toISOString(),
    checkIn: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    checkOut: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    bookingStatus: 'Checked-Out',
    paymentStatus: 'Paid',
    totalCharge: 57000,
    outstandingAmount: 0,
    totalTaxAmount: 5700,
    source: 'Direct Phone',
    nights: 3,
  },
  {
    id: 1007,
    guestName: 'Marcus Vance',
    guestEmail: 'marcus.vance@example.com',
    guestPhone: '+1 415 555 2671',
    branchName: 'Colombo Grand',
    roomNumbers: '112',
    roomType: 'Deluxe King',
    bookingTime: new Date(Date.now() - 86400000 * 12).toISOString(),
    checkIn: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    checkOut: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    bookingStatus: 'Cancelled',
    cancellationTime: new Date(Date.now() - 86400000 * 4).toISOString(),
    paymentStatus: 'Refunded',
    totalCharge: 42000,
    outstandingAmount: 0,
    totalTaxAmount: 4200,
    source: 'Website',
    nights: 3,
  },
];

function getStoredLocalBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return sampleBookings;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : sampleBookings;
  } catch {
    return sampleBookings;
  }
}

function saveLocalBookings(bookings: Booking[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Failed to save bookings to localStorage', err);
  }
}

export const bookingStore = {
  async fetchBookings(filters?: { status?: string; branchId?: number }): Promise<Booking[]> {
    const local = getStoredLocalBookings();

    try {
      const apiResponse = await reservationApi.listBookings(filters || {});
      const backendRows = apiResponse?.data;

      if (Array.isArray(backendRows) && backendRows.length > 0) {
        const remoteBookings: Booking[] = backendRows.map((row: any, idx: number) => {
          const checkInDate = row.check_in_time ? row.check_in_time.split('T')[0] : '';
          const checkOutDate = row.check_out_time ? row.check_out_time.split('T')[0] : '';
          const diffDays =
            checkInDate && checkOutDate
              ? Math.max(
                  1,
                  Math.round(
                    (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000,
                  ),
                )
              : 1;

          return {
            id: row.booking_id || `BK-${2000 + idx}`,
            guestName: row.guest_name || 'Guest',
            guestEmail: row.guest_email || 'guest@example.com',
            branchName: row.branch_names || 'Colombo Grand',
            roomNumbers: row.room_numbers || 'Unassigned',
            roomType: 'Standard Room',
            bookingTime: row.booking_time || new Date().toISOString(),
            checkIn: checkInDate,
            checkOut: checkOutDate,
            cancellationTime: row.cancellation_time,
            bookingStatus: (row.booking_status as BookingStatus) || 'Booked',
            paymentStatus: (row.payment_status as PaymentStatus) || 'Pending',
            totalCharge: Number(row.total_charge) || 0,
            outstandingAmount: Number(row.outstanding_amount) || 0,
            totalTaxAmount: Number(row.total_tax_amount) || 0,
            nights: diffDays,
          };
        });

        const mergedMap = new Map<string | number, Booking>();
        for (const item of remoteBookings) {
          mergedMap.set(String(item.id), item);
        }
        for (const item of local) {
          mergedMap.set(String(item.id), item);
        }

        const merged = Array.from(mergedMap.values());
        saveLocalBookings(merged);
        return merged;
      }
    } catch {
      // Backend not running or offline, return local store
    }

    return local;
  },

  async getBookingById(id: string | number): Promise<Booking | null> {
    const all = await this.fetchBookings();
    const found = all.find((b) => String(b.id) === String(id));
    return found || null;
  },

  async createBooking(bookingData: Omit<Booking, 'id' | 'bookingTime'>): Promise<Booking> {
    const local = getStoredLocalBookings();
    const newId = 1000 + local.length + 1;
    const now = new Date().toISOString();

    const created: Booking = {
      ...bookingData,
      id: newId,
      bookingTime: now,
    };

    const updated = [created, ...local];
    saveLocalBookings(updated);

    try {
      await reservationApi.createBooking({
        guestId: 1,
        roomIds: [1],
        checkIn: created.checkIn,
        checkOut: created.checkOut,
        source: created.source || 'Front Desk',
      });
    } catch {
      // Backend endpoint optional
    }

    return created;
  },

  async updateBookingStatus(id: string | number, status: BookingStatus): Promise<Booking | null> {
    const local = getStoredLocalBookings();
    const idx = local.findIndex((b) => String(b.id) === String(id));
    if (idx === -1) return null;

    const existing = local[idx];
    const updatedBooking: Booking = {
      ...existing,
      bookingStatus: status,
      cancellationTime:
        status === 'Cancelled' ? new Date().toISOString() : existing.cancellationTime,
    };

    local[idx] = updatedBooking;
    saveLocalBookings(local);

    try {
      const numericId = Number(id);
      if (!Number.isNaN(numericId)) {
        if (status === 'Checked-In') await reservationApi.checkIn(numericId);
        else if (status === 'Checked-Out') await reservationApi.checkOut(numericId);
        else if (status === 'Cancelled') await reservationApi.cancelBooking(numericId);
      }
    } catch {
      // Backend endpoint optional
    }

    return updatedBooking;
  },
};
