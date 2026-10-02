import type { FC } from 'react';
import { useState } from 'react';
import CommonButton from '../components/common/Button';
import FormInput from '../components/common/FormInput';

interface CheckItem {
  bookingId: string;
  guestName: string;
  idNumber: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'Confirmed' | 'CheckedIn' | 'CheckedOut';
  outstandingAmount: number;
}

const mockCheckList: CheckItem[] = [
  {
    bookingId: 'RES-4521',
    guestName: 'Nimal Perera',
    idNumber: '199245102948',
    roomNumber: '204',
    checkInDate: '2026-10-02',
    checkOutDate: '2026-10-05',
    status: 'Confirmed',
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4522',
    guestName: 'Anushka Fernando',
    idNumber: '199587401123',
    roomNumber: '108',
    checkInDate: '2026-10-02',
    checkOutDate: '2026-10-04',
    status: 'Confirmed',
    outstandingAmount: 18000,
  },
  {
    bookingId: 'RES-4501',
    guestName: 'Sanjeewa Herath',
    idNumber: '198421039841',
    roomNumber: '112',
    checkInDate: '2026-09-28',
    checkOutDate: '2026-10-02',
    status: 'CheckedIn',
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4503',
    guestName: 'Chamari Silva',
    idNumber: '199074128912',
    roomNumber: '207',
    checkInDate: '2026-09-29',
    checkOutDate: '2026-10-02',
    status: 'CheckedIn',
    outstandingAmount: 12500,
  },
];

export const CheckInOutPage: FC = () => {
  const [tab, setTab] = useState<'checkin' | 'checkout'>('checkin');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<CheckItem[]>(mockCheckList);
  const [verifiedIdMap, setVerifiedIdMap] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const filteredItems = items.filter((item) => {
    const matchesTab =
      tab === 'checkin' ? item.status === 'Confirmed' : item.status === 'CheckedIn';
    const matchesSearch =
      search.trim() === '' ||
      item.bookingId.toLowerCase().includes(search.toLowerCase()) ||
      item.guestName.toLowerCase().includes(search.toLowerCase()) ||
      item.roomNumber.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handlePerformCheckIn = (bookingId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.bookingId === bookingId ? { ...item, status: 'CheckedIn' } : item)),
    );
    setSuccessMessage(`Successfully checked in reservation ${bookingId}. Key card activated.`);
  };

  const handlePerformCheckOut = (bookingId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.bookingId === bookingId ? { ...item, status: 'CheckedOut' } : item)),
    );
    setSuccessMessage(
      `Successfully checked out reservation ${bookingId}. Room scheduled for housekeeping.`,
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-In & Check-Out Desk</h1>
        <p className="text-xs text-gray-500 mt-1">
          Perform guest identity verification, room assignment, key issuance, and checkout
          settlement.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs flex justify-between items-center">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setTab('checkin');
            setSearch('');
          }}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'checkin'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Check-In (Today's Arrivals)
        </button>
        <button
          onClick={() => {
            setTab('checkout');
            setSearch('');
          }}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'checkout'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Check-Out (Today's Departures)
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <FormInput
          placeholder="Search by Guest Name, Booking ID, or Room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Action Cards */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isVerified = verifiedIdMap[item.bookingId];
            const hasBalance = item.outstandingAmount > 0;

            return (
              <div
                key={item.bookingId}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-base">{item.guestName}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      Room {item.roomNumber}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Booking: {item.bookingId}</span>
                    <span>NIC/Passport: {item.idNumber}</span>
                    <span>
                      Stay: {item.checkInDate} → {item.checkOutDate}
                    </span>
                  </div>

                  {hasBalance && (
                    <div className="mt-2 text-xs font-semibold text-red-600">
                      Outstanding balance: LKR {item.outstandingAmount.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {tab === 'checkin' ? (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!isVerified}
                          onChange={(e) =>
                            setVerifiedIdMap((prev) => ({
                              ...prev,
                              [item.bookingId]: e.target.checked,
                            }))
                          }
                          className="rounded text-gray-900 focus:ring-gray-900"
                        />
                        ID Verified
                      </label>
                      <CommonButton
                        size="sm"
                        disabled={!isVerified}
                        onClick={() => handlePerformCheckIn(item.bookingId)}
                      >
                        Complete Check-In
                      </CommonButton>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {hasBalance ? (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          Payment required
                        </span>
                      ) : null}
                      <CommonButton
                        size="sm"
                        disabled={hasBalance}
                        onClick={() => handlePerformCheckOut(item.bookingId)}
                      >
                        Complete Check-Out
                      </CommonButton>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
            No {tab === 'checkin' ? 'arrivals' : 'departures'} matching criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInOutPage;
