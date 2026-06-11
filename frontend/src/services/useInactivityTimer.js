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
  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);
  const firedRef = useRef(false);

  const reset = useCallback(() => {
    lastActivityRef.current = Date.now();
    warnedRef.current = false;
    firedRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    reset();

    // Registrar actividad del usuario (throttle 500ms)
    const eventos = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    let throttleId = null;
    const handler = () => {
      if (throttleId) return;
      throttleId = setTimeout(() => {
        // Solo resetea si el aviso no está visible (el modal decide con sus botones)
        if (!warnedRef.current) lastActivityRef.current = Date.now();
        throttleId = null;
      }, 500);
    };
    eventos.forEach(e => window.addEventListener(e, handler, { passive: true }));

    // Verificación periódica basada en timestamp — funciona aunque la pestaña
    // haya estado en background, porque compara contra la hora real
    const check = () => {
      if (firedRef.current) return;
      const inactivoMs = Date.now() - lastActivityRef.current;

      if (inactivoMs >= timeoutMs) {
        firedRef.current = true;
        onTimeout();
        return;
      }
      if (onWarning && !warnedRef.current && inactivoMs >= timeoutMs - warningMs) {
        warnedRef.current = true;
        const restantes = Math.max(1, Math.floor((timeoutMs - inactivoMs) / 1000));
        onWarning(restantes);
      }
    };

    const intervalId = setInterval(check, 1000);

    // Al volver a la pestaña, verificar inmediatamente
    // (cubre el caso de pestañas suspendidas donde el interval no corrió)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      eventos.forEach(e => window.removeEventListener(e, handler));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(intervalId);
      if (throttleId) clearTimeout(throttleId);
    };
  }, [reset, enabled, onTimeout, onWarning, timeoutMs, warningMs]);

  return { reset };
}
