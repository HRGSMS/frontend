import type { FC } from 'react';
import Table from '../components/common/Table';
import type { Column } from '../components/common/Table';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  details: string;
  ipAddress: string;
}

const mockAuditLogs: AuditEntry[] = [
  {
    id: 'LOG-901',
    timestamp: '2026-10-02 07:15:20',
    userName: 'Kamal Perera',
    userRole: 'frontdesk',
    action: 'CHECK_IN',
    entity: 'Booking RES-4519',
    details: 'Guest checked into room 311',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'LOG-900',
    timestamp: '2026-10-02 06:40:12',
    userName: 'Dilshan Silva',
    userRole: 'manager',
    action: 'PRICE_UPDATE',
    entity: 'Service #1',
    details: 'Updated Breakfast price to LKR 2,500',
    ipAddress: '192.168.1.10',
  },
  {
    id: 'LOG-899',
    timestamp: '2026-10-01 22:30:05',
    userName: 'Sarah Connor',
    userRole: 'admin',
    action: 'USER_CREATE',
    entity: 'User #4',
    details: 'Created account for Nadeesha Senanayake',
    ipAddress: '192.168.1.2',
  },
  {
    id: 'LOG-898',
    timestamp: '2026-10-01 19:12:44',
    userName: 'Kamal Perera',
    userRole: 'frontdesk',
    action: 'PAYMENT_RECORD',
    entity: 'Booking RES-4501',
    details: 'Settled LKR 52,000 cash payment',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'LOG-897',
    timestamp: '2026-10-01 16:05:18',
    userName: 'System',
    userRole: 'system',
    action: 'NIGHT_AUDIT',
    entity: 'Daily Folio',
    details: 'Night audit completed automatically for Oct 01',
    ipAddress: '127.0.0.1',
  },
];

export const AuditLogViewerPage: FC = () => {
  const columns: Column<AuditEntry>[] = [
    { header: 'Timestamp', accessor: 'timestamp', sortable: true },
    {
      header: 'Actor',
      render: (r) => (
        <div>
          <span className="font-semibold text-gray-900">{r.userName}</span>
          <span className="text-gray-400 text-xs ml-1.5 capitalize">({r.userRole})</span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (r) => (
        <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-800">
          {r.action}
        </span>
      ),
    },
    { header: 'Target Entity', accessor: 'entity' },
    { header: 'Details', accessor: 'details' },
    { header: 'IP', accessor: 'ipAddress', align: 'right' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security & Audit Log Viewer</h1>
        <p className="text-xs text-gray-500 mt-1">
          Immutable audit trail capturing all user actions, rate alterations, and financial events.
        </p>
      </div>

      <Table
        columns={columns}
        data={mockAuditLogs}
        keyExtractor={(r) => r.id}
        searchFilter={(row, q) =>
          row.userName.toLowerCase().includes(q) ||
          row.action.toLowerCase().includes(q) ||
          row.entity.toLowerCase().includes(q) ||
          row.details.toLowerCase().includes(q)
        }
        searchPlaceholder="Filter audit trail by user, action or entity..."
      />
    </div>
  );
};

export default AuditLogViewerPage;
