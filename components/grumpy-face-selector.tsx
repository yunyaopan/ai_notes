'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface GrumpyFaceSelectorProps {
  onSelect?: (intensity: 'low' | 'medium' | 'high') => void;
  className?: string;
}

export function GrumpyFaceSelector({ onSelect, className = '' }: GrumpyFaceSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);

  const handleMainFaceClick = () => {
    setShowSelector(true);
  };

  const handleFaceSelect = (intensity: 'low' | 'medium' | 'high') => {
    onSelect?.(intensity);
    setShowSelector(false);
  };

  const handleOverlayClick = () => {
    setShowSelector(false);
  };

  const GrumpyFace = ({ size = 100, className = '' }: { size?: number; className?: string }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main face shape */}
      <path d="M60 60 Q40 60 40 80 Q30 100 30 110 Q30 120 40 140 Q40 160 60 160 Q80 170 100 160 Q120 170 140 160 Q160 160 160 140 Q170 120 170 110 Q170 100 160 80 Q160 60 140 60 Q120 50 100 60 Q80 50 60 60 Z" fill="#FFA500" stroke="none"/>
      
      {/* Hair/eyebrow strokes on top */}
      <path d="M60 45 Q80 35 100 45" stroke="#2C2C2C" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M100 45 Q120 35 140 45" stroke="#2C2C2C" strokeWidth="3" fill="none" strokeLinecap="round"/>
      
      {/* Glasses frame */}
      <circle cx="75" cy="90" r="18" fill="none" stroke="#2C2C2C" strokeWidth="2.5"/>
      <circle cx="125" cy="90" r="18" fill="none" stroke="#2C2C2C" strokeWidth="2.5"/>
      
      {/* Glasses bridge */}
      <line x1="93" y1="90" x2="107" y2="90" stroke="#2C2C2C" strokeWidth="2.5"/>
      
      {/* Eyes (pupils) */}
      <circle cx="75" cy="90" r="4" fill="#2C2C2C"/>
      <circle cx="125" cy="90" r="4" fill="#2C2C2C"/>
      
      {/* Sad mouth */}
      <path d="M85 130 Q100 120 115 130" stroke="#2C2C2C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Main grumpy face */}
      <div
        className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={handleMainFaceClick}
      >
        <GrumpyFace size={100} />
      </div>

      {/* Selection overlay using portal to render at document root */}
      {showSelector && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleOverlayClick}
        >
          <div 
            className="flex flex-col items-center space-y-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on content
          >
            {/* Instructions */}
            <div className="text-white text-center mb-4">
              <p className="text-lg font-medium">How strongly do you feel?</p>
              <p className="text-sm opacity-80">Tap a face to select intensity</p>
            </div>

            {/* Face selection area */}
            <div className="flex justify-center items-center w-full max-w-md mx-auto px-4 gap-4 sm:gap-8">
              {/* Low intensity - Left */}
              <button 
                className="flex flex-col items-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
                onClick={() => handleFaceSelect('low')}
              >
                <div className="p-4 sm:p-6 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30">
                  <GrumpyFace size={40} className="opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                  Low
                </div>
              </button>

              {/* Medium intensity - Center */}
              <button 
                className="flex flex-col items-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
                onClick={() => handleFaceSelect('medium')}
              >
                <div className="p-4 sm:p-6 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30">
                  <GrumpyFace size={80} className="opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                  Medium
                </div>
              </button>

              {/* High intensity - Right */}
              <button 
                className="flex flex-col items-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
                onClick={() => handleFaceSelect('high')}
              >
                <div className="p-4 sm:p-6 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30">
                  <GrumpyFace size={160} className="opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                  High
                </div>
              </button>
            </div>

            {/* Help text */}
            <div className="text-white text-center">
              <p className="text-xs opacity-60">
                Tap outside to close
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}