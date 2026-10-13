import React, { useState } from 'react';

interface FloatingContactButtonProps {
  /** Phone number to call. If empty string, button is not rendered. */
  phoneNumber?: string;
  /** Accessible label shown on hover tooltip and inside the button. */
  label?: string;
}

export const FloatingContactButton: React.FC<FloatingContactButtonProps> = ({
  phoneNumber,
  label = '24/7 Hotel Hotline',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Do not render if no phone number is available
  if (!phoneNumber) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(phoneNumber);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <aside aria-label="Direct Customer Hotline" className="fixed bottom-5 right-5 z-40 flex items-center">
      {/* ── In-App Application Notification ── */}
      {isNotificationOpen && (
        <div
          role="region"
          aria-label="Hotel Hotline Notification"
          className="fixed bottom-20 right-5 z-50 w-80 sm:w-96 rounded-2xl bg-[#00152f] text-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-[#c5a86a] animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5a86a]">
                Hotel Concierge Notification
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsNotificationOpen(false)}
              className="text-white/60 hover:text-white text-base leading-none p-1 rounded-md hover:bg-white/10 transition"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>

          {/* Body Content */}
          <div className="mt-3.5 space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-white">
                SkyNest 24/7 Guest Assistance Hotline
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Our front desk and concierge team are on standby 24 hours daily for room reservations, housekeeping, and immediate guest inquiries.
              </p>
            </div>

            {/* Hotline display card */}
            <div className="bg-[#08203e] rounded-xl p-3 border border-[#c5a86a]/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c5a86a] text-[#00152f]">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#c5a86a] block">
                    Direct Hotline
                  </span>
                  <span className="font-mono text-base font-bold text-white tracking-wider">
                    {phoneNumber}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#c5a86a] hover:bg-[#d8be82] text-[#00152f]'
                }`}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>

            {copied && (
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                <span>✓</span> Hotline number copied to clipboard.
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-slate-400">
                Front desk status: <strong className="text-emerald-400">Available</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(false)}
                className="text-xs text-[#c5a86a] hover:underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trigger Button (In-app toggle, does not launch OS browser protocol) ── */}
      <button
        type="button"
        onClick={() => setIsNotificationOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center gap-3 rounded-full bg-[#00152f] px-4 py-2.5 text-white shadow-xl border border-[#c5a86a]/40 transition-all duration-300 hover:scale-105 hover:bg-[#08203e] hover:border-[#c5a86a] hover:shadow-[0_8px_30px_rgba(0,21,47,0.35)] focus:outline-none focus:ring-2 focus:ring-[#c5a86a] cursor-pointer"
        title="View 24/7 Hotel Hotline concierge details"
        aria-expanded={isNotificationOpen}
      >
        {/* Telephone icon badge */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c5a86a] text-[#00152f] shadow-sm transition-transform group-hover:rotate-12">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
          </svg>
        </div>

        {/* Text Details */}
        <div className="flex flex-col text-left pr-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[9.5px] font-bold tracking-widest uppercase text-[#e4d4aa]">
              {label || '24/7 Hotel Hotline'}
            </span>
          </div>
          <span className="font-mono text-xs font-bold tracking-wider text-white">
            {phoneNumber}
          </span>
        </div>

        {/* Hover tooltip */}
        {isHovered && !isNotificationOpen && (
          <div
            role="tooltip"
            className="absolute -top-9 right-0 whitespace-nowrap rounded-md bg-[#00152f] border border-[#c5a86a]/40 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg pointer-events-none"
          >
            Direct Hotel Concierge ({phoneNumber})
          </div>
        )}
      </button>
    </aside>
  );
};

/** Wrapper that fetches the hotline number from hotel-config and renders the button. */
import { useEffect } from 'react';
import { guestApi } from '../api/guestApi';

export const FloatingContactButtonAuto: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [btnLabel, setBtnLabel] = useState('24/7 Hotel Hotline');

  useEffect(() => {
    guestApi.getHotelConfig().then((cfg) => {
      if (cfg.hotline_number) setPhone(cfg.hotline_number);
      if (cfg.hotline_label) setBtnLabel(cfg.hotline_label);
    }).catch(() => { /* silently ignore — button just won't show */ });
  }, []);

  return <FloatingContactButton phoneNumber={phone} label={btnLabel} />;
};

export default FloatingContactButton;
