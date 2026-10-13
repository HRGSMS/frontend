import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import { useAuth } from '../../context/auth-state';
import { canAccessPath, homeForRole } from '../../lib/auth-policy';

interface ServiceRequest {
  public_id: string;
  booking_public_id: string;
  room_public_id: string;
  service_public_id: string;
  service_name: string;
  guest_name: string;
  room_number: string;
  usage_time: string;
  quantity: number;
  price_at_usage: number | string;
  status: 'Pending' | 'Completed';
}

interface ApiResponse {
  data: ServiceRequest[];
}

const currency = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
});

export default function ServiceRequestsQueuePage() {
  const { user } = useAuth();
  const dashboard = homeForRole(user?.role);
  const canCreate = canAccessPath(user?.role, '/frontdesk/service-requests/new');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [completingId, setCompletingId] = useState<string | null>(null);

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

  const markCompleted = async (publicId: string) => {
    setCompletingId(publicId);
    setError('');

    try {
      await serviceApi.completeService(publicId);
      await loadRequests();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? String(
              (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
                'Unable to complete this request.',
            )
          : 'Unable to complete this request.';

      setError(message);
    } finally {
      setCompletingId(null);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'All' || request.status === statusFilter;

      const matchesSearch =
        !query ||
        [
          request.public_id,
          request.booking_public_id,
          request.room_number,
          request.guest_name,
          request.service_public_id,
          request.service_name,
          request.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  const totalValue = requests.reduce(
    (sum, request) => sum + Number(request.price_at_usage) * Number(request.quantity),
    0,
  );

  const totalQuantity = requests.reduce((sum, request) => sum + Number(request.quantity), 0);

  const pendingCount = requests.filter((request) => request.status === 'Pending').length;

  const completedCount = requests.filter((request) => request.status === 'Completed').length;

  return (
    <main className="sn-workspace-page min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 text-sm text-slate-500">
          <Link to={dashboard} className="hover:text-slate-900">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Guest Services</span>
        </nav>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to={dashboard}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </Link>

            <p className="sr-eyebrow mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
              SKY NEST HOTELS · OPERATIONS
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Service Requests</h1>

            <p className="mt-2 text-sm text-slate-600">
              View, search, and manage guest service requests recorded by the hotel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canCreate && (
              <>
                <Link
                  to="/frontdesk/service-catalogue"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Service Catalogue
                </Link>

                <Link
                  to="/frontdesk/service-requests/new"
                  className="rounded-lg bg-blue-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
                >
                  + New Service Request
                </Link>
              </>
            )}

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

        <section
          className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Service request summary"
        >
          <article className="sn-workspace-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total requests</p>
            <p className="sr-metric-value mt-2 text-3xl font-bold text-slate-900">{requests.length}</p>
          </article>

          <article className="sn-workspace-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending requests</p>
            <p className="sr-metric-value mt-2 text-3xl font-bold text-amber-700">{pendingCount}</p>
          </article>

          <article className="sn-workspace-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Completed requests</p>
            <p className="sr-metric-value mt-2 text-3xl font-bold text-emerald-700">{completedCount}</p>
            <p className="mt-1 text-xs text-slate-500">{totalQuantity} total units requested</p>
          </article>

          <article className="sn-workspace-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Recorded value</p>
            <p className="sr-metric-value mt-2 break-words text-2xl font-bold text-slate-900">
              {currency.format(totalValue)}
            </p>
          </article>
        </section>

        <section className="sn-workspace-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(16rem,22rem)] md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Request queue</h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredRequests.length} of {requests.length} requests
              </p>
            </div>

            <label className="w-full md:w-40">
              <span className="sr-only">Filter requests by status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'All' | 'Pending' | 'Completed')
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </label>

            <label className="w-full">
              <span className="sr-only">
                Search requests by service, booking, room or request number
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search service, guest, booking or room…"
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
            <div className="p-12 text-center text-sm text-slate-500">Loading service requests…</div>
          ) : !error && filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="font-semibold text-slate-900">
                {search || statusFilter !== 'All'
                  ? 'No matching requests'
                  : 'No service requests yet'}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {search || statusFilter !== 'All'
                  ? 'Try changing your search or status filter.'
                  : 'Requests recorded by the hotel will appear here.'}
              </p>
              {(search || statusFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('All');
                  }}
                  className="mt-4 text-sm font-semibold text-blue-800 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Request</th>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Booking / Room</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Unit price</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Requested at</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((request) => (
                    <tr key={request.public_id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        #{request.public_id.slice(0, 8)}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{request.service_name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Service #{request.service_public_id.slice(0, 8)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        <p>Booking #{request.booking_public_id.slice(0, 8)}</p>
                        <p className="mt-1 text-xs text-slate-500">Room {request.room_number}</p>
                        <p className="mt-1 text-xs text-slate-500">{request.guest_name}</p>
                      </td>

                      <td className="px-5 py-4 text-slate-700">{request.quantity}</td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {currency.format(Number(request.price_at_usage))}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {currency.format(Number(request.price_at_usage) * Number(request.quantity))}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            request.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {new Date(request.usage_time).toLocaleString('en-LK', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Colombo',
                        })}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {request.status === 'Completed' ? (
                          <span className="text-sm text-emerald-700">Done</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void markCompleted(request.public_id)}
                            disabled={completingId !== null}
                            className="rounded-md bg-blue-950 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {completingId === request.public_id ? 'Saving…' : 'Mark completed'}
                          </button>
                        )}
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
}
