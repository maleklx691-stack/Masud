import React, { useEffect, useState } from 'react';

interface EntrySplashProps {
  onFinish?: () => void;
}

export const EntrySplash: React.FC<EntrySplashProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(false);

  useEffect(() => {
    // Fade out after 1.4s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1400);

    // Completely unmount after 1.9s
    const removeTimer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 1900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#07090e]/95 backdrop-blur-xl transition-opacity duration-500 select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radiant ambient glow */}
      <div className="absolute h-96 w-96 rounded-full bg-rose-600/20 blur-3xl pointer-events-none animate-pulse" />

      <div className="relative flex flex-col items-center gap-4 text-center">
        {/* Animated Brand Logo with glowing border */}
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden border-2 border-rose-500/80 bg-black p-1 shadow-[0_0_50px_rgba(225,29,72,0.7)] animate-bounce">
          <img
            src="/logo.jpg"
            alt="Aviator Logo"
            className="h-full w-full object-cover rounded-2xl"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-wider text-rose-500 font-numeric drop-shadow-[0_0_20px_rgba(225,29,72,0.6)]">
            AVIATOR PRO NEXTGEN
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-300">
            গেমিং পোর্টালে আপনাকে স্বাগতম...
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-48 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-3 border border-rose-500/30">
          <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 animate-pulse w-full rounded-full" />
        </div>
      </div>
    </div>
  );
};
