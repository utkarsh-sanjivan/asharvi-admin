import { useEffect, useRef, useState } from 'react';

const useRateLimitCountdown = () => {
  const [retryMs, setRetryMs] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (retryMs === null) return undefined;
    const startedAt = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, retryMs - elapsed);
      const seconds = Math.ceil(remainingMs / 1000);
      setSecondsRemaining(seconds);
      if (remainingMs <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [retryMs]);

  const start = (ms) => {
    const safeMs = typeof ms === 'number' && ms >= 0 ? ms : 15000;
    setRetryMs(safeMs);
  };

  const reset = () => {
    setRetryMs(null);
    setSecondsRemaining(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const canRetry = secondsRemaining === null || secondsRemaining <= 0;

  return {
    secondsRemaining: secondsRemaining || 0,
    isActive: retryMs !== null,
    start,
    reset,
    canRetry,
  };
};

export default useRateLimitCountdown;
