import { useEffect, useState, useRef } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  enabled?: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  enabled = true,
}: UseIntersectionObserverProps = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const unobserve = () => {
    if (observer.current && observerRef.current) {
      observer.current.unobserve(observerRef.current);
    }
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Cleanup previous observer
    unobserve();

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

    return () => {
      unobserve();
    };
  }, [threshold, root, rootMargin, enabled]);

  return { entry, observerRef };
}
