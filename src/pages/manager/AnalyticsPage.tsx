import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  reportApi,
  type RevenueRecord,
  type OccupancyRecord,
  type ServiceUsageRecord,
} from '../../api/reportApi';
import { ManagementPage, Metric, Notice } from '../../components/ManagementUI';
import { requestError } from '../../lib/request-error';
import { roomCoverage, serviceTotals, exclusiveEnd, localDate } from '../../lib/analytics';
const money = (value: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(value);
const today = () => localDate(new Date());
export default function AnalyticsPage() {
  const [from, setFrom] = useState(() => `${today().slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [range, setRange] = useState(() => ({ from: `${today().slice(0, 7)}-01`, to: today() }));
  const [data, setData] = useState<{
    revenue: RevenueRecord[];
    rooms: OccupancyRecord[];
    services: ServiceUsageRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const params = { from: range.from, to: exclusiveEnd(range.to) };
    void Promise.all([
      reportApi.getRevenueReport(params),
      reportApi.getOccupancyReport(params),
      reportApi.getServiceUsageReport(params),
    ])
      .then(([revenue, rooms, services]) => {
        if (active) {
          setData({ revenue: revenue.data, rooms: rooms.data, services: services.data });
          setError('');
        }
      })
      .catch((e) => {
        if (active) {
          setError(requestError(e));
          setData(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, refresh]);
  function apply(e: FormEvent) {
    e.preventDefault();
    if (from > to) {
      setError('Start date must be on or before the end date.');
      return;
    }
    setLoading(true);
    setError('');
    setRange({ from, to });
  }
  const branches = (data?.revenue || [])
    .map((row) => ({
      name: row.branch_name,
      rooms: Number(row.room_and_tax_revenue) || 0,
      services: Number(row.service_revenue) || 0,
    }))
    .sort((a, b) => b.rooms + b.services - (a.rooms + a.services));
  const revenue = branches.reduce((sum, row) => sum + row.rooms + row.services, 0);
  const coverage = roomCoverage(data?.rooms || []);
  const services = serviceTotals(data?.services || []);
  const serviceRevenue = services.reduce((sum, row) => sum + row.amount, 0);
  return (
    <ManagementPage
      title="Performance Analytics"
      description="Compare branch revenue, booking coverage, and service demand for a selected period."
    >
      <Notice error={error} />
      <section className="management-card">
        <form className="management-form" onSubmit={apply}>
          <label>
            From
            <input
              type="date"
              required
              max={to}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Through (inclusive)
            <input
              type="date"
              required
              min={from}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <div className="management-actions">
            <button disabled={loading}>Apply dates</button>
            <button
              type="button"
              className="secondary"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                setError('');
                setRefresh((n) => n + 1);
              }}
            >
              Refresh
            </button>
            <Link to="/manager/reports">Detailed reports & export</Link>
          </div>
        </form>
      </section>
      {loading ? (
        <p role="status">Loading analytics…</p>
      ) : (
        data && (
          <>
            <p className="management-muted">
              Showing {range.from} through {range.to}. Revenue covers bookings overlapping this
              interval; service usage covers requests recorded within it.
            </p>
            <div className="management-grid">
              <Metric label="Revenue for overlapping bookings" value={money(revenue)} />
              <Metric
                label="Rooms booked during interval"
                value={`${coverage.booked} / ${coverage.total}`}
              />
              <Metric label="Service usage amount in interval" value={money(serviceRevenue)} />
              <Metric
                label="Service units requested"
                value={services.reduce((sum, row) => sum + row.quantity, 0)}
              />
            </div>
            <section className="management-card">
              <h2>Branch revenue contribution</h2>
              <div className="management-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Room revenue + tax</th>
                      <th>Service revenue</th>
                      <th>Total / share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((b) => (
                      <tr key={b.name}>
                        <td>{b.name}</td>
                        <td>{money(b.rooms)}</td>
                        <td>{money(b.services)}</td>
                        <td>
                          {money(b.rooms + b.services)} ·{' '}
                          {revenue ? Math.round(((b.rooms + b.services) / revenue) * 100) : 0}%
                          <progress
                            aria-label={`${b.name} share of revenue`}
                            max={Math.max(revenue, 1)}
                            value={Math.max(0, b.rooms + b.services)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!branches.length && <p>No branch revenue in this period.</p>}
              </div>
            </section>
            <section className="management-card">
              <h2>Booking coverage by branch</h2>
              <p className="management-muted">
                Each room is counted once if it has any Booked or Checked-In reservation overlapping
                the interval. This is not a nightly occupancy rate.
              </p>
              {[...new Set(data.rooms.map((r) => r.branch_name))].map((branch) => {
                const c = roomCoverage(data.rooms.filter((r) => r.branch_name === branch));
                return (
                  <div key={branch} className="management-note">
                    <strong>{branch}</strong>
                    <p>
                      {c.booked} of {c.total} rooms ·{' '}
                      {c.total ? Math.round((c.booked / c.total) * 100) : 0}%
                    </p>
                    <progress
                      aria-label={`${branch} rooms booked during interval`}
                      value={c.booked}
                      max={Math.max(c.total, 1)}
                    />
                  </div>
                );
              })}
              {!data.rooms.length && <p>No rooms returned for this period.</p>}
            </section>
            <section className="management-card">
              <h2>Service demand and revenue</h2>
              <div className="management-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Units</th>
                      <th>Usage amount</th>
                      <th>Revenue share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td>{s.quantity}</td>
                        <td>{money(s.amount)}</td>
                        <td>
                          <progress
                            aria-label={`${s.name} share of service revenue`}
                            max={Math.max(serviceRevenue, 1)}
                            value={Math.max(s.amount, 0)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!services.length && <p>No service usage in this period.</p>}
              </div>
            </section>
          </>
        )
      )}
    </ManagementPage>
  );
}
