import { useState, useEffect, useRef } from 'react';

const BottomSheet = ({ isOpen, onClose, children, title }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = 'auto';
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const newY = e.touches[0].clientY;
    const deltaY = newY - startY;
    
    // Only allow dragging down
    if (deltaY > 0) {
      setCurrentY(newY);
      setTranslateY(deltaY);
      
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    
    // Close if dragged down more than 150px
    if (deltaY > 150) {
      onClose();
    } else {
      // Snap back to position
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
    setTranslateY(0);
  };

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${
        isOpen ? 'bg-black bg-opacity-50' : 'bg-transparent'
      }`}
    >
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`bg-slate-800 rounded-t-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl transition-all duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle Bar */}
        <div className="flex justify-center py-3 bg-slate-700 rounded-t-3xl">
          <div className="w-12 h-1 bg-slate-500 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-700 border-b border-slate-600">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-600 transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;