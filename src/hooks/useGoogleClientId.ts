import { useEffect, useState } from 'react';
import { CLIENT_ID_STORAGE_KEY, ENV_GOOGLE_CLIENT_ID } from '@/domain/constants';

/** Client ID from `BUN_PUBLIC_GOOGLE_CLIENT_ID`, otherwise typed by the user and remembered in localStorage */
export function useGoogleClientId() {
  const [clientId, setClientId] = useState<string>(() => {
    if (ENV_GOOGLE_CLIENT_ID) return ENV_GOOGLE_CLIENT_ID;
    try {
      return localStorage.getItem(CLIENT_ID_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (!clientId || ENV_GOOGLE_CLIENT_ID) return;
    try {
      localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
    } catch {
      // Storage unavailable: the ID is simply not remembered
    }
  }, [clientId]);

  return { clientId, setClientId, isFromEnv: Boolean(ENV_GOOGLE_CLIENT_ID) };
}
