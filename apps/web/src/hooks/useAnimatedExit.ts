import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook that delays unmounting a component so an exit animation can play.
 *
 * Usage:
 *   const { isOpen, isClosing, close } = useAnimatedExit(visible, 250);
 *   if (!isOpen) return null;
 *   return <div className={isClosing ? "animate-fade-out" : "animate-fade-in"}>...</div>;
 */
export function useAnimatedExit(visible: boolean, exitDurationMs: number = 250) {
  const [isOpen, setIsOpen] = useState(visible);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<number | null>(null);

  const close = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    timerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, exitDurationMs);
  }, [exitDurationMs, isClosing]);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsClosing(false);
      setIsOpen(true);
    } else if (isOpen && !isClosing) {
      close();
    }
  }, [visible, isOpen, isClosing, close]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { isOpen, isClosing, close };
}
