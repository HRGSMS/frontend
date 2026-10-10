import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reservationApi } from '../../api/reservationApi';
import apiClient from '../../api/apiClient';
import { bookingStore, type PaymentStatus } from '../../lib/bookingStore';

interface BranchOption {
  name: string;
  location_city?: string;
}

interface RoomTypeOption {
  type_name: string;
  daily_rate: number | string;
  capacity?: number;
  room_type_description?: string;
}

interface GuestOption {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

export default function NewReservationPage() {
  const navigate = useNavigate();

  // Reference data
  const [branches, setBranches] = useState<BranchOption[]>([
    { name: 'Colombo Grand', location_city: 'Colombo' },
    { name: 'Kandy Hills Resort', location_city: 'Kandy' },
    { name: 'Galle Fort Heritage', location_city: 'Galle' },
  ]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([
    { type_name: 'Deluxe King', daily_rate: 150, capacity: 2 },
    { type_name: 'Superior Twin', daily_rate: 120, capacity: 2 },
    { type_name: 'Executive Suite', daily_rate: 280, capacity: 4 },
  ]);
  const [existingGuests, setExistingGuests] = useState<GuestOption[]>([]);

  // Form State
  const [dates] = useState(() => {
    const now = new Date();
    return {
      today: now.toISOString().split('T')[0],
      next: new Date(now.getTime() + 86400000 * 2).toISOString().split('T')[0],
    };
  });

  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [selectedBranch, setSelectedBranch] = useState('Colombo Grand');
  const [checkInDate, setCheckInDate] = useState(dates.today);
  const [checkOutDate, setCheckOutDate] = useState(dates.next);

  const [selectedRoomType, setSelectedRoomType] = useState('Deluxe King');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('101');
  const [bookingSource, setBookingSource] = useState('Direct Walk-in');
  const [initialPaymentOption, setInitialPaymentOption] = useState<'full' | 'partial' | 'pending'>(
    'full',
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBookingId, setSuccessBookingId] = useState<string | number | null>(null);

  // Available room mock lists based on room type
  const availableRoomNumbers =
    selectedRoomType === 'Deluxe King'
      ? ['101', '102', '104', '201', '205']
      : selectedRoomType === 'Superior Twin'
        ? ['105', '108', '202', '203']
        : ['301', '302', '305'];

  const handleRoomTypeSelect = (rtName: string) => {
    setSelectedRoomType(rtName);
    const rooms =
      rtName === 'Deluxe King'
        ? ['101', '102', '104', '201', '205']
        : rtName === 'Superior Twin'
          ? ['105', '108', '202', '203']
          : ['301', '302', '305'];
    setSelectedRoomNumber(rooms[0]);
  };

  // Load backend reference data
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const branchRes = await reservationApi.listBranches();
        if (Array.isArray(branchRes?.data) && branchRes.data.length > 0) {
          setBranches(branchRes.data);
          if (branchRes.data[0]?.name) {
            setSelectedBranch(branchRes.data[0].name);
          }
        }
      } catch {
        // Fallback to defaults
      }

      try {
        const roomTypeRes = await reservationApi.listRoomTypes();
        if (Array.isArray(roomTypeRes?.data) && roomTypeRes.data.length > 0) {
          setRoomTypes(roomTypeRes.data);
          if (roomTypeRes.data[0]?.type_name) {
            setSelectedRoomType(roomTypeRes.data[0].type_name);
          }
        }
      } catch {
        // Fallback to defaults
      }

      try {
        const guestRes = await apiClient.get('/guests');
        if (Array.isArray(guestRes.data?.data)) {
          setExistingGuests(guestRes.data.data);
        }
      } catch {
        // Optional
      }
    }
    fetchMetadata();
  }, []);

  // Autofill if user selects an existing guest
  const handleSelectExistingGuest = (email: string) => {
    const found = existingGuests.find((g) => g.email === email);
    if (found) {
      setGuestFirstName(found.first_name);
      setGuestLastName(found.last_name);
      setGuestEmail(found.email);
      setGuestPhone(found.phone_number || '');
    }
  };

  // Calculations
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const currentType = roomTypes.find((r) => r.type_name === selectedRoomType);
  const dailyRate = Number(currentType?.daily_rate) || 150;
  const roomSubtotal = dailyRate * nights;
  const taxAmount = Math.round(roomSubtotal * 0.1);
  const totalAmount = roomSubtotal + taxAmount;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!guestFirstName.trim() || !guestLastName.trim() || !guestEmail.trim()) {
      setErrorMessage('Please provide the guest first name, last name, and email.');
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setErrorMessage('Check-out date must be after the check-in date.');
      return;
    }

    setIsSubmitting(true);
    try {
      let paymentStatus: PaymentStatus = 'Paid';
      let outstanding = 0;

      if (initialPaymentOption === 'partial') {
        paymentStatus = 'Partially Paid';
        outstanding = Math.round(totalAmount / 2);
      } else if (initialPaymentOption === 'pending') {
        paymentStatus = 'Pending';
        outstanding = totalAmount;
      }

      const created = await bookingStore.createBooking({
        guestName: `${guestFirstName.trim()} ${guestLastName.trim()}`,
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        branchName: selectedBranch,
        roomNumbers: selectedRoomNumber,
        roomType: selectedRoomType,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        bookingStatus: 'Booked',
        paymentStatus,
        totalCharge: totalAmount,
        outstandingAmount: outstanding,
        totalTaxAmount: taxAmount,
        source: bookingSource,
        nights,
        specialRequests,
      });

      setSuccessBookingId(created.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successBookingId) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-6 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-lg border border-slate-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-5">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Reservation Confirmed!</h2>
          <p className="mt-2 text-sm text-slate-500">
            Booking reference{' '}
            <strong className="font-mono text-slate-800">#{successBookingId}</strong> has been
            created successfully for{' '}
            <span className="font-semibold text-slate-800">
              {guestFirstName} {guestLastName}
            </span>
            .
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left text-xs space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Room:</span>
              <span className="font-semibold text-slate-800">
                Room {selectedRoomNumber} ({selectedRoomType})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dates:</span>
              <span className="font-semibold text-slate-800">
                {checkInDate} &rarr; {checkOutDate} ({nights} nights)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Amount:</span>
              <span className="font-bold text-blue-900">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/frontdesk/reservations/${successBookingId}`)}
              className="w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
            >
              View Reservation Details &rarr;
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessBookingId(null);
                setGuestFirstName('');
                setGuestLastName('');
                setGuestEmail('');
                setGuestPhone('');
                setSpecialRequests('');
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Create Another Reservation
            </button>
            <Link
              to="/frontdesk/reservations"
              className="text-xs text-slate-500 hover:text-slate-800 mt-2 block"
            >
              Return to Reservations List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link to="/frontdesk/dashboard" className="hover:text-blue-600 transition-colors">
              Front Desk
            </Link>
            <span>/</span>
            <Link to="/frontdesk/reservations" className="hover:text-blue-600 transition-colors">
              Reservations
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">New</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create New Reservation
            </h1>
            <Link
              to="/frontdesk/reservations"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel &amp; Back
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm font-medium text-rose-800 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900"
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Form Fields (Left 2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Step 1: Guest Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">
                    1
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">Guest Information</h2>
                </div>
                {existingGuests.length > 0 && (
                  <select
                    onChange={(e) => handleSelectExistingGuest(e.target.value)}
                    aria-label="Select from existing guest records"
                    className="text-xs rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 focus:outline-hidden"
                  >
                    <option value="">Select Existing Guest...</option>
                    {existingGuests.map((g) => (
                      <option key={g.email} value={g.email}>
                        {g.first_name} {g.last_name} ({g.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestFirstName}
                    onChange={(e) => setGuestFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestLastName}
                    onChange={(e) => setGuestLastName(e.target.value)}
                    placeholder="e.g. Smith"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="john.smith@example.com"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Requests / Preferences
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Airport transfer, quiet room, late check-in..."
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Stay Dates & Branch */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">
                  2
                </span>
                <h2 className="text-base font-semibold text-slate-900">Branch &amp; Schedule</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hotel Branch *
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-hidden"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name} {b.location_city ? `(${b.location_city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={dates.today}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={checkInDate || dates.today}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Nights
                  </label>
                  <div className="flex h-10 items-center justify-center rounded-lg bg-blue-50/70 border border-blue-200 font-semibold text-blue-900 text-sm">
                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Room Selection */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">
                  3
                </span>
                <h2 className="text-base font-semibold text-slate-900">Room Selection</h2>
              </div>

              {/* Room Type Selector */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Room Category *
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {roomTypes.map((rt) => {
                    const isSelected = selectedRoomType === rt.type_name;
                    return (
                      <button
                        key={rt.type_name}
                        type="button"
                        onClick={() => handleRoomTypeSelect(rt.type_name)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-blue-900 bg-blue-50/60 ring-2 ring-blue-900 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-slate-900 text-sm">{rt.type_name}</h4>
                          <span className="text-xs font-bold text-blue-950">
                            ${Number(rt.daily_rate)}/nt
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Capacity: {rt.capacity || 2} Guests
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Room Number */}
              <div className="mt-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Room Number (Available for selected dates) *
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {availableRoomNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedRoomNumber(num)}
                      className={`rounded-lg px-3.5 py-2 font-mono text-xs font-bold transition-colors ${
                        selectedRoomNumber === num
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Room {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Summary & Confirm Card */}
          <div className="space-y-6">
            <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Reservation Summary
              </h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Room Type</span>
                  <span className="font-medium text-slate-800">{selectedRoomType}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Room Assigned</span>
                  <span className="font-mono font-semibold text-slate-800">
                    #{selectedRoomNumber}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Branch</span>
                  <span className="font-medium text-slate-800">{selectedBranch}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Duration</span>
                  <span className="font-medium text-slate-800">
                    {nights} night{nights > 1 ? 's' : ''} (${dailyRate}/nt)
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Room Subtotal</span>
                    <span>${roomSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes &amp; Fees (10%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Grand Total</span>
                    <span className="text-blue-900">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Booking Channel */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Booking Channel
                </label>
                <select
                  value={bookingSource}
                  onChange={(e) => setBookingSource(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden"
                >
                  <option value="Direct Walk-in">Direct Walk-in</option>
                  <option value="Direct Phone">Direct Phone</option>
                  <option value="Website">Official Website</option>
                  <option value="Travel Agency">Travel Agency / OTA</option>
                </select>
              </div>

              {/* Initial Payment Status */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment at Booking
                </label>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={initialPaymentOption === 'full'}
                      onChange={() => setInitialPaymentOption('full')}
                      className="text-blue-900"
                    />
                    <span>Collect Full Payment (${totalAmount.toFixed(2)})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={initialPaymentOption === 'partial'}
                      onChange={() => setInitialPaymentOption('partial')}
                      className="text-blue-900"
                    />
                    <span>Collect 50% Deposit (${(totalAmount / 2).toFixed(2)})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={initialPaymentOption === 'pending'}
                      onChange={() => setInitialPaymentOption('pending')}
                      className="text-blue-900"
                    />
                    <span>Pay at Check-In (Pending)</span>
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-blue-900 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Creating Reservation...
                    </>
                  ) : (
                    'Confirm & Create Reservation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
