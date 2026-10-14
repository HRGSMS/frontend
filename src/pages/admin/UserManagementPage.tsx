import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import { authClient } from '../../lib/auth-client';
import { roleLabels, type Role } from '../../lib/auth-policy';

export interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt: string | Date;
  banned?: boolean;
  banReason?: string | null;
  image?: string | null;
}

type StaffRole = 'front_desk' | 'manager';

const CREATABLE_ROLES: { value: StaffRole; label: string; description: string; badgeColor: string }[] = [
  {
    value: 'front_desk',
    label: 'Front Desk Staff',
    description: 'Check-in/out, reservation calendar, payment collection, and service orders.',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    value: 'manager',
    label: 'Branch Manager',
    description: 'Managerial analytics, revenue audits, staff oversight, and reservation adjustments.',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
];

const ALL_ROLES: Role[] = ['admin', 'manager', 'front_desk', 'service_staff', 'guest'];

function formatDateTime(dateValue: string | Date | undefined): string {
  if (!dateValue) return '—';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateValue);
  }
}

function getRoleBadge(roleStr: string | undefined) {
  const role = roleStr as Role | undefined;
  switch (role) {
    case 'admin':
      return {
        label: roleLabels.admin,
        classes: 'bg-purple-50 text-purple-800 border-purple-200',
      };
    case 'manager':
      return {
        label: roleLabels.manager,
        classes: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    case 'front_desk':
      return {
        label: roleLabels.front_desk,
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'service_staff':
      return {
        label: roleLabels.service_staff,
        classes: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'guest':
      return {
        label: roleLabels.guest,
        classes: 'bg-gray-100 text-gray-700 border-gray-200',
      };
    default:
      return {
        label: roleStr || 'Unassigned',
        classes: 'bg-gray-100 text-gray-600 border-gray-200',
      };
  }
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<BetterAuthUser[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modal: Create User
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<StaffRole>('front_desk');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal: Change Role
  const [roleChangeUser, setRoleChangeUser] = useState<BetterAuthUser | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState<string>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);

  // Modal: Delete Confirmation
  const [userToDelete, setUserToDelete] = useState<BetterAuthUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const res = await authClient.admin.listUsers({
        query: {
          limit: 100,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        },
      });

      if (res.error) {
        setPageError(res.error.message || 'Failed to fetch user directory');
        return;
      }

      if (res.data) {
        const fetchedUsers = (res.data.users || []) as unknown as BetterAuthUser[];
        setUsers(fetchedUsers);
        setTotalCount(res.data.total ?? fetchedUsers.length);
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Unable to connect to auth service');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    authClient.admin
      .listUsers({
        query: {
          limit: 100,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        },
      })
      .then((res) => {
        if (!active) return;
        if (res.error) {
          setPageError(res.error.message || 'Failed to fetch user directory');
        } else if (res.data) {
          const fetchedUsers = (res.data.users || []) as unknown as BetterAuthUser[];
          setUsers(fetchedUsers);
          setTotalCount(res.data.total ?? fetchedUsers.length);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setPageError(err instanceof Error ? err.message : 'Unable to connect to auth service');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Filtered users for rendering
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q);

      const matchesRole =
        selectedRoleFilter === 'all' ||
        (u.role && u.role.toLowerCase() === selectedRoleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const managers = users.filter((u) => u.role === 'manager').length;
    const frontDesk = users.filter((u) => u.role === 'front_desk').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const guests = users.filter((u) => u.role === 'guest').length;
    return { total, managers, frontDesk, admins, guests };
  }, [users]);

  // Create User Handler
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const name = createName.trim();
    const email = createEmail.trim().toLowerCase();
    const password = createPassword;

    if (!name) {
      setCreateError('Please provide a full name for the staff member.');
      return;
    }
    if (!email || !email.includes('@')) {
      setCreateError('Please provide a valid email address.');
      return;
    }
    if (password.length < 8) {
      setCreateError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authClient.admin.createUser({
        name,
        email,
        password,
        role: createRole as unknown as 'admin',
      });

      if (res.error) {
        setCreateError(res.error.message || 'Failed to create user account');
        return;
      }

      // Success
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('front_desk');
      showNotification(
        `✓ Successfully provisioned ${createRole === 'front_desk' ? 'Front Desk' : 'Branch Manager'} account for ${name} (${email})`,
      );
      await loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error provisioning user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Role Handler
  const handleChangeRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!roleChangeUser || !newRoleSelection) return;

    setIsUpdatingRole(true);
    setRoleUpdateError(null);
    try {
      const res = await authClient.admin.setRole({
        userId: roleChangeUser.id,
        role: newRoleSelection as unknown as 'admin',
      });

      if (res.error) {
        setRoleUpdateError(res.error.message || 'Failed to update user role');
        return;
      }

      showNotification(`✓ Updated role for ${roleChangeUser.name} to ${roleLabels[newRoleSelection as Role] || newRoleSelection}`);
      setRoleChangeUser(null);
      await loadUsers();
    } catch (err) {
      setRoleUpdateError(err instanceof Error ? err.message : 'Error updating user role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await authClient.admin.removeUser({
        userId: userToDelete.id,
      });

      if (res.error) {
        setDeleteError(res.error.message || 'Failed to remove user account');
        return;
      }

      showNotification(`✓ Successfully deleted user account for ${userToDelete.name}`);
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting user account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="sn-admin-dashboard mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col gap-4 pb-6 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-700 uppercase">
            <Link to="/admin/dashboard" className="hover:underline flex items-center gap-1">
              ← Executive Admin
            </Link>
            <span>·</span>
            <span>Identity & Access Control</span>
          </div>
          <h1 className="mt-1 text-3xl font-serif font-medium text-gray-900 tracking-tight">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Provision new Front Desk and Manager accounts, review active credentials, and oversee staff access.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => void loadUsers()}
            disabled={isLoading}
            title="Refresh user directory"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          <button
            onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#224846] hover:bg-[#193634] text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Provision New Staff User
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          role="status"
          className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-800 flex items-center justify-between shadow-sm animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {pageError && (
        <div
          role="alert"
          className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between shadow-sm"
        >
          <span>Error: {pageError}</span>
          <button
            onClick={() => void loadUsers()}
            className="font-medium underline hover:text-red-900 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <section className="mt-6" aria-label="User directory summary">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Accounts
            </span>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {isLoading ? <span className="inline-block h-6 w-12 animate-pulse bg-gray-200 rounded" /> : totalCount}
            </div>
            <p className="mt-1 text-xs text-gray-500">In Better Auth database</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">
              Front Desk Staff
            </span>
            <div className="mt-2 text-2xl font-semibold text-emerald-900">
              {isLoading ? <span className="inline-block h-6 w-12 animate-pulse bg-gray-200 rounded" /> : stats.frontDesk}
            </div>
            <p className="mt-1 text-xs text-gray-500">Operational check-in users</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-blue-700">
              Branch Managers
            </span>
            <div className="mt-2 text-2xl font-semibold text-blue-900">
              {isLoading ? <span className="inline-block h-6 w-12 animate-pulse bg-gray-200 rounded" /> : stats.managers}
            </div>
            <p className="mt-1 text-xs text-gray-500">Supervisory permissions</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-purple-700">
              Administrators
            </span>
            <div className="mt-2 text-2xl font-semibold text-purple-900">
              {isLoading ? <span className="inline-block h-6 w-12 animate-pulse bg-gray-200 rounded" /> : stats.admins}
            </div>
            <p className="mt-1 text-xs text-gray-500">Full group administrative rights</p>
          </div>
        </div>
      </section>

      {/* Directory Filter & Search Bar */}
      <section className="mt-8">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-gray-50/50">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#224846] focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-gray-500 mr-1">Role:</span>
              <button
                onClick={() => setSelectedRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedRoleFilter === 'all'
                    ? 'bg-[#224846] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setSelectedRoleFilter('front_desk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedRoleFilter === 'front_desk'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Front Desk ({stats.frontDesk})
              </button>
              <button
                onClick={() => setSelectedRoleFilter('manager')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedRoleFilter === 'manager'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Managers ({stats.managers})
              </button>
              <button
                onClick={() => setSelectedRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedRoleFilter === 'admin'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Admins ({stats.admins})
              </button>
              <button
                onClick={() => setSelectedRoleFilter('guest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedRoleFilter === 'guest'
                    ? 'bg-gray-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Guests ({stats.guests})
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    User Details
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Assigned Role
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Account Status
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-6 h-6 animate-spin text-[#224846]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Loading user directory from Better Auth...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <p className="font-medium text-gray-700">No users match your criteria.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try modifying your search query or role filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const badge = getRoleBadge(u.role);
                    const isSelf = currentUser?.id === u.id || currentUser?.email === u.email;
                    const initials = (u.name || u.email || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* User Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-700 text-sm shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 truncate">
                                  {u.name || 'Unnamed User'}
                                </span>
                                {isSelf && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{u.email}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                                ID: {u.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Role */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Account Status */}
                        <td className="px-6 py-4">
                          {u.banned ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {formatDateTime(u.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Change Role Button */}
                            <button
                              onClick={() => {
                                setRoleChangeUser(u);
                                setNewRoleSelection(u.role || 'front_desk');
                                setRoleUpdateError(null);
                              }}
                              title="Update staff role"
                              className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              Change Role
                            </button>

                            {/* Delete Button (disabled for self) */}
                            {!isSelf && (
                              <button
                                onClick={() => {
                                  setUserToDelete(u);
                                  setDeleteError(null);
                                }}
                                title="Remove user account"
                                className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50/50 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredUsers.length} of {totalCount} registered user accounts
            </span>
            <span>Backed by Better Auth (`user` & `account` tables)</span>
          </div>
        </div>
      </section>

      {/* ── MODAL: Provision New Staff User ── */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#224846] text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
                  Administrator Action
                </span>
                <h2 className="text-xl font-serif font-medium mt-0.5">
                  Provision New Staff Account
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => void handleCreateUser(e)} className="p-6 space-y-4">
              {createError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {createError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Bandara"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#224846] focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kasun.b@hotel.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#224846] focus:border-transparent"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Staff member will use this email address to sign in.
                </span>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#224846] focus:border-transparent"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Password will be hashed securely via Better Auth credential provider.
                </span>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Staff Role Assignment <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2.5">
                  {CREATABLE_ROLES.map((r) => {
                    const isChecked = createRole === r.value;
                    return (
                      <label
                        key={r.value}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-[#224846] bg-emerald-50/30 ring-1 ring-[#224846]'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="staffRole"
                          value={r.value}
                          checked={isChecked}
                          onChange={() => setCreateRole(r.value)}
                          className="mt-1 h-4 w-4 text-[#224846] border-gray-300 focus:ring-[#224846]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{r.label}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${r.badgeColor}`}>
                              {r.value}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#224846] hover:bg-[#193634] text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Change Role ── */}
      {roleChangeUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-800 text-white flex items-center justify-between">
              <h2 className="text-base font-semibold">Change User Role</h2>
              <button
                type="button"
                onClick={() => setRoleChangeUser(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => void handleChangeRole(e)} className="p-6 space-y-4">
              {roleUpdateError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {roleUpdateError}
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">
                  Update role and privileges for{' '}
                  <strong className="text-gray-900">{roleChangeUser.name}</strong> ({roleChangeUser.email}):
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Select New Role
                </label>
                <select
                  value={newRoleSelection}
                  onChange={(e) => setNewRoleSelection(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#224846]"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r]} ({r})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRoleChangeUser(null)}
                  disabled={isUpdatingRole}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRole}
                  className="px-5 py-2 bg-[#224846] hover:bg-[#193634] text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isUpdatingRole ? 'Updating...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete User Confirmation ── */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <h2 className="text-base font-semibold">Confirm Account Deletion</h2>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {deleteError}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Are you sure you want to permanently delete the account for{' '}
                <strong className="text-gray-900">{userToDelete.name}</strong> ({userToDelete.email})?
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ This will revoke all sessions and remove the record from Better Auth's `user` and `account` tables. This action cannot be undone.
              </p>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteUser()}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
