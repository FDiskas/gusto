import { useCallback, useState } from 'react';

const TOAST_DURATION_MS = 3200;

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), TOAST_DURATION_MS);
  }, []);

  return { toast, notify };
}
