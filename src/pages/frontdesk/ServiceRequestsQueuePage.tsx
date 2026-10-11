import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';

interface ServiceRequest {
  usage_id: number;
  booking_id: number;
  room_id: number;
  service_id: number;
  service_name: string;
  usage_time: string;
  quantity: number;
  price_at_usage: number | string;
}

interface ApiResponse {
  data: ServiceRequest[];
}

const currency = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
});

const ServiceRequestsQueuePage = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = (await serviceApi.listServiceUsage({})) as ApiResponse;

      if (!response || !Array.isArray(response.data)) {
        throw new Error('The server returned an unexpected response.');
      }

      setRequests(response.data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? String(
              (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
                'Unable to load service requests. Check that the backend is running.',
            )
          : 'Unable to load service requests. Check that the backend is running.';

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((request) =>
      [
        request.usage_id,
        request.booking_id,
        request.room_id,
        request.service_id,
        request.service_name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [requests, search]);

  const totalValue = requests.reduce(
    (sum, request) =>
      sum + Number(request.price_at_usage) * Number(request.quantity),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 text-sm text-slate-500">
          <Link
            to="/frontdesk/dashboard"
            className="hover:text-slate-900"
          >
            Front Desk
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Guest Services</span>
        </nav>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
              SKY NEST HOTELS · OPERATIONS
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Service Requests
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              View and search guest service requests recorded by the hotel.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/frontdesk/service-requests/new"
              className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
            >
              + New Request
            </Link>

            <button
              type="button"
              onClick={() => void loadRequests()}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total requests</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {requests.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              All recorded service usage
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Units requested</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {requests.reduce(
                (sum, request) => sum + Number(request.quantity),
                0,
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Combined requested quantities
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Recorded value</p>
            <p className="mt-2 break-words text-2xl font-bold text-slate-900">
              {currency.format(totalValue)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Quantity × recorded unit price
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Request queue
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredRequests.length} of {requests.length} requests
              </p>
            </div>

            <label className="w-full sm:max-w-sm">
              <span className="sr-only">
                Search requests by service, booking, room or request number
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search service, booking or room…"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <p className="font-semibold">Could not load requests</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadRequests()}
                className="mt-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading && requests.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading service requests…
            </div>
          ) : !error && filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="font-semibold text-slate-900">
                {search ? 'No matching requests' : 'No service requests yet'}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {search
                  ? 'Try a different search term.'
                  : 'Requests recorded by the hotel will appear here.'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-4 text-sm font-semibold text-blue-800 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Request</th>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Booking / Room</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Unit price</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Requested at</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.usage_id}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        #{request.usage_id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {request.service_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Service #{request.service_id}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        <p>Booking #{request.booking_id}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Room #{request.room_id}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {request.quantity}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {currency.format(Number(request.price_at_usage))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {currency.format(
                          Number(request.price_at_usage) *
                            Number(request.quantity),
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {new Date(request.usage_time).toLocaleString('en-LK', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Colombo',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
            {lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString('en-LK', {
                  timeZone: 'Asia/Colombo',
                  hour: '2-digit',
                  minute: '2-digit',
                })} · Sri Lanka time`
              : 'Waiting for the first successful load.'}
          </footer>
        </section>
      </div>
    </main>
  );
};

export default ServiceRequestsQueuePage;