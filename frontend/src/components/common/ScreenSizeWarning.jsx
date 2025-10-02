import { useState, useEffect } from 'react';

export default function ScreenSizeWarning({ children }) {
  const [warningMessage, setWarningMessage] = useState(null);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / height;

      // Detect zoom level
      const zoomLevel = Math.round((window.devicePixelRatio || 1) * 100);

      // Define acceptable aspect ratio range
      const minRatio = 1140 / 1030; // approximately 1.107
      const maxRatio = 3.0; // Ultra-wide screens (e.g., 32:9 = 3.56, 21:9 = 2.33)
      const minAspectRatio = 0.5; // Super tall screens

      // Check zoom level (100% is default, allow 80% to 120%)
      if (zoomLevel < 80 || zoomLevel > 120) {
        setWarningMessage({
          title: 'Zoom Level Not Supported',
          message: 'Sorry, your current browser zoom level is not supported by our platform.',
          detail: `Your zoom is set to ${zoomLevel}%. Please reset your browser zoom to 100% (press Ctrl+0 or Cmd+0).`
        });
      } else if (ratio < minRatio) {
        setWarningMessage({
          title: 'Screen Too Narrow',
          message: 'Sorry, your device screen resolution is not supported by our platform for now.',
          detail: 'Please use a device with a wider screen or rotate your device to landscape mode.'
        });
      } else if (ratio > maxRatio) {
        setWarningMessage({
          title: 'Screen Too Wide',
          message: 'Sorry, your ultra-wide screen resolution is not supported by our platform for now.',
          detail: 'Please resize your browser window to a standard aspect ratio or use a different display.'
        });
      } else if (ratio < minAspectRatio) {
        setWarningMessage({
          title: 'Screen Too Tall',
          message: 'Sorry, your device screen resolution is not supported by our platform for now.',
          detail: 'Please use a device with a standard aspect ratio or rotate your device.'
        });
      } else {
        setWarningMessage(null);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (warningMessage) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-custom-bg">
        <div className="text-center px-8 max-w-2xl animate-fade-in">
          <div className="text-8xl mb-6 animate-float">⚠️</div>
          <h1 className="text-3xl font-bold text-primary mb-4">
            {warningMessage.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {warningMessage.message}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            {warningMessage.detail}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
