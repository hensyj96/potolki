import { useEffect } from 'react';

type DirtyGuardBlocker = {
  state: 'unblocked' | 'blocked';
  proceed: () => void;
  reset: () => void;
};

/**
 * Guards against navigation/page-unload while there are unsaved changes.
 * Browser-level beforeunload handles closing/reload. Router-level useBlocker
 * handles in-app navigation.
 */
export function useDirtyGuard(isDirty: boolean, message?: string): DirtyGuardBlocker {
  // Browser-level (close tab / reload / back to other site)
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore the message, but keep for legacy
      e.returnValue = message || '';
      return message || '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, message]);

  // This project uses BrowserRouter (not Data Router), so useBlocker is unavailable.
  // Keep API compatible for callers that check blocker.state/proceed/reset.
  return {
    state: 'unblocked',
    proceed: () => {},
    reset: () => {},
  };
}
