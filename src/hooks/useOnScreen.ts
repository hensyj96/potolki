import { useEffect, useRef, useState } from 'react';

/**
 * Returns true once the element has entered the viewport.
 * Stays true after first intersection (useful for lazy load).
 */
export function useOnScreen<T extends Element = HTMLDivElement>(
  options: IntersectionObserverInit = { rootMargin: '200px' }
) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      options
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [seen, options]);

  return { ref, seen };
}
