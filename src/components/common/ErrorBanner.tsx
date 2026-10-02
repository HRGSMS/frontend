import type { FC } from 'react';
import { useState } from 'react';

export interface ErrorBannerProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorBanner: FC<ErrorBannerProps> = ({
  message,
  title = 'Error',
  onDismiss,
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !message) return null;

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-2">
          <span className="text-red-500 font-bold">⚠️</span>
          <div>
            {title && <h4 className="text-sm font-semibold">{title}</h4>}
            <p className="text-xs text-red-700 mt-0.5">{message}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-red-400 hover:text-red-600 transition-colors text-sm -mr-1 -mt-1 p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;
