import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ children, content, position = 'right' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const offset = 10;

      let top = rect.top;
      let left = rect.left;

      switch (position) {
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + offset;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - offset;
          break;
        case 'top':
          top = rect.top - offset;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + offset;
          left = rect.left + rect.width / 2;
          break;
      }

      setTooltipPos({ top, left });
    }
  }, [isVisible, position]);

  const tooltipContent = isVisible && (
    <div
      className="fixed px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl whitespace-nowrap pointer-events-none"
      style={{
        top: tooltipPos.top,
        left: tooltipPos.left,
        zIndex: 99999,
        transform: position === 'right' ? 'translateY(-50%)' :
                  position === 'left' ? 'translate(-100%, -50%)' :
                  position === 'top' ? 'translate(-50%, -100%)' :
                  'translate(-50%, 0)'
      }}
      role="tooltip"
    >
      {content}
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
}
