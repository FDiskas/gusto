import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 3200;

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((message: string) => {
    clearTimeout(hideTimer.current);
    setToast(message);
    hideTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return { toast, notify };
}
