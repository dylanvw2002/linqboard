import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY.current;
        
        // Show when scrolling down and intersecting
        if (entry.isIntersecting && isScrollingDown) {
          setIsVisible(true);
          hasBeenVisible.current = true;
        }
        
        // Only hide when scrolling up AND not intersecting anymore (past it)
        if (!entry.isIntersecting && !isScrollingDown && hasBeenVisible.current) {
          setIsVisible(false);
          hasBeenVisible.current = false;
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
