import { reservationApi } from '../api/reservationApi';
import { billingApi } from '../api/billingApi';
import { serviceApi } from '../api/serviceApi';

export type BookingStatus = 'Booked' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Refunded' | 'Unpaid';

export interface Booking {
  id: number | string;
  publicId?: string;
  bookingReference?: string;
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

export const sampleBookings: Booking[] = [];

function getStoredLocalBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  // Fetches bookings from Vidath's GET /api/bookings and syncs with store
  async fetchBookings(filters?: { status?: string; branchId?: number }): Promise<Booking[]> {
    try {
      const apiResponse = await reservationApi.listBookings(filters?.status ? { status: filters.status } : {});
      const backendRows = apiResponse?.data;

      if (Array.isArray(backendRows)) {
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

          const key = row.public_id || `BK-${2000 + idx}`;
          return {
            id: key,
            publicId: row.public_id,
            bookingReference: row.booking_reference,
            guestName: row.guest_name || 'Guest',
            guestEmail: row.guest_email || 'guest@example.com',
            branchName: row.branch_names || 'SkyNest Colombo',
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

        saveLocalBookings(remoteBookings);
        return remoteBookings;
      }
    } catch {
      // Backend not responding or offline, use store
    }

    return getStoredLocalBookings();
  },

  async getBookingById(id: string | number): Promise<Booking | null> {
    const all = await this.fetchBookings();
    const found = all.find((b) => String(b.id) === String(id) || String(b.publicId) === String(id));
    return found || null;
  },

  // Calls Vidath's POST /api/bookings with resolved guest_public_id and room_public_ids
  async createBooking(
    bookingData: Omit<Booking, 'id' | 'bookingTime'>,
    initialPayment?: { amount: number; paymentMethod: string },
  ): Promise<Booking> {
    const local = getStoredLocalBookings();
    const newId = `bkg-${Date.now()}`;
    const now = new Date().toISOString();

    const created: Booking = {
      ...bookingData,
      id: newId,
      publicId: newId,
      bookingTime: now,
    };

    try {
      // 1. Resolve or create guest
      let guestPublicId: string | undefined;
      const guestsRes = await reservationApi.listGuests();
      const existing = guestsRes?.data?.find((g: any) => g.email === bookingData.guestEmail);

      if (existing?.public_id) {
        guestPublicId = existing.public_id;
      } else {
        const parts = bookingData.guestName.trim().split(' ');
        const firstName = parts[0] || 'Guest';
        const lastName = parts.slice(1).join(' ') || 'Customer';

        const createdGuest = await reservationApi.createGuest({
          first_name: firstName,
          last_name: lastName,
          email: bookingData.guestEmail,
          phone_number: bookingData.guestPhone || '+94 77 123 4567',
        });
        guestPublicId = createdGuest?.data?.public_id;
      }

      // 2. Resolve room public_id
      const roomsRes = await reservationApi.listRooms();
      const targetRoom = roomsRes?.data?.find(
        (r: any) => r.room_number === bookingData.roomNumbers,
      );
      const roomPublicId = targetRoom?.public_id || roomsRes?.data?.[0]?.public_id;

      if (guestPublicId && roomPublicId) {
        const res = await reservationApi.createBooking({
          guest_public_id: guestPublicId,
          room_public_ids: [roomPublicId],
          check_in_time: `${bookingData.checkIn}T14:00:00`,
          check_out_time: `${bookingData.checkOut}T11:00:00`,
          booking_status: bookingData.bookingStatus === 'Checked-In' ? 'Checked-In' : 'Booked',
        });

        if (res?.data?.public_id) {
          created.id = res.data.public_id;
          created.publicId = res.data.public_id;
          created.bookingReference = res.data.booking_reference;

          // 3. If there is an upfront/deposit payment, post it to backend
          if (initialPayment && initialPayment.amount > 0) {
            try {
              await billingApi.recordPayment(res.data.public_id, {
                amount: initialPayment.amount,
                payment_method: initialPayment.paymentMethod || 'Credit Card',
              });
            } catch (payErr) {
              console.warn('Initial payment failed to record on backend', payErr);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Backend booking creation completed with local persistence', err);
    }

    const updated = [created, ...local];
    saveLocalBookings(updated);
    return created;
  },

  // Calls Vidath's PATCH /api/bookings/:publicId for Check-In, Check-Out, Cancellation
  async updateBookingStatus(id: string | number, status: BookingStatus): Promise<Booking | null> {
    const local = getStoredLocalBookings();
    const idx = local.findIndex((b) => String(b.id) === String(id) || String(b.publicId) === String(id));
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
      const publicId = String(existing.publicId || id);
      if (status === 'Checked-In') {
        await reservationApi.checkIn(publicId);
      } else if (status === 'Checked-Out') {
        await reservationApi.checkOut(publicId);
      } else if (status === 'Cancelled') {
        await reservationApi.cancelBooking(publicId);
      } else {
        await reservationApi.updateBooking(publicId, { booking_status: status });
      }
    } catch (err) {
      console.warn('Backend status update fallback to local state', err);
    }

    return updatedBooking;
  },

  // Calls Vidath's POST /api/bookings/:publicId/payments (sp_calculate_bill)
  async recordPayment(
    id: string | number,
    amount: number,
    paymentMethod: string = 'Credit Card',
  ): Promise<Booking | null> {
    const local = getStoredLocalBookings();
    const idx = local.findIndex((b) => String(b.id) === String(id) || String(b.publicId) === String(id));
    if (idx === -1) return null;

    const existing = local[idx];
    const newOutstanding = Math.max(0, existing.outstandingAmount - amount);
    const newPaymentStatus: PaymentStatus =
      newOutstanding === 0 ? 'Paid' : newOutstanding < existing.totalCharge ? 'Partially Paid' : 'Pending';

    const updatedBooking: Booking = {
      ...existing,
      outstandingAmount: newOutstanding,
      paymentStatus: newPaymentStatus,
    };

    local[idx] = updatedBooking;
    saveLocalBookings(local);

    try {
      const publicId = String(existing.publicId || id);
      await billingApi.recordPayment(publicId, {
        amount,
        payment_method: paymentMethod,
      });
    } catch (err) {
      console.warn('Backend payment record fallback to local state', err);
    }

    return updatedBooking;
  },

  // Calls Vidath's POST /api/bookings/:publicId/services (sp_calculate_bill)
  async recordServiceUsage(
    id: string | number,
    servicePublicId: string,
    roomPublicId: string,
    quantity: number,
  ) {
    try {
      const local = getStoredLocalBookings();
      const existing = local.find((b) => String(b.id) === String(id) || String(b.publicId) === String(id));
      const publicId = String(existing?.publicId || id);

      return await serviceApi.orderService(publicId, {
        service_public_id: servicePublicId,
        room_public_id: roomPublicId,
        quantity,
      });
    } catch (err) {
      console.warn('Backend service consumption error', err);
      throw err;
    }
  },
};
