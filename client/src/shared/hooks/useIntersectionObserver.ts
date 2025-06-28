import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverParams {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  enabled?: boolean;
}

export const useIntersectionObserver = ({
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  enabled = true,
}: UseIntersectionObserverParams = {}) => {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const cleanup = () => {
    if (observer.current && observerRef.current) {
      observer.current.unobserve(observerRef.current);
    }
    if (observer.current) {
      observer.current.disconnect();
    }
  };

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    cleanup();

    observer.current = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
      },
      {
        threshold,
        root,
        rootMargin,
      },
    );

    if (observerRef.current) {
      observer.current.observe(observerRef.current);
    }

    return cleanup;
  }, [threshold, root, rootMargin, enabled]);

  return { entry, observerRef };
};
