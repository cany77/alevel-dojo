import { useEffect, useRef, useState } from "react";

function canUseMotion() {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasFinePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)").matches;
}

export function PublicScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maxScroll <= 4) {
        setVisible(false);
        setProgress(0);
        return;
      }
      setVisible(true);
      setProgress(Math.min(1, Math.max(0, window.scrollY / maxScroll)));
    };
    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, []);

  if (!visible) return null;
  return <div className="public-scroll-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>;
}

export function CursorGlow() {
  const glowRef = useRef(null);
  const frameRef = useRef(0);
  const pointRef = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const updateEnabled = () => setEnabled(canUseMotion() && hasFinePointer());
    updateEnabled();
    window.addEventListener("resize", updateEnabled);
    return () => window.removeEventListener("resize", updateEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const paint = () => {
      frameRef.current = 0;
      const node = glowRef.current;
      if (!node) return;
      node.style.setProperty("--cursor-x", `${pointRef.current.x}px`);
      node.style.setProperty("--cursor-y", `${pointRef.current.y}px`);
    };
    const move = (event) => {
      pointRef.current = { x: event.clientX, y: event.clientY };
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("pointermove", move);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={glowRef} className="public-cursor-glow" aria-hidden="true" />;
}


