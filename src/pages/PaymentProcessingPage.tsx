import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CommonButton from '../components/common/Button';
import FormInput from '../components/common/FormInput';

export const PaymentProcessingPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingIdParam = searchParams.get('bookingId') || 'RES-4522';

  const [bookingId, setBookingId] = useState(bookingIdParam);
  const [amount, setAmount] = useState('18000');
  const [method, setMethod] = useState<'card' | 'cash' | 'transfer'>('card');
  const [paid, setPaid] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(val);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const rNo = `RCP-${Math.floor(100000 + Math.random() * 900000)}`;
    setReceiptNumber(rNo);
    setPaid(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Payment Processing</h1>
        <p className="text-xs text-gray-500 mt-1">
          Record cash, card, or transfer settlements against guest reservation folios.
        </p>
      </div>

      {paid ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-gray-900">Payment Processed Successfully</h2>
          <p className="text-sm text-gray-600">
            Receipt <strong>{receiptNumber}</strong> has been generated for reservation <strong>{bookingId}</strong>.
          </p>

          <div className="p-4 bg-gray-50 rounded-lg max-w-sm mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-bold text-gray-900">{formatCurrency(Number(amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-bold capitalize text-gray-900">{method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date & Time:</span>
              <span className="text-gray-900">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <CommonButton variant="outline" onClick={() => window.print()}>
              Print Receipt
            </CommonButton>
            <CommonButton onClick={() => navigate('/reservations/all')}>
              Back to Reservations
            </CommonButton>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Reservation ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="e.g. RES-4522"
              required
            />

            <FormInput
              label="Payment Amount (LKR)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['card', 'cash', 'transfer'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-3 px-4 rounded-lg border text-sm font-semibold capitalize transition-all ${
                      method === m
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {m === 'card' ? '💳 Credit Card' : m === 'cash' ? '💵 Cash' : '🏦 Bank Transfer'}
                  </button>
                ))}
              </div>
            </div>

            {method === 'card' && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-100">
                <FormInput label="Card Number" placeholder="4242 •••• •••• 4242" defaultValue="4242 •••• •••• 4242" />
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Expiry (MM/YY)" placeholder="12/28" defaultValue="12/28" />
                  <FormInput label="CVC" placeholder="123" defaultValue="888" />
                </div>
              </div>
            )}

            <div className="pt-2">
              <CommonButton type="submit" className="w-full">
                Settle Payment of {formatCurrency(Number(amount))}
              </CommonButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaymentProcessingPage;
