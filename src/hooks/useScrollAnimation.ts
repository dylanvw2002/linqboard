import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY.current;
        
        // Only show when scrolling down and intersecting
        // Hide when scrolling up or not intersecting
        if (entry.isIntersecting && isScrollingDown) {
          setIsVisible(true);
        } else if (!entry.isIntersecting || !isScrollingDown) {
          setIsVisible(false);
        }
        
        lastScrollY.current = currentScrollY;
      },
      {
        threshold,
        rootMargin: '50px',
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};
