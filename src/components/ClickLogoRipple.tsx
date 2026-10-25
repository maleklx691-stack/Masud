import React, { useEffect, useState } from 'react';

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

export const ClickLogoRipple: React.FC = () => {
  const [ripples, setRipples] = useState<ClickRipple[]>([]);

  useEffect(() => {
    const handleWindowClick = (e: MouseEvent) => {
      // Don't spawn if clicking outside viewport
      const x = e.clientX;
      const y = e.clientY;
      const id = Date.now() + Math.random();

      setRipples((prev) => [...prev.slice(-12), { id, x, y }]);

      // Remove ripple after 850ms animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 850);
    };

    window.addEventListener('click', handleWindowClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleWindowClick, { capture: true });
    };
  }, []);

  if (ripples.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 select-none animate-logo-pop flex items-center justify-center"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
        >
          {/* Outer glowing pulsing ring */}
          <div className="absolute h-14 w-14 rounded-full border-2 border-rose-500/60 bg-rose-500/20 blur-[2px] animate-ping" />

          {/* Logo Badge */}
          <div className="relative h-11 w-11 rounded-2xl overflow-hidden border-2 border-rose-400 bg-black/95 shadow-[0_0_20px_rgba(225,29,72,0.85)] flex items-center justify-center transform transition-transform">
            <img
              src="/logo.jpg"
              alt="Aviator Logo"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
