import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';

interface Service {
  service_id: number;
  service_name: string;
  service_description: string | null;
  current_price: number | string;
  price_update_time?: string;
}

interface ApiResponse {
  data: Service[];
}

const formatPrice = (value: number | string) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(Number(value));

export default function ServiceCataloguePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  //const [notice, setNotice] = useState('');

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = (await serviceApi.getServiceCatalogue({})) as ApiResponse;

      if (!response || !Array.isArray(response.data)) {
        throw new Error('The server returned an unexpected catalogue response.');
      }

      setServices(response.data);
    } catch (err: unknown) {
      const responseError =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;

      setError(
        responseError ||
          (err instanceof Error
            ? err.message
            : 'Unable to load the service catalogue.'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return services;

    return services.filter((service) =>
      `${service.service_name} ${service.service_description ?? ''} ${service.service_id}`
        .toLowerCase()
        .includes(query),
    );
  }, [services, search]);

  const totalServices = services.length;

  return (
    <main className="sn-workspace-page min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 text-sm text-slate-500">
          <Link to="/frontdesk/dashboard" className="hover:text-slate-900">
            Front Desk
          </Link>
          <span className="mx-2">/</span>
          <Link to="/frontdesk/service-requests" className="hover:text-slate-900">
            Guest Services
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Service Catalogue</span>
        </nav>


      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/frontdesk/service-requests"
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <span aria-hidden="true">←</span>
            Back to Guest Services
          </Link>

          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
            SKY NEST HOTELS · GUEST SERVICES
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Service Catalogue
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Review the services offered to hotel guests and their current prices.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/frontdesk/service-requests"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Request Queue
          </Link>

          <Link
            to="/frontdesk/service-requests/new"
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
          >
            + New Service Request
          </Link>

          <button
            type="button"
            onClick={() => void loadServices()}
            disabled={loading}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh Catalogue'}
          </button>
        </div>
      </header>


        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <article className="sn-workspace-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Catalogue services</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalServices}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Services returned by the backend
            </p>
          </article>

          <article className="sn-workspace-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Search results</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {filteredServices.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Matching the current search
            </p>
          </article>
        </section>

        <section className="sn-workspace-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Available services
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Catalogue information is loaded directly from the backend.
              </p>
            </div>

            <label className="w-full sm:max-w-sm">
              <span className="sr-only">Search catalogue</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or description…"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <p className="font-semibold">Unable to load the catalogue</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadServices()}
                className="mt-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading && services.length === 0 ? (
            <p role="status" className="p-12 text-center text-sm text-slate-500">
              Loading service catalogue…
            </p>
          ) : !error && filteredServices.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="font-semibold text-slate-900">
                {search ? 'No matching services' : 'No services available'}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {search
                  ? 'Try another search term.'
                  : 'The backend returned an empty service catalogue.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => (
                <article
                  key={service.service_id}
                  className="flex flex-col rounded-xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                      Service #{service.service_id}
                    </span>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
                      Available
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900">
                    {service.service_name}
                  </h3>

                  <p className="mt-2 min-h-12 flex-1 text-sm leading-6 text-slate-600">
                    {service.service_description?.trim() ||
                      'No description provided.'}
                  </p>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Current price
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatPrice(service.current_price)}
                    </p>
                  </div>

                  {service.price_update_time && (
                    <p className="mt-3 text-xs text-slate-500">
                      Price updated:{' '}
                      {new Date(service.price_update_time).toLocaleDateString(
                        'en-LK',
                        { timeZone: 'Asia/Colombo' },
                      )}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Price editing is not enabled on this page yet. Prices displayed here
          are read directly from the database.
        </p>
      </div>
    </main>
  );
}