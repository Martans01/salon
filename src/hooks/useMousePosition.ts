'use client';

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export function useMousePosition(containerRef: RefObject<HTMLElement | null>): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const isTouchDevice = useRef(false);
  const rafId = useRef<number>(0);

  useEffect(() => {
    isTouchDevice.current =
      typeof window !== 'undefined' &&
      (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isTouchDevice.current || !containerRef.current) return;

      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const rect = containerRef.current!.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        setPosition({ x, y });
      });
    },
    [containerRef]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || isTouchDevice.current) return;

    el.addEventListener('mousemove', handleMouseMove);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [containerRef, handleMouseMove]);

  return position;
}
