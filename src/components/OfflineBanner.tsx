import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

// A slim, non-sticky notice at the top of the app when the browser reports no
// connectivity. Deliberately not fixed/sticky -- it's informational, not a blocker, and
// keeping it in normal flow avoids fighting Header's own sticky positioning.
export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'rgba(255, 179, 0, 0.15)',
        borderBottom: '1px solid rgba(255, 179, 0, 0.3)',
        color: '#FFB300',
        fontSize: '0.82rem',
        fontWeight: '700',
      }}
    >
      <WifiOff size={15} />
      <span>You're offline — some features may be unavailable</span>
    </div>
  );
};
