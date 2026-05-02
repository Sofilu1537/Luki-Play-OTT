import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, AppState } from 'react-native';

export const INACTIVITY_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 horas
const WARN_BEFORE_MS = 60 * 1000; // 60 s antes del logout

const WEB_ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
] as const;

/**
 * Cierra la sesión automáticamente tras un período de inactividad.
 *
 * Web:    escucha eventos DOM del usuario para resetear el timer.
 * Native: usa AppState para detectar cuánto tiempo lleva la app en background.
 *
 * Muestra una advertencia WARN_BEFORE_MS antes del logout para que el usuario
 * pueda confirmar que sigue activo.
 */
export function useInactivityTimeout(
  onTimeout: () => void,
  enabled = true,
  timeoutMs = INACTIVITY_TIMEOUT_MS,
) {
  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);

  const clearAllTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    logoutTimerRef.current = null;
    warnTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearAllTimers();
    setWarningVisible(false);

    warnTimerRef.current = setTimeout(() => {
      let s = Math.round(WARN_BEFORE_MS / 1000);
      setSecondsLeft(s);
      setWarningVisible(true);
      countdownRef.current = setInterval(() => {
        s -= 1;
        setSecondsLeft(s);
        if (s <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }, 1000);
    }, timeoutMs - WARN_BEFORE_MS);

    logoutTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setWarningVisible(false);
      onTimeoutRef.current();
    }, timeoutMs);
  }, [enabled, timeoutMs, clearAllTimers]);

  // Web: resetea el timer en cada evento de actividad del usuario
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;
    resetTimer();
    const handler = () => resetTimer();
    WEB_ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      clearAllTimers();
      WEB_ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handler));
    };
  }, [enabled, resetTimer, clearAllTimers]);

  // Native: si el tiempo en background supera el timeout, cierra sesión al volver
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    resetTimer();
    let backgroundedAt = 0;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt = Date.now();
      } else if (state === 'active') {
        if (backgroundedAt > 0 && Date.now() - backgroundedAt >= timeoutMs) {
          clearAllTimers();
          onTimeoutRef.current();
        } else {
          resetTimer();
        }
        backgroundedAt = 0;
      }
    });
    return () => {
      clearAllTimers();
      sub.remove();
    };
  }, [enabled, timeoutMs, resetTimer, clearAllTimers]);

  return { warningVisible, secondsLeft, resetTimer };
}
