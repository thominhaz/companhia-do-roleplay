import { useEffect, useState, useCallback, RefObject } from "react";

interface ParallaxOptions {
  speed?: number; // 0 to 1, where 0.5 is half the scroll speed
  direction?: "up" | "down";
  maxOffset?: number; // Maximum offset in pixels
}

export function useParallax(
  ref: RefObject<HTMLElement>,
  options: ParallaxOptions = {}
) {
  const { speed = 0.3, direction = "up", maxOffset = 100 } = options;
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate how much the element is visible
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const distanceFromCenter = elementCenter - viewportCenter;
    
    // Calculate parallax offset
    let parallaxOffset = distanceFromCenter * speed;
    
    // Apply direction
    if (direction === "down") {
      parallaxOffset = -parallaxOffset;
    }
    
    // Clamp to max offset
    parallaxOffset = Math.max(-maxOffset, Math.min(maxOffset, parallaxOffset));
    
    setOffset(parallaxOffset);
  }, [ref, speed, direction, maxOffset]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return offset;
}

// Simple hook for scroll-based opacity
export function useScrollFade(
  ref: RefObject<HTMLElement>,
  fadeDistance: number = 200
) {
  const [opacity, setOpacity] = useState(1);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const fadeStart = 0;
    const fadeEnd = -fadeDistance;
    
    if (rect.top >= fadeStart) {
      setOpacity(1);
    } else if (rect.top <= fadeEnd) {
      setOpacity(0);
    } else {
      const progress = (fadeStart - rect.top) / (fadeStart - fadeEnd);
      setOpacity(1 - progress);
    }
  }, [ref, fadeDistance]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return opacity;
}

// Hook for scroll-based scale
export function useScrollScale(
  ref: RefObject<HTMLElement>,
  options: { minScale?: number; scaleDistance?: number } = {}
) {
  const { minScale = 0.95, scaleDistance = 150 } = options;
  const [scale, setScale] = useState(1);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const scaleStart = 0;
    const scaleEnd = -scaleDistance;
    
    if (rect.top >= scaleStart) {
      setScale(1);
    } else if (rect.top <= scaleEnd) {
      setScale(minScale);
    } else {
      const progress = (scaleStart - rect.top) / (scaleStart - scaleEnd);
      setScale(1 - progress * (1 - minScale));
    }
  }, [ref, minScale, scaleDistance]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return scale;
}