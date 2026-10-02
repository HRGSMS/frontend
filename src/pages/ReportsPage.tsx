import type { FC } from 'react';
import { useState } from 'react';
import CommonButton from '../components/common/Button';
import Table from '../components/common/Table';

type ReportTab = 'occupancy' | 'revenue' | 'billing' | 'services';

export const ReportsPage: FC = () => {
  const [tab, setTab] = useState<ReportTab>('occupancy');
  const [startDate, setStartDate] = useState('2026-09-25');
  const [endDate, setEndDate] = useState('2026-10-02');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(val);

  // Mock datasets for each tab
  const occupancyData = [
    { date: '2026-10-01', totalRooms: 48, occupied: 38, vacant: 8, maintenance: 2, rate: '79%' },
    { date: '2026-09-30', totalRooms: 48, occupied: 36, vacant: 10, maintenance: 2, rate: '75%' },
    { date: '2026-09-29', totalRooms: 48, occupied: 41, vacant: 5, maintenance: 2, rate: '85%' },
    { date: '2026-09-28', totalRooms: 48, occupied: 34, vacant: 12, maintenance: 2, rate: '71%' },
  ];

  const revenueData = [
    { date: '2026-10-01', roomRevenue: 520000, serviceRevenue: 64000, total: 584000, adr: 13684 },
    { date: '2026-09-30', roomRevenue: 490000, serviceRevenue: 70000, total: 560000, adr: 13611 },
    { date: '2026-09-29', roomRevenue: 470000, serviceRevenue: 60000, total: 530000, adr: 11463 },
    { date: '2026-09-28', roomRevenue: 440000, serviceRevenue: 50000, total: 490000, adr: 12941 },
  ];

  const billingData = [
    {
      branch: 'Sky Nest Colombo',
      totalInvoiced: 4250000,
      collected: 3850000,
      outstanding: 400000,
      collectionRate: '90.5%',
    },
    {
      branch: 'Sky Nest Kandy',
      totalInvoiced: 2800000,
      collected: 2600000,
      outstanding: 200000,
      collectionRate: '92.8%',
    },
  ];

  const servicesData = [
    {
      serviceName: 'Room Service: Dinner Special',
      ordersCount: 42,
      totalRevenue: 189000,
      popularTime: '7:30 PM',
    },
    {
      serviceName: 'Full Body Ayurvedic Massage',
      ordersCount: 18,
      totalRevenue: 216000,
      popularTime: '3:00 PM',
    },
    {
      serviceName: 'Laundry (Dry Clean)',
      ordersCount: 26,
      totalRevenue: 39000,
      popularTime: '10:00 AM',
    },
    {
      serviceName: 'Airport Shuttle',
      ordersCount: 14,
      totalRevenue: 112000,
      popularTime: '12:00 PM',
    },
  ];

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (tab === 'occupancy') {
      csvContent += 'Date,Total Rooms,Occupied,Vacant,Maintenance,Occupancy Rate\n';
      occupancyData.forEach((row) => {
        csvContent += `${row.date},${row.totalRooms},${row.occupied},${row.vacant},${row.maintenance},${row.rate}\n`;
      });
    } else if (tab === 'revenue') {
      csvContent += 'Date,Room Revenue,Service Revenue,Total Revenue,ADR\n';
      revenueData.forEach((row) => {
        csvContent += `${row.date},${row.roomRevenue},${row.serviceRevenue},${row.total},${row.adr}\n`;
      });
    } else if (tab === 'billing') {
      csvContent += 'Branch,Total Invoiced,Collected,Outstanding,Collection Rate\n';
      billingData.forEach((row) => {
        csvContent += `${row.branch},${row.totalInvoiced},${row.collected},${row.outstanding},${row.collectionRate}\n`;
      });
    } else {
      csvContent += 'Service Name,Orders Count,Total Revenue,Popular Time\n';
      servicesData.forEach((row) => {
        csvContent += `${row.serviceName},${row.ordersCount},${row.totalRevenue},${row.popularTime}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tab}-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics Hub</h1>
          <p className="text-xs text-gray-500 mt-1">
            Analyze property performance, occupancy trends, revenue collection, and service demand.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-1.5 text-xs bg-white"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-1.5 text-xs bg-white"
          />
          <CommonButton variant="outline" size="sm" onClick={handleExportCSV}>
            ⬇ Export CSV
          </CommonButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(
          [
            ['occupancy', 'Occupancy Report'],
            ['revenue', 'Revenue & ADR'],
            ['billing', 'Billing Summary'],
            ['services', 'Service Usage'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
              tab === k
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tab === 'occupancy' && (
        <Table
          columns={[
            { header: 'Date', accessor: 'date', sortable: true },
            { header: 'Total Rooms', accessor: 'totalRooms', align: 'center' },
            { header: 'Occupied', accessor: 'occupied', align: 'center' },
            { header: 'Vacant', accessor: 'vacant', align: 'center' },
            { header: 'Maintenance', accessor: 'maintenance', align: 'center' },
            {
              header: 'Occupancy %',
              accessor: 'rate',
              align: 'right',
              render: (r) => <span className="font-bold text-green-700">{r.rate}</span>,
            },
          ]}
          data={occupancyData}
          keyExtractor={(r) => r.date}
        />
      )}

      {tab === 'revenue' && (
        <Table
          columns={[
            { header: 'Date', accessor: 'date', sortable: true },
            {
              header: 'Room Revenue',
              accessor: 'roomRevenue',
              align: 'right',
              render: (r) => formatCurrency(r.roomRevenue),
            },
            {
              header: 'Service Revenue',
              accessor: 'serviceRevenue',
              align: 'right',
              render: (r) => formatCurrency(r.serviceRevenue),
            },
            {
              header: 'Total Revenue',
              accessor: 'total',
              align: 'right',
              render: (r) => (
                <span className="font-bold text-gray-900">{formatCurrency(r.total)}</span>
              ),
            },
            {
              header: 'ADR',
              accessor: 'adr',
              align: 'right',
              render: (r) => formatCurrency(r.adr),
            },
          ]}
          data={revenueData}
          keyExtractor={(r) => r.date}
        />
      )}

      {tab === 'billing' && (
        <Table
          columns={[
            { header: 'Branch', accessor: 'branch', sortable: true },
            {
              header: 'Total Invoiced',
              accessor: 'totalInvoiced',
              align: 'right',
              render: (r) => formatCurrency(r.totalInvoiced),
            },
            {
              header: 'Collected',
              accessor: 'collected',
              align: 'right',
              render: (r) => (
                <span className="font-medium text-green-700">{formatCurrency(r.collected)}</span>
              ),
            },
            {
              header: 'Outstanding',
              accessor: 'outstanding',
              align: 'right',
              render: (r) => (
                <span className="font-medium text-red-600">{formatCurrency(r.outstanding)}</span>
              ),
            },
            { header: 'Collection Rate', accessor: 'collectionRate', align: 'right' },
          ]}
          data={billingData}
          keyExtractor={(r) => r.branch}
        />
      )}

      {tab === 'services' && (
        <Table
          columns={[
            { header: 'Service Item', accessor: 'serviceName', sortable: true },
            { header: 'Order Count', accessor: 'ordersCount', align: 'center', sortable: true },
            {
              header: 'Total Generated',
              accessor: 'totalRevenue',
              align: 'right',
              sortable: true,
              render: (r) => formatCurrency(r.totalRevenue),
            },
            { header: 'Peak Time', accessor: 'popularTime', align: 'right' },
          ]}
          data={servicesData}
          keyExtractor={(r) => r.serviceName}
        />
      )}
    </div>
  );
};

export default ReportsPage;
