import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import {
  reportApi,
  type RevenueRecord,
  type OccupancyRecord,
  type BillingRecord,
  type TopServiceRecord,
} from '../../api/reportApi';

function formatLKR(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return `LKR ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type IconName = 'chart' | 'door' | 'users' | 'settings' | 'refresh' | 'arrow' | 'money' | 'bed';

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    chart: <path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4" />,
    door: <path d="M4 21h16M7 21V3h10v18M13 12h1" />,
    users: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5.65" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    refresh: (
      <>
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
      </>
    ),
    arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
    money: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    bed: (
      <>
        <path d="M3 18V8m18 10v-7a3 3 0 0 0-3-3h-7v6M3 14h18M3 18v3m18-3v3" />
        <rect x="3" y="8" width="8" height="6" rx="1" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueRecord[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyRecord[]>([]);
  const [billingData, setBillingData] = useState<BillingRecord[]>([]);
  const [topServicesData, setTopServicesData] = useState<TopServiceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const from = '2026-10-01';
      const to = '2026-10-31';
      const [revRes, occRes, billRes, topRes] = await Promise.all([
        reportApi.getRevenueReport({ from, to }),
        reportApi.getOccupancyReport({ from, to }),
        reportApi.getBillingReport(),
        reportApi.getTopServicesReport(),
      ]);

      setRevenueData(revRes.data || []);
      setOccupancyData(occRes.data || []);
      setBillingData(billRes.data || []);
      setTopServicesData(topRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reporting metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Compute live KPIs
  const totalRevenue = revenueData.reduce((acc, r) => {
    return acc + Number(r.room_and_tax_revenue || 0) + Number(r.service_revenue || 0);
  }, 0);

  const totalRooms = occupancyData.length;
  const occupiedRooms = occupancyData.filter(
    (o) => o.booking_status === 'Booked' || o.booking_status === 'Checked-In',
  ).length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const totalOutstanding = billingData.reduce((acc, b) => {
    const bal = Number(b.calculated_outstanding_amount || 0);
    return bal > 0 ? acc + bal : acc;
  }, 0);

  const topService = topServicesData[0];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 pb-6 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
            SkyNest Hotels · Executive Administration
          </span>
          <h1 className="mt-1 text-3xl font-serif font-medium text-gray-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Hotel group oversight, financial performance, and system administration.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Signed in as {user?.email}
          </span>
          <button
            onClick={() => void loadData()}
            title="Refresh metrics"
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Icon name="refresh" size={16} />
          </button>
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#224846] hover:bg-[#193634] text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Icon name="chart" size={17} />
            View Reports Suite
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          <span>Failed to load live reporting data: {error}</span>
          <button
            onClick={() => void loadData()}
            className="font-medium underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Live Executive KPI Cards */}
      <section className="mt-6" aria-label="Executive KPIs">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue KPI */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Portfolio Revenue
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 border border-emerald-100">
                <Icon name="money" size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-gray-900">
                {isLoading ? (
                  <span className="inline-block h-7 w-32 animate-pulse bg-gray-200 rounded" />
                ) : (
                  formatLKR(totalRevenue)
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Across {revenueData.length || 3} operating branches
              </p>
            </div>
          </div>

          {/* Occupancy KPI */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Live Occupancy
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-700 border border-blue-100">
                <Icon name="bed" size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-gray-900">
                {isLoading ? (
                  <span className="inline-block h-7 w-20 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `${occupancyRate}%`
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {occupiedRooms} of {totalRooms} rooms booked/occupied
              </p>
            </div>
          </div>

          {/* Outstanding Receivables */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Outstanding Balance
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-700 border border-amber-100">
                <Icon name="money" size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-gray-900">
                {isLoading ? (
                  <span className="inline-block h-7 w-28 animate-pulse bg-gray-200 rounded" />
                ) : (
                  formatLKR(totalOutstanding)
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">Pending guest billing settlements</p>
            </div>
          </div>

          {/* Top Service */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Leading Service
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-700 border border-purple-100">
                <Icon name="chart" size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-semibold text-gray-900 truncate">
                {isLoading ? (
                  <span className="inline-block h-7 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  topService?.service_name || 'Room Service'
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {topService ? formatLKR(topService.total_revenue) : 'Top grossing catalog service'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Administrative Modules Grid */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Management & Operations Portals</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Reports & Analytics Card */}
          <Link
            to="/admin/reports"
            className="group relative flex flex-col justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#224846] transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-[#224846] flex items-center justify-center">
                  <Icon name="chart" size={22} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Full Suite
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 text-lg group-hover:text-[#224846] transition-colors">
                Reports & Analytics
              </h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                Occupancy audits, branch revenue breakdown, guest billing balances, and top service
                usage analytics.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-[#224846]">
              Launch reports <Icon name="arrow" size={15} />
            </div>
          </Link>

          {/* Front Desk Operations Card */}
          <Link
            to="/frontdesk/dashboard"
            className="group relative flex flex-col justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-400 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Icon name="door" size={22} />
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Operations
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
                Hotel Operations
              </h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                Front desk workstation, reservation calendar, guest check-in/out, and payment
                collection.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-gray-700">
              Open front desk <Icon name="arrow" size={15} />
            </div>
          </Link>

          {/* User Management Card */}
          <Link
            to="/admin/users"
            className="group relative flex flex-col justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-400 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Icon name="users" size={22} />
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Security
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
                User Management
              </h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                Manage staff credentials, invite team members, configure RBAC permissions and
                passwords.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-gray-700">
              Manage accounts <Icon name="arrow" size={15} />
            </div>
          </Link>

          {/* System Settings Card */}
          <Link
            to="/admin/settings"
            className="group relative flex flex-col justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-400 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Icon name="settings" size={22} />
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Config
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
                System Settings
              </h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                Branch profiles, room inventory parameters, tax structures, and system policies.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-gray-700">
              Configure system <Icon name="arrow" size={15} />
            </div>
          </Link>
        </div>
      </section>

      {/* Branch Performance Snapshot Table */}
      <section className="mt-8">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Branch Revenue Performance</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Consolidated room, tax, and guest service revenue across operating branches
              </p>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs font-semibold text-[#224846] hover:underline flex items-center gap-1"
            >
              Open Full Revenue Audit <Icon name="arrow" size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Branch Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Room & Tax Revenue
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Service Revenue
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Total Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Loading branch records...
                    </td>
                  </tr>
                ) : revenueData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No revenue records available for this period.
                    </td>
                  </tr>
                ) : (
                  revenueData.map((branch) => {
                    const branchTotal =
                      Number(branch.room_and_tax_revenue || 0) + Number(branch.service_revenue || 0);
                    return (
                      <tr key={branch.branch_name} className="hover:bg-gray-50/80">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {branch.branch_name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatLKR(branch.room_and_tax_revenue)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatLKR(branch.service_revenue)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatLKR(branchTotal)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to="/admin/reports"
                            className="inline-flex items-center text-xs font-medium text-emerald-700 hover:text-emerald-800"
                          >
                            Details &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
