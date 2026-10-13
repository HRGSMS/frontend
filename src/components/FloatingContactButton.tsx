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

  // Do not render if no phone number is available
  if (!phoneNumber) return null;

  return (
    <aside aria-label="Direct Customer Hotline" className="fixed bottom-5 right-5 z-40 flex items-center">
      <a
        href={`tel:${phoneNumber}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center gap-3 rounded-full bg-[#00152f] px-4 py-2.5 text-white shadow-xl border border-[#c5a86a]/40 transition-all duration-300 hover:scale-105 hover:bg-[#08203e] hover:border-[#c5a86a] hover:shadow-[0_8px_30px_rgba(0,21,47,0.35)] focus:outline-none focus:ring-2 focus:ring-[#c5a86a]"
        title={`Call Hotel Support: ${phoneNumber}`}
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
        {isHovered && (
          <div
            role="tooltip"
            className="absolute -top-9 right-0 whitespace-nowrap rounded-md bg-[#00152f] border border-[#c5a86a]/40 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg"
          >
            Direct Hotel Concierge ({phoneNumber})
          </div>
        )}
      </a>
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
