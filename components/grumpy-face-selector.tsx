'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface GrumpyFaceSelectorProps {
  onSelect?: (intensity: 'low' | 'medium' | 'high') => void;
  className?: string;
}

export function GrumpyFaceSelector({ onSelect, className = '' }: GrumpyFaceSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoveredIntensity, setHoveredIntensity] = useState<'low' | 'medium' | 'high' | null>(null);

  const handleFaceMouseDown = (intensity: 'low' | 'medium' | 'high') => {
    setIsSelecting(true);
    setHoveredIntensity(intensity);
  };

  const handleFaceMouseEnter = (intensity: 'low' | 'medium' | 'high') => {
    if (isSelecting) {
      setHoveredIntensity(intensity);
    }
  };

  const handleFaceMouseLeave = () => {
    if (isSelecting) {
      setHoveredIntensity(null);
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && hoveredIntensity) {
      onSelect?.(hoveredIntensity);
    }
    setIsSelecting(false);
    setHoveredIntensity(null);
  };

  const handleMouseLeave = () => {
    setIsSelecting(false);
    setHoveredIntensity(null);
  };

  // Touch handlers for mobile
  const handleFaceTouchStart = (intensity: 'low' | 'medium' | 'high') => {
    setIsSelecting(true);
    setHoveredIntensity(intensity);
  };

  const handleTouchEnd = () => {
    if (isSelecting && hoveredIntensity) {
      onSelect?.(hoveredIntensity);
    }
    setIsSelecting(false);
    setHoveredIntensity(null);
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
        className="cursor-pointer transition-transform hover:scale-105 active:scale-95 touch-none"
        onMouseDown={() => handleFaceMouseDown('medium')}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={() => handleFaceTouchStart('medium')}
        onTouchEnd={handleTouchEnd}
      >
        <GrumpyFace size={100} />
      </div>

      {/* Selection overlay using portal to render at document root */}
      {isSelecting && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex flex-col items-center space-y-6 max-w-sm w-full">
            {/* Instructions */}
            <div className="text-white text-center mb-4">
              <p className="text-lg font-medium">How strongly do you feel?</p>
              <p className="text-sm opacity-80">Drag to a face and release to select</p>
            </div>

            {/* Face selection area */}
            <div className="flex justify-center items-center w-full max-w-md mx-auto px-4 gap-4 sm:gap-8">
              {/* Low intensity - Left */}
              <div 
                className={`flex flex-col items-center transition-all duration-200 cursor-pointer ${
                  hoveredIntensity === 'low' ? 'scale-125' : 'scale-100'
                }`}
                onMouseEnter={() => handleFaceMouseEnter('low')}
                onMouseLeave={handleFaceMouseLeave}
                onTouchStart={() => handleFaceTouchStart('low')}
              >
                <div className={`p-2 sm:p-3 rounded-full ${hoveredIntensity === 'low' ? 'bg-white/30' : 'bg-white/10'}`}>
                  <GrumpyFace size={40} className="opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                  Low
                </div>
              </div>

              {/* Medium intensity - Center */}
              <div 
                className={`flex flex-col items-center transition-all duration-200 cursor-pointer ${
                  hoveredIntensity === 'medium' ? 'scale-125' : 'scale-100'
                }`}
                onMouseEnter={() => handleFaceMouseEnter('medium')}
                onMouseLeave={handleFaceMouseLeave}
                onTouchStart={() => handleFaceTouchStart('medium')}
              >
                <div className={`p-2 sm:p-3 rounded-full ${hoveredIntensity === 'medium' ? 'bg-white/30' : 'bg-white/10'}`}>
                  <GrumpyFace size={80} className="opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                  Medium
                </div>
              </div>

              {/* High intensity - Right */}
              <div 
                className={`flex flex-col items-center transition-all duration-200 cursor-pointer ${
                  hoveredIntensity === 'high' ? 'scale-125' : 'scale-100'
                }`}
                onMouseEnter={() => handleFaceMouseEnter('high')}
                onMouseLeave={handleFaceMouseLeave}
                onTouchStart={() => handleFaceTouchStart('high')}
              >
                <div className={`p-2 sm:p-3 rounded-full ${hoveredIntensity === 'high' ? 'bg-white/30' : 'bg-white/10'}`}>
                  <GrumpyFace size={160} className="opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                  High
                </div>
              </div>
            </div>

            {/* Selection indicator */}
            {hoveredIntensity && (
              <div className="text-white text-center">
                <p className="text-sm opacity-80">
                  Hovering: <span className="font-medium">{hoveredIntensity}</span>
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
