import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import {
  reportApi,
  type OccupancyRecord,
  type BillingRecord,
  type ServiceUsageRecord,
  type RevenueRecord,
  type TopServiceRecord,
} from '../../api/reportApi';
import '../frontdesk/FrontDeskDashboard.css';
import './ReportsPage.css';

type ReportTab = 'occupancy' | 'billing' | 'service-usage' | 'revenue' | 'top-services';

type IconName =
  | 'calendar'
  | 'door'
  | 'bed'
  | 'chart'
  | 'plus'
  | 'arrow'
  | 'arrowUp'
  | 'search'
  | 'clock'
  | 'bell'
  | 'shield'
  | 'users'
  | 'download'
  | 'refresh'
  | 'dollar';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2M8 18h2" />
      </>
    ),
    door: <path d="M4 21h16M7 21V3h10v18M13 12h1" />,
    bed: (
      <>
        <path d="M3 18V8m18 10v-7a3 3 0 0 0-3-3h-7v6M3 14h18M3 18v3m18-3v3" />
        <rect x="3" y="8" width="8" height="6" rx="1" />
      </>
    ),
    chart: <path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    arrowUp: <path d="M6 18 18 6M6 6h12v12" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5.65" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </>
    ),
    refresh: (
      <>
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
      </>
    ),
    dollar: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

function formatLKR(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return `LKR ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function ReportsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ReportTab>('occupancy');

  // Dates matching sample data in backend
  const [from, setFrom] = useState('2026-10-01');
  const [to, setTo] = useState('2026-10-31');

  // Query and table search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Datasets
  const [occupancyData, setOccupancyData] = useState<OccupancyRecord[]>([]);
  const [billingData, setBillingData] = useState<BillingRecord[]>([]);
  const [serviceUsageData, setServiceUsageData] = useState<ServiceUsageRecord[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueRecord[]>([]);
  const [topServicesData, setTopServicesData] = useState<TopServiceRecord[]>([]);

  const [activeDateRange, setActiveDateRange] = useState({ from: '2026-10-01', to: '2026-10-31' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadReports() {
      setIsLoading(true);
      setError(null);
      try {
        const [occRes, billRes, sUsageRes, revRes, topRes] = await Promise.all([
          reportApi.getOccupancyReport({ from: activeDateRange.from, to: activeDateRange.to }),
          reportApi.getBillingReport(),
          reportApi.getServiceUsageReport({ from: activeDateRange.from, to: activeDateRange.to }),
          reportApi.getRevenueReport({ from: activeDateRange.from, to: activeDateRange.to }),
          reportApi.getTopServicesReport(),
        ]);

        if (!ignore) {
          setOccupancyData(occRes.data || []);
          setBillingData(billRes.data || []);
          setServiceUsageData(sUsageRes.data || []);
          setRevenueData(revRes.data || []);
          setTopServicesData(topRes.data || []);
        }
      } catch (err) {
        if (!ignore) {
          const msg =
            err instanceof Error ? err.message : 'Failed to load report data from server.';
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadReports();
    return () => {
      ignore = true;
    };
  }, [activeDateRange]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveDateRange({ from, to });
  };

  const handlePreset = (presetFrom: string, presetTo: string) => {
    setFrom(presetFrom);
    setTo(presetTo);
    setActiveDateRange({ from: presetFrom, to: presetTo });
  };

  const handleRefresh = () => {
    setActiveDateRange({ from, to });
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    // Total Revenue (Room & Tax + Service Revenue)
    const totalRev = revenueData.reduce((acc, r) => {
      return acc + Number(r.room_and_tax_revenue || 0) + Number(r.service_revenue || 0);
    }, 0);

    // Occupancy Rate
    const totalRoomsCount = occupancyData.length;
    const occupiedCount = occupancyData.filter(
      (o) => o.booking_status === 'Booked' || o.booking_status === 'Checked-In',
    ).length;
    const occRate = totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0;

    // Total Outstanding Balance
    const totalOutstanding = billingData.reduce((acc, b) => {
      const bal = Number(b.calculated_outstanding_amount || 0);
      return bal > 0 ? acc + bal : acc;
    }, 0);

    // Top Service
    const topService = topServicesData[0];

    return {
      totalRev,
      totalRoomsCount,
      occupiedCount,
      occRate,
      totalOutstanding,
      topServiceName: topService ? topService.service_name : '—',
      topServiceRev: topService ? Number(topService.total_revenue || 0) : 0,
    };
  }, [revenueData, occupancyData, billingData, topServicesData]);

  // Filtered lists for each tab
  const filteredOccupancy = useMemo(() => {
    return occupancyData.filter((item) => {
      const matchesSearch =
        search === '' ||
        `${item.room_number} ${item.branch_name} ${item.type_name} ${item.booking_status || 'Vacant'}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const isOccupied = item.booking_status === 'Booked' || item.booking_status === 'Checked-In';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'occupied' && isOccupied) ||
        (statusFilter === 'vacant' && !isOccupied) ||
        item.booking_status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [occupancyData, search, statusFilter]);

  const filteredBilling = useMemo(() => {
    return billingData.filter((item) => {
      const matchesSearch =
        search === '' ||
        `${item.guest_name} ${item.booking_status} ${item.payment_status}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const outstanding = Number(item.calculated_outstanding_amount || 0);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'due' && outstanding > 0) ||
        (statusFilter === 'cleared' && outstanding <= 0) ||
        item.payment_status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [billingData, search, statusFilter]);

  const filteredServiceUsage = useMemo(() => {
    return serviceUsageData.filter((item) => {
      return (
        search === '' ||
        `${item.room_number} ${item.service_name}`.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [serviceUsageData, search]);

  const filteredRevenue = useMemo(() => {
    return revenueData.filter((item) => {
      return search === '' || item.branch_name.toLowerCase().includes(search.toLowerCase());
    });
  }, [revenueData, search]);

  const filteredTopServices = useMemo(() => {
    return topServicesData.filter((item) => {
      return search === '' || item.service_name.toLowerCase().includes(search.toLowerCase());
    });
  }, [topServicesData, search]);

  // Export CSV handler
  const handleExportCsv = () => {
    let csvContent = '';
    let fileName = `skynest_${activeTab}_report_${from}_to_${to}.csv`;

    if (activeTab === 'occupancy') {
      csvContent = 'Room Number,Branch,Room Type,Status,Check In Time,Check Out Time\n';
      filteredOccupancy.forEach((r) => {
        csvContent += `"${r.room_number}","${r.branch_name}","${r.type_name}","${r.booking_status || 'Vacant'}","${r.check_in_time || ''}","${r.check_out_time || ''}"\n`;
      });
    } else if (activeTab === 'billing') {
      csvContent =
        'Guest Name,Booking Status,Payment Status,Total Charge,Paid Amount,Outstanding Balance\n';
      filteredBilling.forEach((r) => {
        csvContent += `"${r.guest_name}","${r.booking_status}","${r.payment_status}",${r.total_charge},${r.paid_amount},${r.calculated_outstanding_amount}\n`;
      });
    } else if (activeTab === 'service-usage') {
      csvContent = 'Room Number,Service Name,Total Quantity,Total Amount\n';
      filteredServiceUsage.forEach((r) => {
        csvContent += `"${r.room_number}","${r.service_name}",${r.total_quantity},${r.total_amount}\n`;
      });
    } else if (activeTab === 'revenue') {
      csvContent = 'Branch,Room and Tax Revenue,Service Revenue,Total Revenue\n';
      filteredRevenue.forEach((r) => {
        const total = Number(r.room_and_tax_revenue || 0) + Number(r.service_revenue || 0);
        csvContent += `"${r.branch_name}",${r.room_and_tax_revenue},${r.service_revenue},${total}\n`;
      });
    } else if (activeTab === 'top-services') {
      csvContent = 'Service Name,Total Quantity Ordered,Unique Bookings Count,Total Revenue\n';
      filteredTopServices.forEach((r) => {
        csvContent += `"${r.service_name}",${r.total_quantity},${r.booking_count},${r.total_revenue}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (user?.role === 'front_desk') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <main className="fd-dashboard">
      {/* Workspace Sidebar Navigation */}
      <aside className="fd-sidebar" aria-label="Management reports workspace">
        <Link
          to={user?.role === 'admin' ? '/admin/dashboard' : '/manager/dashboard'}
          className="fd-brand"
        >
          <span className="fd-brand-mark">
            <Icon name="chart" size={20} />
          </span>
          <span>
            SkyNest Hotels
            <small>{user?.role === 'admin' ? 'ADMINISTRATION REPORTS' : 'MANAGEMENT REPORTS'}</small>
          </span>
        </Link>
        <nav className="fd-workspace-nav" aria-label="Reports navigation">
          <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/manager/dashboard'}>
            <Icon name="arrow" size={17} />
            {user?.role === 'admin' ? 'Admin dashboard' : 'Manager dashboard'}
          </Link>
          <span className="is-current" aria-current="page">
            <Icon name="chart" size={17} />
            Analytics & reports
          </span>
        </nav>
        <div className="fd-sidebar-bottom">
          <Link
            to={user?.role === 'admin' ? '/admin/dashboard' : '/manager/dashboard'}
            className="fd-button"
          >
            <Icon name="arrow" size={16} />
            Return to dashboard
          </Link>
          <Link to="/account" className="fd-sidebar-account">
            <Icon name="shield" size={16} />
            Account security
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="fd-content rp-container">
        {/* Header */}
        <header className="rp-header">
          <p className="rp-eyebrow">HRGMS · OPERATIONAL & FINANCIAL REPORTING</p>
          <div className="rp-title-row">
            <div>
              <h1>Hospitality Reports & Analytics</h1>
              <p className="rp-subtitle">
                Real-time insights compiled from database views: occupancy, guest billing, service
                consumption and branch revenues.
              </p>
            </div>
            <div className="rp-actions-row">
              <button
                type="button"
                onClick={handleExportCsv}
                className="rp-export-btn"
                title="Download active report as CSV"
              >
                <Icon name="download" size={16} />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                className="rp-filter-btn"
                title="Refresh current report data"
              >
                <Icon name="refresh" size={16} />
                {isLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rp-error-banner" role="alert">
            <span>
              <strong>Error loading reports:</strong> {error}
            </span>
            <button type="button" className="rp-retry-btn" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        )}

        {/* Date Filter Bar */}
        <section className="rp-filter-bar" aria-label="Date Interval Controls">
          <form className="rp-date-controls" onSubmit={handleApplyFilter}>
            <div className="rp-date-input-group">
              <label htmlFor="rp-date-from">From:</label>
              <input
                id="rp-date-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
              />
            </div>
            <div className="rp-date-input-group">
              <label htmlFor="rp-date-to">To:</label>
              <input
                id="rp-date-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="rp-filter-btn" disabled={isLoading}>
              Apply Interval
            </button>
          </form>

          <div className="rp-preset-buttons">
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--rp-muted)' }}>
              Presets:
            </span>
            <button
              type="button"
              className={`rp-preset-btn ${from === '2026-10-01' && to === '2026-10-31' ? 'active' : ''}`}
              onClick={() => handlePreset('2026-10-01', '2026-10-31')}
            >
              October 2026
            </button>
            <button
              type="button"
              className={`rp-preset-btn ${from === '2026-09-01' && to === '2026-09-30' ? 'active' : ''}`}
              onClick={() => handlePreset('2026-09-01', '2026-09-30')}
            >
              September 2026
            </button>
            <button
              type="button"
              className={`rp-preset-btn ${from === '2026-01-01' && to === '2026-12-31' ? 'active' : ''}`}
              onClick={() => handlePreset('2026-01-01', '2026-12-31')}
            >
              Full Year 2026
            </button>
          </div>
        </section>

        {/* Executive KPI Metrics */}
        <section className="rp-metrics-grid" aria-label="Executive KPI Summaries">
          <div className="rp-metric-card rp-featured">
            <div className="rp-metric-top">
              <span className="rp-metric-label">Total Revenue</span>
              <div className="rp-metric-icon">
                <Icon name="dollar" size={18} />
              </div>
            </div>
            <p className="rp-metric-value">{formatLKR(kpis.totalRev)}</p>
            <p className="rp-metric-sub">Across all hotel branches in range</p>
          </div>

          <div className="rp-metric-card">
            <div className="rp-metric-top">
              <span className="rp-metric-label">Room Occupancy</span>
              <div className="rp-metric-icon">
                <Icon name="bed" size={18} />
              </div>
            </div>
            <p className="rp-metric-value">{kpis.occRate}%</p>
            <p className="rp-metric-sub">
              {kpis.occupiedCount} of {kpis.totalRoomsCount} rooms occupied
            </p>
          </div>

          <div className="rp-metric-card">
            <div className="rp-metric-top">
              <span className="rp-metric-label">Outstanding Balance</span>
              <div className="rp-metric-icon">
                <Icon name="door" size={18} />
              </div>
            </div>
            <p
              className="rp-metric-value"
              style={{ color: kpis.totalOutstanding > 0 ? '#b91c1c' : '#137333' }}
            >
              {formatLKR(kpis.totalOutstanding)}
            </p>
            <p className="rp-metric-sub">Unsettled guest booking charges</p>
          </div>

          <div className="rp-metric-card">
            <div className="rp-metric-top">
              <span className="rp-metric-label">Top Service</span>
              <div className="rp-metric-icon">
                <Icon name="bell" size={18} />
              </div>
            </div>
            <p className="rp-metric-value" style={{ fontSize: '20px' }}>
              {kpis.topServiceName}
            </p>
            <p className="rp-metric-sub">{formatLKR(kpis.topServiceRev)} generated</p>
          </div>
        </section>

        {/* Report Sub-tabs */}
        <nav className="rp-tabs-nav" aria-label="Report Selection">
          <button
            type="button"
            className={`rp-tab-button ${activeTab === 'occupancy' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('occupancy');
              setSearch('');
              setStatusFilter('all');
            }}
          >
            <Icon name="bed" size={16} />
            Room Occupancy
            <span className="rp-tab-count">{occupancyData.length}</span>
          </button>

          <button
            type="button"
            className={`rp-tab-button ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('billing');
              setSearch('');
              setStatusFilter('all');
            }}
          >
            <Icon name="dollar" size={16} />
            Guest Billing & Balances
            <span className="rp-tab-count">{billingData.length}</span>
          </button>

          <button
            type="button"
            className={`rp-tab-button ${activeTab === 'service-usage' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('service-usage');
              setSearch('');
              setStatusFilter('all');
            }}
          >
            <Icon name="bell" size={16} />
            Service Usage
            <span className="rp-tab-count">{serviceUsageData.length}</span>
          </button>

          <button
            type="button"
            className={`rp-tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('revenue');
              setSearch('');
              setStatusFilter('all');
            }}
          >
            <Icon name="chart" size={16} />
            Branch Revenue
            <span className="rp-tab-count">{revenueData.length}</span>
          </button>

          <button
            type="button"
            className={`rp-tab-button ${activeTab === 'top-services' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('top-services');
              setSearch('');
              setStatusFilter('all');
            }}
          >
            <Icon name="users" size={16} />
            Top Services
            <span className="rp-tab-count">{topServicesData.length}</span>
          </button>
        </nav>

        {/* Active Report Table Panel */}
        <section className="rp-panel">
          {/* Header & Filter Controls for the active report */}
          <div className="rp-panel-header">
            <div>
              {activeTab === 'occupancy' && (
                <>
                  <h2>Room Occupancy Report</h2>
                  <p>
                    Status of rooms across branches between {from} and {to}
                  </p>
                </>
              )}
              {activeTab === 'billing' && (
                <>
                  <h2>Guest Billing & Outstanding Balances</h2>
                  <p>Complete record of charges, payments made, and net balance due</p>
                </>
              )}
              {activeTab === 'service-usage' && (
                <>
                  <h2>Guest Service Usage Summary</h2>
                  <p>Consumed hotel amenities & services grouped by room</p>
                </>
              )}
              {activeTab === 'revenue' && (
                <>
                  <h2>Revenue by Property Branch</h2>
                  <p>
                    Breakdown of room and guest service earnings for {from} to {to}
                  </p>
                </>
              )}
              {activeTab === 'top-services' && (
                <>
                  <h2>Top-Performing Hotel Services</h2>
                  <p>Ranked catalogue items by order frequency and revenue</p>
                </>
              )}
            </div>

            <div className="rp-panel-toolbar">
              <label className="rp-search-box">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTab.replace('-', ' ')}…`}
                  aria-label="Filter report rows"
                />
              </label>

              {activeTab === 'occupancy' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rp-select-filter"
                  aria-label="Filter by room status"
                >
                  <option value="all">All Room Statuses</option>
                  <option value="occupied">Occupied (Booked / In)</option>
                  <option value="vacant">Vacant</option>
                  <option value="booked">Booked</option>
                  <option value="checked-in">Checked-In</option>
                </select>
              )}

              {activeTab === 'billing' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rp-select-filter"
                  aria-label="Filter by payment status"
                >
                  <option value="all">All Payments</option>
                  <option value="due">Has Outstanding Balance</option>
                  <option value="cleared">Fully Settled</option>
                  <option value="paid">Paid</option>
                  <option value="partially paid">Partially Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              )}
            </div>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="rp-loading-state">
              <div className="rp-spinner" />
              <span>Querying database report views…</span>
            </div>
          ) : (
            <>
              {/* TAB 1: Occupancy */}
              {activeTab === 'occupancy' && (
                <div className="rp-table-scroll">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th scope="col">Room</th>
                        <th scope="col">Branch</th>
                        <th scope="col">Room Type</th>
                        <th scope="col">Status</th>
                        <th scope="col">Check-in Time</th>
                        <th scope="col">Check-out Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOccupancy.map((row, idx) => {
                        const isVacant = !row.booking_status;
                        const badgeClass = isVacant
                          ? 'rp-badge-vacant'
                          : row.booking_status === 'Checked-In'
                            ? 'rp-badge-checked-in'
                            : 'rp-badge-booked';
                        return (
                          <tr key={`${row.room_number}-${row.branch_name}-${idx}`}>
                            <td>
                              <strong>{row.room_number}</strong>
                            </td>
                            <td>{row.branch_name}</td>
                            <td>{row.type_name}</td>
                            <td>
                              <span className={`rp-badge ${badgeClass}`}>
                                {row.booking_status || 'Vacant'}
                              </span>
                            </td>
                            <td>{formatDate(row.check_in_time)}</td>
                            <td>{formatDate(row.check_out_time)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredOccupancy.length === 0 && (
                    <div className="rp-empty">
                      <Icon name="search" size={28} />
                      <h3>No matching rooms</h3>
                      <p>Try adjusting your search or date interval.</p>
                    </div>
                  )}
                  <div className="rp-table-footer">
                    <span>
                      Showing {filteredOccupancy.length} of {occupancyData.length} rooms
                    </span>
                    <span>
                      Interval: {from} to {to}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: Guest Billing */}
              {activeTab === 'billing' && (
                <div className="rp-table-scroll">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th scope="col">Guest Name</th>
                        <th scope="col">Booking Status</th>
                        <th scope="col">Payment Status</th>
                        <th scope="col" className="rp-num">
                          Total Charge
                        </th>
                        <th scope="col" className="rp-num">
                          Paid Amount
                        </th>
                        <th scope="col" className="rp-num">
                          Outstanding Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBilling.map((row, idx) => {
                        const bal = Number(row.calculated_outstanding_amount || 0);
                        const isPaid = row.payment_status.toLowerCase() === 'paid';
                        const isPartial = row.payment_status.toLowerCase() === 'partially paid';
                        const badgeClass = isPaid
                          ? 'rp-badge-paid'
                          : isPartial
                            ? 'rp-badge-partial'
                            : 'rp-badge-unpaid';

                        return (
                          <tr key={`${row.guest_name}-${idx}`}>
                            <td>
                              <strong>{row.guest_name}</strong>
                            </td>
                            <td>
                              <span className="rp-badge rp-badge-checked-out">
                                {row.booking_status}
                              </span>
                            </td>
                            <td>
                              <span className={`rp-badge ${badgeClass}`}>{row.payment_status}</span>
                            </td>
                            <td className="rp-num">{formatLKR(row.total_charge)}</td>
                            <td className="rp-num">{formatLKR(row.paid_amount)}</td>
                            <td className="rp-num">
                              <span
                                className={`rp-badge ${bal > 0 ? 'rp-badge-due' : 'rp-badge-cleared'}`}
                              >
                                {formatLKR(bal)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredBilling.length === 0 && (
                    <div className="rp-empty">
                      <Icon name="search" size={28} />
                      <h3>No matching billing records</h3>
                      <p>Try adjusting your search criteria.</p>
                    </div>
                  )}
                  <div className="rp-table-footer">
                    <span>
                      Showing {filteredBilling.length} of {billingData.length} records
                    </span>
                    <span>
                      Total Net Outstanding: <strong>{formatLKR(kpis.totalOutstanding)}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: Service Usage */}
              {activeTab === 'service-usage' && (
                <div className="rp-table-scroll">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th scope="col">Room</th>
                        <th scope="col">Service Item</th>
                        <th scope="col" className="rp-num">
                          Quantity Ordered
                        </th>
                        <th scope="col" className="rp-num">
                          Total Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServiceUsage.map((row, idx) => (
                        <tr key={`${row.room_number}-${row.service_name}-${idx}`}>
                          <td>
                            <strong>{row.room_number}</strong>
                          </td>
                          <td>{row.service_name}</td>
                          <td className="rp-num">{row.total_quantity}</td>
                          <td className="rp-num">
                            <strong>{formatLKR(row.total_amount)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredServiceUsage.length === 0 && (
                    <div className="rp-empty">
                      <Icon name="search" size={28} />
                      <h3>No service orders found</h3>
                      <p>No service consumption was recorded in this period.</p>
                    </div>
                  )}
                  <div className="rp-table-footer">
                    <span>
                      Showing {filteredServiceUsage.length} of {serviceUsageData.length} service
                      orders
                    </span>
                    <span>
                      Total Consumed:{' '}
                      <strong>
                        {formatLKR(
                          filteredServiceUsage.reduce(
                            (acc, cur) => acc + Number(cur.total_amount || 0),
                            0,
                          ),
                        )}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 4: Branch Revenue */}
              {activeTab === 'revenue' && (
                <div className="rp-table-scroll">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th scope="col">Branch</th>
                        <th scope="col" className="rp-num">
                          Room & Tax Revenue
                        </th>
                        <th scope="col" className="rp-num">
                          Service Revenue
                        </th>
                        <th scope="col" className="rp-num">
                          Combined Total
                        </th>
                        <th scope="col">Revenue Composition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRevenue.map((row) => {
                        const roomTax = Number(row.room_and_tax_revenue || 0);
                        const service = Number(row.service_revenue || 0);
                        const total = roomTax + service;
                        const roomPct = total > 0 ? Math.round((roomTax / total) * 100) : 0;
                        const servicePct = 100 - roomPct;

                        return (
                          <tr key={row.branch_name}>
                            <td>
                              <strong>{row.branch_name}</strong>
                            </td>
                            <td className="rp-num">{formatLKR(roomTax)}</td>
                            <td className="rp-num">{formatLKR(service)}</td>
                            <td className="rp-num">
                              <strong style={{ color: '#00152f' }}>{formatLKR(total)}</strong>
                            </td>
                            <td>
                              <div
                                className="rp-rev-bar"
                                title={`Rooms: ${roomPct}%, Services: ${servicePct}%`}
                              >
                                <div className="rp-rev-room" style={{ width: `${roomPct}%` }} />
                                <div
                                  className="rp-rev-service"
                                  style={{ width: `${servicePct}%` }}
                                />
                              </div>
                              <small style={{ fontSize: '11px', color: 'var(--rp-muted)' }}>
                                {roomPct}% Rooms · {servicePct}% Services
                              </small>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredRevenue.length === 0 && (
                    <div className="rp-empty">
                      <Icon name="search" size={28} />
                      <h3>No revenue entries</h3>
                      <p>Try widening the selected date interval.</p>
                    </div>
                  )}
                  <div className="rp-table-footer">
                    <span>Showing {filteredRevenue.length} branches</span>
                    <span>
                      Grand Total Revenue:{' '}
                      <strong style={{ fontSize: '14px', color: '#00152f' }}>
                        {formatLKR(kpis.totalRev)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 5: Top Services */}
              {activeTab === 'top-services' && (
                <div className="rp-table-scroll">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th scope="col">Rank</th>
                        <th scope="col">Service Name</th>
                        <th scope="col" className="rp-num">
                          Total Ordered
                        </th>
                        <th scope="col" className="rp-num">
                          Distinct Bookings
                        </th>
                        <th scope="col" className="rp-num">
                          Total Revenue Generated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTopServices.map((row, idx) => (
                        <tr key={row.service_name}>
                          <td>
                            <span
                              style={{
                                display: 'inline-grid',
                                placeItems: 'center',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background:
                                  idx === 0
                                    ? '#ffd880'
                                    : idx === 1
                                      ? '#e2e8f0'
                                      : idx === 2
                                        ? '#fed7aa'
                                        : '#f1f5f9',
                                color: '#1e293b',
                                fontWeight: 700,
                                fontSize: '11px',
                              }}
                            >
                              #{idx + 1}
                            </span>
                          </td>
                          <td>
                            <strong>{row.service_name}</strong>
                          </td>
                          <td className="rp-num">{row.total_quantity}</td>
                          <td className="rp-num">{row.booking_count}</td>
                          <td className="rp-num">
                            <strong>{formatLKR(row.total_revenue)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTopServices.length === 0 && (
                    <div className="rp-empty">
                      <Icon name="search" size={28} />
                      <h3>No services found</h3>
                      <p>Try a different search query.</p>
                    </div>
                  )}
                  <div className="rp-table-footer">
                    <span>
                      Showing top {filteredTopServices.length} services by order count and revenue
                    </span>
                    <span>SkyNest Catalogue Performance</span>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Footer */}
        <footer className="fd-footer" style={{ marginTop: '36px' }}>
          <span>SkyNest Hotels · Operational & Financial Database Intelligence</span>
          <span>Role: {user?.role || 'Staff'}</span>
        </footer>
      </div>
    </main>
  );
}
