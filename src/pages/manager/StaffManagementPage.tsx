import { useState, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import './StaffManagementPage.css';

export type Department =
  | 'Front Desk'
  | 'Housekeeping'
  | 'Guest Services'
  | 'Maintenance'
  | 'Security';

export type Shift = 'Morning' | 'Evening' | 'Night Audit';

export type StaffStatus = 'On Duty' | 'Scheduled' | 'On Break' | 'On Leave';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: Department;
  branch: string;
  shift: Shift;
  shiftTime: string;
  status: StaffStatus;
  email: string;
  phone: string;
}

export interface HandoverNote {
  id: string;
  author: string;
  time: string;
  text: string;
}

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: 'SN-101',
    name: 'Kasun Wickramasinghe',
    role: 'Front Office Lead',
    department: 'Front Desk',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'kasun.w@skynesthotels.com',
    phone: '+94 77 123 4011',
  },
  {
    id: 'SN-102',
    name: 'Anoma Rathnayake',
    role: 'Senior Receptionist',
    department: 'Front Desk',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'anoma.r@skynesthotels.com',
    phone: '+94 77 123 4012',
  },
  {
    id: 'SN-103',
    name: 'Kavindi Perera',
    role: 'Guest Relations Executive',
    department: 'Front Desk',
    branch: 'SkyNest Colombo',
    shift: 'Evening',
    shiftTime: '15:00 - 23:30',
    status: 'Scheduled',
    email: 'kavindi.p@skynesthotels.com',
    phone: '+94 77 123 4013',
  },
  {
    id: 'SN-104',
    name: 'Dilshan Mendis',
    role: 'Night Auditor',
    department: 'Front Desk',
    branch: 'SkyNest Colombo',
    shift: 'Night Audit',
    shiftTime: '23:00 - 07:30',
    status: 'Scheduled',
    email: 'dilshan.m@skynesthotels.com',
    phone: '+94 77 123 4014',
  },
  {
    id: 'SN-201',
    name: 'Priyani Fernando',
    role: 'Executive Housekeeper',
    department: 'Housekeeping',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'priyani.f@skynesthotels.com',
    phone: '+94 77 234 5021',
  },
  {
    id: 'SN-202',
    name: 'Sunil Jayasuriya',
    role: 'Floor Supervisor',
    department: 'Housekeeping',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'sunil.j@skynesthotels.com',
    phone: '+94 77 234 5022',
  },
  {
    id: 'SN-203',
    name: 'Chamari Silva',
    role: 'Room Attendant (Floors 1-2)',
    department: 'Housekeeping',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'chamari.s@skynesthotels.com',
    phone: '+94 77 234 5023',
  },
  {
    id: 'SN-204',
    name: 'Nimali Jayawardena',
    role: 'Room Attendant (Floors 3-4)',
    department: 'Housekeeping',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'nimali.j@skynesthotels.com',
    phone: '+94 77 234 5024',
  },
  {
    id: 'SN-205',
    name: 'Sandun Bandara',
    role: 'Laundry Specialist',
    department: 'Housekeeping',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Break',
    email: 'sandun.b@skynesthotels.com',
    phone: '+94 77 234 5025',
  },
  {
    id: 'SN-301',
    name: 'Rohana Alwis',
    role: 'Head Concierge',
    department: 'Guest Services',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'rohana.a@skynesthotels.com',
    phone: '+94 77 345 6031',
  },
  {
    id: 'SN-302',
    name: 'Dinesh Gunaratne',
    role: 'Luggage & Porter Lead',
    department: 'Guest Services',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'dinesh.g@skynesthotels.com',
    phone: '+94 77 345 6032',
  },
  {
    id: 'SN-303',
    name: 'Nadeeka Senanayake',
    role: 'Room Service Captain',
    department: 'Guest Services',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'nadeeka.s@skynesthotels.com',
    phone: '+94 77 345 6033',
  },
  {
    id: 'SN-401',
    name: 'Thilina Karunaratne',
    role: 'Chief Engineer',
    department: 'Maintenance',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'thilina.k@skynesthotels.com',
    phone: '+94 77 456 7041',
  },
  {
    id: 'SN-402',
    name: 'Nuwan Ekanayake',
    role: 'HVAC & Electrical Tech',
    department: 'Maintenance',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'nuwan.e@skynesthotels.com',
    phone: '+94 77 456 7042',
  },
  {
    id: 'SN-501',
    name: 'Kapila Wijeratne',
    role: 'Chief Security Officer',
    department: 'Security',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'kapila.w@skynesthotels.com',
    phone: '+94 77 567 8051',
  },
  {
    id: 'SN-502',
    name: 'Ruwan Dissanayake',
    role: 'Surveillance Officer',
    department: 'Security',
    branch: 'SkyNest Colombo',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'ruwan.d@skynesthotels.com',
    phone: '+94 77 567 8052',
  },
  // SkyNest Kandy Staff
  {
    id: 'SN-K101',
    name: 'Kusal Perera',
    role: 'Front Office Supervisor',
    department: 'Front Desk',
    branch: 'SkyNest Kandy',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'kusal.p@skynesthotels.com',
    phone: '+94 81 223 4001',
  },
  {
    id: 'SN-K102',
    name: 'Nilani Bandara',
    role: 'Guest Relations Executive',
    department: 'Front Desk',
    branch: 'SkyNest Kandy',
    shift: 'Evening',
    shiftTime: '15:00 - 23:30',
    status: 'Scheduled',
    email: 'nilani.b@skynesthotels.com',
    phone: '+94 81 223 4002',
  },
  {
    id: 'SN-K201',
    name: 'Rohan Senanayake',
    role: 'Housekeeping Lead',
    department: 'Housekeeping',
    branch: 'SkyNest Kandy',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'rohan.s@skynesthotels.com',
    phone: '+94 81 223 5001',
  },
  {
    id: 'SN-K401',
    name: 'Ajith Kumara',
    role: 'Maintenance Technician',
    department: 'Maintenance',
    branch: 'SkyNest Kandy',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'ajith.k@skynesthotels.com',
    phone: '+94 81 223 6001',
  },
  // SkyNest Galle Staff
  {
    id: 'SN-G101',
    name: 'Tharindu De Silva',
    role: 'Front Office Supervisor',
    department: 'Front Desk',
    branch: 'SkyNest Galle',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'tharindu.d@skynesthotels.com',
    phone: '+94 91 224 4001',
  },
  {
    id: 'SN-G102',
    name: 'Nadeeka Abeyratne',
    role: 'Senior Receptionist',
    department: 'Front Desk',
    branch: 'SkyNest Galle',
    shift: 'Evening',
    shiftTime: '15:00 - 23:30',
    status: 'Scheduled',
    email: 'nadeeka.a@skynesthotels.com',
    phone: '+94 91 224 4002',
  },
  {
    id: 'SN-G201',
    name: 'Sunethra Gamage',
    role: 'Executive Housekeeper',
    department: 'Housekeeping',
    branch: 'SkyNest Galle',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'sunethra.g@skynesthotels.com',
    phone: '+94 91 224 5001',
  },
  {
    id: 'SN-G501',
    name: 'Mahela Wickrama',
    role: 'Security Lead',
    department: 'Security',
    branch: 'SkyNest Galle',
    shift: 'Morning',
    shiftTime: '07:00 - 15:30',
    status: 'On Duty',
    email: 'mahela.w@skynesthotels.com',
    phone: '+94 91 224 6001',
  },
];

const DEFAULT_HANDOVER_NOTES: HandoverNote[] = [
  {
    id: 'note-1',
    author: 'Kasun W. (Front Desk)',
    time: '08:30 AM',
    text: 'VIP guest arrival scheduled in Suite C104 at 14:00. Complimentary fruit basket pre-arranged.',
  },
  {
    id: 'note-2',
    author: 'Priyani F. (Housekeeping)',
    time: '10:15 AM',
    text: 'Floor 2 deep disinfection complete. Rooms 201-204 inspected and marked ready for arrivals.',
  },
  {
    id: 'note-3',
    author: 'Thilina K. (Maintenance)',
    time: '11:45 AM',
    text: 'AC thermostat calibration in Room C102 completed. All guest room climate units operational.',
  },
];

const STORAGE_KEY = 'skynest_staff_roster_v1';
const NOTES_STORAGE_KEY = 'skynest_shift_handovers_v1';

function getStoredStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STAFF;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STAFF;
  } catch {
    return DEFAULT_STAFF;
  }
}

function getStoredNotes(): HandoverNote[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return DEFAULT_HANDOVER_NOTES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_HANDOVER_NOTES;
  } catch {
    return DEFAULT_HANDOVER_NOTES;
  }
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const icons: Record<string, ReactNode> = {
    users: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5.65" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      </>
    ),
    arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    door: <path d="M4 21h16M7 21V3h10v18M13 12h1" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2" />
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
    >
      {icons[name] || icons.users}
    </svg>
  );
}

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<StaffMember[]>(getStoredStaff);
  const [notes, setNotes] = useState<HandoverNote[]>(getStoredNotes);
  const [newNoteText, setNewNoteText] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedShift, setSelectedShift] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: 'Front Desk' as Department,
    branch: 'SkyNest Colombo',
    shift: 'Morning' as Shift,
    status: 'On Duty' as StaffStatus,
  });

  const saveStaff = (updated: StaffMember[]) => {
    setStaffList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save staff to local storage', err);
    }
  };

  const saveNotes = (updated: HandoverNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save notes to local storage', err);
    }
  };

  // Cycle status on badge click
  const cycleStatus = (id: string) => {
    const statuses: StaffStatus[] = ['On Duty', 'On Break', 'Scheduled', 'On Leave'];
    const updated = staffList.map((s) => {
      if (s.id === id) {
        const nextIndex = (statuses.indexOf(s.status) + 1) % statuses.length;
        return { ...s, status: statuses[nextIndex] };
      }
      return s;
    });
    saveStaff(updated);
  };

  // Add new staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) return;

    const newId = `SN-${100 + staffList.length + 1}`;
    const shiftTimes: Record<Shift, string> = {
      Morning: '07:00 - 15:30',
      Evening: '15:00 - 23:30',
      'Night Audit': '23:00 - 07:30',
    };

    const newMember: StaffMember = {
      id: newId,
      name: formData.name.trim(),
      email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@skynesthotels.com`,
      phone: formData.phone.trim() || '+94 77 123 4567',
      role: formData.role.trim(),
      department: formData.department,
      branch: formData.branch,
      shift: formData.shift,
      shiftTime: shiftTimes[formData.shift],
      status: formData.status,
    };

    const updated = [newMember, ...staffList];
    saveStaff(updated);

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      department: 'Front Desk',
      branch: 'SkyNest Colombo',
      shift: 'Morning',
      status: 'On Duty',
    });
    setIsModalOpen(false);
  };

  // Add handover note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: HandoverNote = {
      id: `note-${Date.now()}`,
      author: user?.name ? `${user.name.split(' ')[0]} (Manager)` : 'Manager',
      time: new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
      text: newNoteText.trim(),
    };

    const updated = [newNote, ...notes];
    saveNotes(updated);
    setNewNoteText('');
  };

  // Filtering calculations
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);

      const matchesBranch = selectedBranch === 'All' || s.branch === selectedBranch;
      const matchesDept = selectedDept === 'All' || s.department === selectedDept;
      const matchesShift = selectedShift === 'All' || s.shift === selectedShift;
      const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;

      return matchesSearch && matchesBranch && matchesDept && matchesShift && matchesStatus;
    });
  }, [staffList, search, selectedBranch, selectedDept, selectedShift, selectedStatus]);

  // Statistics
  const totalStaff = staffList.length;
  const onDutyCount = staffList.filter((s) => s.status === 'On Duty').length;
  const onBreakCount = staffList.filter((s) => s.status === 'On Break').length;
  const scheduledCount = staffList.filter((s) => s.status === 'Scheduled').length;

  const coveragePercent = totalStaff > 0 ? Math.round((onDutyCount / (totalStaff - 2)) * 100) : 100;

  // Department counts
  const departments: { name: Department; target: number }[] = [
    { name: 'Front Desk', target: 4 },
    { name: 'Housekeeping', target: 8 },
    { name: 'Guest Services', target: 6 },
    { name: 'Maintenance', target: 2 },
    { name: 'Security', target: 2 },
  ];

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of staffList) {
      if (s.status === 'On Duty') {
        counts[s.department] = (counts[s.department] || 0) + 1;
      }
    }
    return counts;
  }, [staffList]);

  return (
    <main className="sm-page">
      <div className="sm-container">
        {/* Header */}
        <header className="sm-header">
          <div>
            <p className="sm-eyebrow">MANAGER WORKSPACE · HUMAN RESOURCES &amp; ROSTER</p>
            <h1>Staff Management &amp; Team Coverage</h1>
            <p className="sm-subtitle">
              Manage on-duty team coverage, shift schedules, and department allocations across SkyNest.
            </p>
          </div>
          <div className="sm-header-actions">
            <Link to="/manager/dashboard" className="sm-btn-secondary">
              &larr; Back to Dashboard
            </Link>
            <button onClick={() => setIsModalOpen(true)} className="sm-btn">
              <Icon name="plus" size={17} /> Add Staff Member
            </button>
          </div>
        </header>

        {/* 4 Metric Summary Cards */}
        <section className="sm-metrics-grid" aria-label="Staff statistics">
          <article className="sm-metric-card featured">
            <div className="sm-metric-header">
              <span>Currently On Duty</span>
              <div className="sm-metric-icon">
                <Icon name="check" size={20} />
              </div>
            </div>
            <p className="sm-metric-value">{onDutyCount}</p>
            <p className="sm-metric-note">Active hotel staff attending guests right now</p>
          </article>

          <article className="sm-metric-card">
            <div className="sm-metric-header">
              <span>Total Active Team</span>
              <div className="sm-metric-icon">
                <Icon name="users" size={20} />
              </div>
            </div>
            <p className="sm-metric-value">{totalStaff}</p>
            <p className="sm-metric-note">Registered staff across all operational branches</p>
          </article>

          <article className="sm-metric-card">
            <div className="sm-metric-header">
              <span>On Scheduled Break</span>
              <div className="sm-metric-icon">
                <Icon name="clock" size={20} />
              </div>
            </div>
            <p className="sm-metric-value">{onBreakCount}</p>
            <p className="sm-metric-note">Resting or scheduled meal breaks</p>
          </article>

          <article className="sm-metric-card">
            <div className="sm-metric-header">
              <span>Upcoming / Scheduled</span>
              <div className="sm-metric-icon">
                <Icon name="calendar" size={20} />
              </div>
            </div>
            <p className="sm-metric-value">{scheduledCount}</p>
            <p className="sm-metric-note">Assigned for upcoming Evening or Night shifts</p>
          </article>
        </section>

        {/* Department Coverage Meters */}
        <section className="sm-coverage-section">
          <div className="sm-coverage-title">
            <div>
              <h2>Department Duty Coverage Index</h2>
              <p>Real-time staffing fulfillment vs. hotel operational targets ({coveragePercent}% overall coverage)</p>
            </div>
          </div>
          <div className="sm-coverage-cards">
            {departments.map((dept) => {
              const current = deptCounts[dept.name] || 0;
              const pct = Math.min(100, Math.round((current / dept.target) * 100));
              return (
                <div key={dept.name} className="sm-dept-pill">
                  <div className="sm-dept-top">
                    <span className="sm-dept-name">{dept.name}</span>
                    <span className="sm-dept-ratio">
                      {current} / {dept.target}
                    </span>
                  </div>
                  <div className="sm-dept-meter">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span className="sm-dept-desc">{pct}% target coverage fulfilled</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main 2-Column Content */}
        <div className="sm-layout">
          {/* Staff Roster Table */}
          <section className="sm-table-panel">
            <div className="sm-table-top">
              <div className="sm-table-heading">
                <h2>Hotel Staff Directory &amp; Roster</h2>
                <span>{filteredStaff.length} team members</span>
              </div>

              {/* Filters */}
              <div className="sm-filters-row">
                <label className="sm-search-box">
                  <Icon name="search" size={16} />
                  <input
                    type="search"
                    placeholder="Search by name, ID, role or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>

                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="sm-select"
                >
                  <option value="All">All Branches</option>
                  <option value="SkyNest Colombo">SkyNest Colombo</option>
                  <option value="SkyNest Kandy">SkyNest Kandy</option>
                  <option value="SkyNest Galle">SkyNest Galle</option>
                </select>

                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="sm-select"
                >
                  <option value="All">All Shifts</option>
                  <option value="Morning">Morning Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="Night Audit">Night Audit</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="sm-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="On Duty">On Duty</option>
                  <option value="On Break">On Break</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            {/* Department Filter Tabs */}
            <div className="sm-dept-tabs">
              {['All', 'Front Desk', 'Housekeeping', 'Guest Services', 'Maintenance', 'Security'].map(
                (d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDept(d)}
                    className={`sm-dept-tab ${selectedDept === d ? 'active' : ''}`}
                  >
                    {d === 'All' ? 'All Departments' : d}
                  </button>
                ),
              )}
            </div>

            {/* Table */}
            <div className="sm-table-wrap">
              <table className="sm-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Department &amp; Role</th>
                    <th>Branch</th>
                    <th>Shift &amp; Hours</th>
                    <th>Duty Status (Click to toggle)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#888' }}>
                        No staff members found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const initials = staff.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2);

                      const statusClass =
                        staff.status === 'On Duty'
                          ? 'sm-status-onduty'
                          : staff.status === 'On Break'
                            ? 'sm-status-break'
                            : staff.status === 'Scheduled'
                              ? 'sm-status-scheduled'
                              : 'sm-status-leave';

                      return (
                        <tr key={staff.id}>
                          <td>
                            <div className="sm-staff-info">
                              <span className="sm-avatar">{initials}</span>
                              <div className="sm-staff-meta">
                                <strong>{staff.name}</strong>
                                <small>
                                  {staff.id} &bull; {staff.phone}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: '#192f33' }}>{staff.role}</div>
                            <small style={{ color: '#687774', fontSize: '11px' }}>
                              {staff.department}
                            </small>
                          </td>
                          <td>
                            <span style={{ color: '#445551', fontSize: '12px' }}>{staff.branch}</span>
                          </td>
                          <td>
                            <span className="sm-shift-tag">{staff.shift}</span>
                            <small style={{ display: 'block', color: '#7b8c87', fontSize: '11px', marginTop: '3px' }}>
                              {staff.shiftTime}
                            </small>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => cycleStatus(staff.id)}
                              className={`sm-status-badge ${statusClass}`}
                              title="Click to toggle status"
                            >
                              <i /> {staff.status}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Secondary Column: Today's Shift Overview & Handover Notes */}
          <aside className="sm-sidebar">
            {/* Shifts Card */}
            <div className="sm-panel">
              <h2>Today's Duty Roster</h2>
              <p>Shift breakdown and active operating windows</p>

              <div className="sm-shift-card active-now">
                <div className="sm-shift-header">
                  <span className="sm-shift-title">Morning Shift</span>
                  <span className="sm-shift-badge">Active</span>
                </div>
                <div className="sm-shift-time">07:00 AM &ndash; 03:30 PM</div>
                <span className="sm-shift-count">
                  {staffList.filter((s) => s.shift === 'Morning' && s.status === 'On Duty').length} staff on duty now
                </span>
              </div>

              <div className="sm-shift-card">
                <div className="sm-shift-header">
                  <span className="sm-shift-title">Evening Shift</span>
                  <span style={{ fontSize: '11px', color: '#667674' }}>Next</span>
                </div>
                <div className="sm-shift-time">03:00 PM &ndash; 11:30 PM</div>
                <span className="sm-shift-count">
                  {staffList.filter((s) => s.shift === 'Evening').length} staff rostered
                </span>
              </div>

              <div className="sm-shift-card">
                <div className="sm-shift-header">
                  <span className="sm-shift-title">Night Audit</span>
                  <span style={{ fontSize: '11px', color: '#667674' }}>Overnight</span>
                </div>
                <div className="sm-shift-time">11:00 PM &ndash; 07:30 AM</div>
                <span className="sm-shift-count">
                  {staffList.filter((s) => s.shift === 'Night Audit').length} staff rostered
                </span>
              </div>
            </div>

            {/* Operations & Handover Notes */}
            <div className="sm-panel">
              <h2>Shift Handover Log</h2>
              <p>Operations notes and department briefings</p>

              <div className="sm-notes-list">
                {notes.map((note) => (
                  <div key={note.id} className="sm-note-item">
                    <div className="sm-note-header">
                      <strong>{note.author}</strong>
                      <span>{note.time}</span>
                    </div>
                    <p className="sm-note-text">{note.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="sm-note-input">
                <input
                  type="text"
                  placeholder="Post handover note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                />
                <button type="submit">Post</button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="sm-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h3>Add New Staff Member</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="sm-modal-close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddStaff}>
              <div className="sm-modal-body">
                <div className="sm-form-group">
                  <label htmlFor="sm-name">Full Name *</label>
                  <input
                    id="sm-name"
                    required
                    type="text"
                    placeholder="e.g. Ruwan Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label htmlFor="sm-dept">Department *</label>
                    <select
                      id="sm-dept"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value as Department })
                      }
                    >
                      <option value="Front Desk">Front Desk</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Guest Services">Guest Services</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>

                  <div className="sm-form-group">
                    <label htmlFor="sm-role">Role / Position *</label>
                    <input
                      id="sm-role"
                      required
                      type="text"
                      placeholder="e.g. Concierge"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>
                </div>

                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label htmlFor="sm-branch">Branch Property</label>
                    <select
                      id="sm-branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    >
                      <option value="SkyNest Colombo">SkyNest Colombo</option>
                      <option value="SkyNest Kandy">SkyNest Kandy</option>
                      <option value="SkyNest Galle">SkyNest Galle</option>
                    </select>
                  </div>

                  <div className="sm-form-group">
                    <label htmlFor="sm-shift">Assigned Shift</label>
                    <select
                      id="sm-shift"
                      value={formData.shift}
                      onChange={(e) =>
                        setFormData({ ...formData, shift: e.target.value as Shift })
                      }
                    >
                      <option value="Morning">Morning (07:00 - 15:30)</option>
                      <option value="Evening">Evening (15:00 - 23:30)</option>
                      <option value="Night Audit">Night Audit (23:00 - 07:30)</option>
                    </select>
                  </div>
                </div>

                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label htmlFor="sm-phone">Phone Number</label>
                    <input
                      id="sm-phone"
                      type="tel"
                      placeholder="+94 77 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="sm-form-group">
                    <label htmlFor="sm-status">Initial Status</label>
                    <select
                      id="sm-status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as StaffStatus })
                      }
                    >
                      <option value="On Duty">On Duty</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="On Break">On Break</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sm-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="sm-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="sm-btn">
                  Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
