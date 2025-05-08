import { useEffect, useState, useRef } from 'react';

export function getHeaderAnchors(): HTMLAnchorElement[] {
  return Array.prototype.filter.call(
    document.getElementsByClassName('toc-anchor'),
    function (testElement) {
      return ['H2', 'H3', 'H4'].includes(testElement.nodeName);
    }
  );
}

export function useActiveHeading() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headersAnchors = getHeaderAnchors();
    if (!headersAnchors.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Get all headers that are above the current scroll position
        const visibleHeaders = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({
            element: entry.target as HTMLAnchorElement,
            rect: entry.boundingClientRect,
          }))
          .filter(({ rect }) => rect.top <= 0) // Only consider headers that have scrolled past the top
          .sort((a, b) => b.rect.top - a.rect.top); // Sort by distance from top (descending)

        if (visibleHeaders.length > 0) {
          // Get the header that's closest to the top
          const closestHeader = visibleHeaders[0].element;
          const index = headersAnchors.indexOf(closestHeader);
          if (index !== -1) {
            setCurrentIndex(index);
          }
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      }
    );

    // Observe all header anchors
    headersAnchors.forEach((anchor) => {
      observerRef.current?.observe(anchor);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    currentIndex,
  };
}
