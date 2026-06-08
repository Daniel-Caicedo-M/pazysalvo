import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook que ejecuta una acción tras un período de inactividad del usuario.
 *
 * @param {function} onTimeout - callback al cumplir el timeout (típicamente logout)
 * @param {function} onWarning - callback opcional al acercarse el timeout
 * @param {number} timeoutMs - milisegundos de inactividad para disparar onTimeout
 * @param {number} warningMs - milisegundos antes del timeout para disparar onWarning
 * @param {boolean} enabled - si false, no escucha eventos
 */
export function useInactivityTimer({
  onTimeout,
  onWarning,
  timeoutMs = 15 * 60 * 1000,
  warningMs = 60 * 1000,
  enabled = true,
}) {
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (!enabled) return;
    if (onWarning && warningMs < timeoutMs) {
      warningRef.current = setTimeout(() => {
        onWarning(Math.floor((timeoutMs - warningMs) / 1000));
      }, timeoutMs - warningMs);
    }
    timeoutRef.current = setTimeout(onTimeout, timeoutMs);
  }, [onTimeout, onWarning, timeoutMs, warningMs, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const eventos = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    let throttleId = null;
    const handler = () => {
      if (throttleId) return;
      throttleId = setTimeout(() => { reset(); throttleId = null; }, 500);
    };
    eventos.forEach(e => window.addEventListener(e, handler, { passive: true }));
    reset();
    return () => {
      eventos.forEach(e => window.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (throttleId) clearTimeout(throttleId);
    };
  }, [reset, enabled]);

  return { reset };
}
