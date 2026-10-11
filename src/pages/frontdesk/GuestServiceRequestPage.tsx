import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { serviceApi } from '../../api/serviceApi';

interface ServiceOption {
  booking_id: number;
  guest_name: string;
  room_id: number;
  room_number: string | number;
  booking_status: string;
}

interface Service {
  service_id: number;
  service_name: string;
  service_description?: string;
  current_price: number | string;
}

interface ApiResponse<T> {
  data: T;
}

const money = (value: number | string) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(Number(value));

export default function GuestServiceRequestPage() {
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookingRoom, setBookingRoom] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function loadFormOptions() {
      setLoading(true);
      setError('');

      try {
        const [optionsResponse, catalogueResponse] = await Promise.all([
          apiClient.get<ApiResponse<ServiceOption[]>>('/service-request-options'),
          serviceApi.getServiceCatalogue({}),
        ]);

        if (!active) return;

        const bookingOptions = optionsResponse.data?.data;
        const catalogue = (catalogueResponse as ApiResponse<Service[]>).data;

        if (!Array.isArray(bookingOptions) || !Array.isArray(catalogue)) {
          throw new Error('The server returned an unexpected response.');
        }

        setOptions(bookingOptions);
        setServices(catalogue);
      } catch (err: unknown) {
        if (!active) return;

        const responseError =
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : undefined;

        setError(
          responseError ||
            (err instanceof Error
              ? err.message
              : 'Could not load bookings and services. Check the backend connection.'),
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadFormOptions();

    return () => {
      active = false;
    };
  }, []);

  const selectedOption = options.find(
    (option) => `${option.booking_id}:${option.room_id}` === bookingRoom,
  );

  const selectedService = services.find(
    (service) => String(service.service_id) === serviceId,
  );

  const total = useMemo(() => {
    const count = Number(quantity);
    const price = Number(selectedService?.current_price ?? 0);

    return Number.isSafeInteger(count) && count > 0 ? count * price : 0;
  }, [quantity, selectedService]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const count = Number(quantity);

    if (!selectedOption) {
      setError('Select an eligible checked-in booking and room.');
      return;
    }

    if (!selectedService) {
      setError('Select a service from the catalogue.');
      return;
    }

    if (!Number.isSafeInteger(count) || count <= 0) {
      setError('Quantity must be a positive whole number.');
      return;
    }

    setSubmitting(true);

    try {
      await serviceApi.requestService({
        bookingId: selectedOption.booking_id,
        roomId: selectedOption.room_id,
        serviceId: selectedService.service_id,
        quantity: count,
        instructions: instructions.trim() || undefined,
      });

      setSuccess(
        `Request submitted successfully for ${selectedOption.guest_name}, room ${selectedOption.room_number}.`,
      );
      setBookingRoom('');
      setServiceId('');
      setQuantity('1');
      setInstructions('');
    } catch (err: unknown) {
      const responseError =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;

      setError(
        responseError ||
          'The request could not be submitted. Please check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 text-sm text-slate-500">
          <Link to="/frontdesk/dashboard" className="hover:text-slate-900">
            Front Desk
          </Link>
          <span className="mx-2">/</span>
          <Link to="/frontdesk/service-requests" className="hover:text-slate-900">
            Guest Services
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">New Request</span>
        </nav>

        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
            SKY NEST HOTELS · GUEST SERVICES
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            New Service Request
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Record a service request for a checked-in guest.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {loading ? (
            <p role="status" className="py-10 text-center text-slate-500">
              Loading eligible bookings and services…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                >
                  {success}
                  <p className="mt-2">
                    <Link
                      to="/frontdesk/service-requests"
                      className="font-semibold underline"
                    >
                      View service requests
                    </Link>
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="bookingRoom"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Guest booking and room *
                </label>
                <select
                  id="bookingRoom"
                  value={bookingRoom}
                  onChange={(event) => setBookingRoom(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a checked-in guest</option>
                  {options.map((option) => (
                    <option
                      key={`${option.booking_id}:${option.room_id}`}
                      value={`${option.booking_id}:${option.room_id}`}
                    >
                      {option.guest_name} — Room {option.room_number} (Booking #
                      {option.booking_id})
                    </option>
                  ))}
                </select>
                {options.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    No eligible checked-in bookings are available.
                  </p>
                )}
              </div>

              {selectedOption && (
                <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Guest</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedOption.guest_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Room</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedOption.room_number}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="service"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Service *
                </label>
                <select
                  id="service"
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option
                      key={service.service_id}
                      value={service.service_id}
                    >
                      {service.service_name} — {money(service.current_price)}
                    </option>
                  ))}
                </select>
                {selectedService?.service_description && (
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedService.service_description}
                  </p>
                )}
                {services.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    No services are currently available in the catalogue.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Quantity *
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="instructions"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Special instructions
                </label>
                <textarea
                  id="instructions"
                  rows={3}
                  maxLength={500}
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Optional notes for the service team"
                  className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {instructions.length}/500
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm text-blue-800">Estimated total</p>
                <p className="mt-1 text-2xl font-bold text-blue-950">
                  {money(total)}
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Based on the current catalogue price and selected quantity.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link
                  to="/frontdesk/service-requests"
                  className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    options.length === 0 ||
                    services.length === 0
                  }
                  className="rounded-lg bg-blue-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}