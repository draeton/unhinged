import { useEffect, useState } from 'react';

// Tracks browser connectivity via navigator.onLine, kept in sync with the
// online/offline window events. Note navigator.onLine is a network-interface signal
// (is there a link at all), not a guarantee that any particular request will succeed --
// it can't detect a captive portal or a reachable-but-down server -- but it's the
// standard, zero-cost signal for "show an offline indicator."
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
