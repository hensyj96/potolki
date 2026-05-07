import { useEffect, useRef, useState } from 'react';

type Options = {
  /** Total ms of inactivity before logout */
  timeout: number;
  /** ms before timeout to show warning */
  warningBefore?: number;
  /** Called when warning state should appear */
  onWarn?: () => void;
  /** Called when timeout is reached */
  onTimeout: () => void;
  /** Whether the timer is enabled */
  enabled?: boolean;
};

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export function useIdleTimer({
  timeout,
  warningBefore = 60_000,
  onWarn,
  onTimeout,
  enabled = true,
}: Options) {
  const [warning, setWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const warnTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);

  // Use refs for callbacks to avoid resetting timers on re-render
  const onWarnRef = useRef(onWarn);
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onWarnRef.current = onWarn;
    onTimeoutRef.current = onTimeout;
  }, [onWarn, onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      lastActivityRef.current = Date.now();
      setWarning(false);
      if (warnTimerRef.current !== null) window.clearTimeout(warnTimerRef.current);
      if (logoutTimerRef.current !== null) window.clearTimeout(logoutTimerRef.current);

      warnTimerRef.current = window.setTimeout(() => {
        setWarning(true);
        onWarnRef.current?.();
      }, Math.max(0, timeout - warningBefore));

      logoutTimerRef.current = window.setTimeout(() => {
        onTimeoutRef.current?.();
      }, timeout);
    };

    const handleActivity = () => {
      // Don't reset while warning is shown — user must explicitly extend
      if (!warning) reset();
    };

    reset();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (warnTimerRef.current !== null) window.clearTimeout(warnTimerRef.current);
      if (logoutTimerRef.current !== null) window.clearTimeout(logoutTimerRef.current);
    };
  }, [enabled, timeout, warningBefore, warning]);

  const extend = () => {
    setWarning(false);
    lastActivityRef.current = Date.now();
    if (warnTimerRef.current !== null) window.clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current !== null) window.clearTimeout(logoutTimerRef.current);
    warnTimerRef.current = window.setTimeout(() => {
      setWarning(true);
      onWarnRef.current?.();
    }, Math.max(0, timeout - warningBefore));
    logoutTimerRef.current = window.setTimeout(() => {
      onTimeoutRef.current?.();
    }, timeout);
  };

  return { warning, extend };
}
