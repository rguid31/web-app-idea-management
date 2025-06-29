import { useState, useRef, useCallback } from 'react';

const useSwipe = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const [startX, setStartX] = useState(null);
  const [startY, setStartY] = useState(null);
  const [currentX, setCurrentX] = useState(null);
  const [isSwipingHorizontal, setIsSwipingHorizontal] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setCurrentX(touch.clientX);
    setIsSwipingHorizontal(false);
    setSwipeDistance(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!startX || !startY) return;

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    const diffX = currentX - startX;
    const diffY = currentY - startY;
    
    // Determine if this is a horizontal swipe
    if (!isSwipingHorizontal && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      setIsSwipingHorizontal(true);
    }
    
    if (isSwipingHorizontal) {
      // Prevent vertical scrolling during horizontal swipe
      e.preventDefault();
      setCurrentX(currentX);
      setSwipeDistance(diffX);
      
      // Add visual feedback by transforming the element
      if (elementRef.current) {
        const opacity = Math.max(0.3, 1 - Math.abs(diffX) / 200);
        const transform = `translateX(${diffX * 0.3}px)`;
        elementRef.current.style.transform = transform;
        elementRef.current.style.opacity = opacity;
        
        // Add color feedback based on swipe direction
        if (diffX > threshold) {
          elementRef.current.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Green for upvote
        } else if (diffX < -threshold) {
          elementRef.current.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; // Red for downvote
        }
      }
    }
  }, [startX, startY, isSwipingHorizontal, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!startX || !isSwipingHorizontal) {
      resetSwipe();
      return;
    }

    const diffX = swipeDistance;

    // Reset visual state
    if (elementRef.current) {
      elementRef.current.style.transform = '';
      elementRef.current.style.opacity = '';
      elementRef.current.style.backgroundColor = '';
    }

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diffX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    resetSwipe();
  }, [startX, isSwipingHorizontal, swipeDistance, threshold, onSwipeLeft, onSwipeRight]);

  const resetSwipe = useCallback(() => {
    setStartX(null);
    setStartY(null);
    setCurrentX(null);
    setIsSwipingHorizontal(false);
    setSwipeDistance(0);
  }, []);

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    ref: elementRef
  };

  return {
    ...swipeHandlers,
    isSwipingHorizontal,
    swipeDistance
  };
};

export default useSwipe;