import type { FC } from 'react';
import { useState } from 'react';
import Table from '../components/common/Table';
import type { Column } from '../components/common/Table';
import CommonButton from '../components/common/Button';
import Modal from '../components/common/Modal';
import FormInput from '../components/common/FormInput';
import type { UserRole } from '../types/auth';

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
}

const mockStaff: StaffAccount[] = [
  {
    id: '1',
    name: 'Sarah Connor',
    email: 'admin@skynest.lk',
    role: 'admin',
    branch: 'All Branches',
    status: 'Active',
    createdAt: '2026-01-10',
  },
  {
    id: '2',
    name: 'Dilshan Silva',
    email: 'manager@skynest.lk',
    role: 'manager',
    branch: 'Sky Nest Colombo',
    status: 'Active',
    createdAt: '2026-02-15',
  },
  {
    id: '3',
    name: 'Kamal Perera',
    email: 'frontdesk@skynest.lk',
    role: 'frontdesk',
    branch: 'Sky Nest Colombo',
    status: 'Active',
    createdAt: '2026-03-01',
  },
  {
    id: '4',
    name: 'Nadeesha Senanayake',
    email: 'nadeesha@skynest.lk',
    role: 'frontdesk',
    branch: 'Sky Nest Kandy',
    status: 'Active',
    createdAt: '2026-04-12',
  },
  {
    id: '5',
    name: 'Rohan Wickrama',
    email: 'rohan@skynest.lk',
    role: 'manager',
    branch: 'Sky Nest Kandy',
    status: 'Suspended',
    createdAt: '2026-01-20',
  },
];

export const UserManagementPage: FC = () => {
  const [staffList, setStaffList] = useState<StaffAccount[]>(mockStaff);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('frontdesk');
  const [branch, setBranch] = useState('Sky Nest Colombo');

  const handleAddStaff = () => {
    if (!name || !email) return;
    const newStaff: StaffAccount = {
      id: String(Date.now()),
      name,
      email,
      role,
      branch,
      status: 'Active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setStaffList([newStaff, ...staffList]);
    setModalOpen(false);
    setName('');
    setEmail('');
  };

  const handleToggleStatus = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'Active' ? 'Suspended' : 'Active' } : s,
      ),
    );
  };

  const columns: Column<StaffAccount>[] = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Role',
      accessor: 'role',
      render: (r) => {
        const roleColors: Record<UserRole, string> = {
          admin: 'bg-purple-100 text-purple-800',
          manager: 'bg-blue-100 text-blue-800',
          frontdesk: 'bg-emerald-100 text-emerald-800',
          guest: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${roleColors[r.role]}`}
          >
            {r.role}
          </span>
        );
      },
    },
    { header: 'Branch', accessor: 'branch' },
    {
      header: 'Status',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            r.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {r.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <CommonButton size="sm" variant="outline" onClick={() => handleToggleStatus(r.id)}>
          {r.status === 'Active' ? 'Deactivate' : 'Activate'}
        </CommonButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Account Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create, configure permissions, and monitor system access for hotel employees.
          </p>
        </div>

        <CommonButton onClick={() => setModalOpen(true)}>+ Add Staff Member</CommonButton>
      </div>

      <Table
        columns={columns}
        data={staffList}
        keyExtractor={(r) => r.id}
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.role.toLowerCase().includes(q)
        }
        searchPlaceholder="Search staff by name, email or role..."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Staff Member"
        description="Provide account details and assign administrative role."
        footer={
          <>
            <CommonButton variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </CommonButton>
            <CommonButton onClick={handleAddStaff}>Create Account</CommonButton>
          </>
        }
      >
        <div className="space-y-3">
          <FormInput
            label="Full Name"
            placeholder="e.g. Priyantha Jayasuriya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormInput
            label="Email Address"
            type="email"
            placeholder="staff@skynest.lk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-gray-900"
            >
              <option value="frontdesk">Front Desk Staff</option>
              <option value="manager">Hotel Manager</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Assigned Branch
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-gray-900"
            >
              <option value="Sky Nest Colombo">Sky Nest Colombo</option>
              <option value="Sky Nest Kandy">Sky Nest Kandy</option>
              <option value="All Branches">All Branches (Global)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
