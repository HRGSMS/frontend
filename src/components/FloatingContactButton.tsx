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
    <aside aria-label="Direct Customer Hotline" className="fixed bottom-6 right-6 z-50 flex items-center">
      <a
        href={`tel:${phoneNumber}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center gap-3 rounded-full bg-[#1b3b38] px-4 py-3 text-white shadow-2xl ring-2 ring-[#c5a86a] transition-all duration-300 hover:scale-105 hover:bg-[#122826] hover:shadow-[0_0_25px_rgba(197,168,106,0.5)] focus:outline-none focus:ring-4 focus:ring-[#c5a86a]/50"
        title={`Call Hotel Support: ${phoneNumber}`}
      >
        {/* Pulsing indicator ring */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c5a86a] opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-[#c5a86a]"></span>
        </span>

        {/* Telephone icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a86a] text-[#1b3b38] transition-transform group-hover:rotate-12">
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col text-left pr-2">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-[#e4d4aa]">
            {label}
          </span>
          <span className="font-mono text-sm font-bold tracking-wider text-white">
            {phoneNumber}
          </span>
        </div>

        {/* Hover tooltip */}
        {isHovered && (
          <div
            role="tooltip"
            className="absolute -top-10 right-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white shadow-lg"
          >
            Tap to call directly ({phoneNumber})
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
