'use client';

import { useState, useRef, useEffect } from 'react';

interface GrumpyFaceSelectorProps {
  onSelect?: (intensity: 'low' | 'medium' | 'high') => void;
  className?: string;
}

export function GrumpyFaceSelector({ onSelect, className = '' }: GrumpyFaceSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<'low' | 'medium' | 'high' | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsSelecting(true);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectedIntensity) {
      onSelect?.(selectedIntensity);
      setSelectedIntensity(null);
    }
    setIsSelecting(false);
  };

  const handleMouseLeave = () => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectedIntensity(null);
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsSelecting(true);
    const touch = e.touches[0];
    setMousePosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSelecting) {
      e.preventDefault();
      const touch = e.touches[0];
      setMousePosition({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = () => {
    if (isSelecting && selectedIntensity) {
      onSelect?.(selectedIntensity);
      setSelectedIntensity(null);
    }
    setIsSelecting(false);
  };

  // Calculate which face is closest to mouse position
  useEffect(() => {
    if (!isSelecting || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const mouseX = mousePosition.x - rect.left;

    // Divide the container into three equal sections
    const sectionWidth = containerWidth / 3;
    
    if (mouseX < sectionWidth) {
      setSelectedIntensity('low');
    } else if (mouseX < sectionWidth * 2) {
      setSelectedIntensity('medium');
    } else {
      setSelectedIntensity('high');
    }
  }, [mousePosition, isSelecting]);

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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <GrumpyFace size={100} />
      </div>

      {/* Selection overlay */}
      {isSelecting && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 touch-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex flex-col items-center space-y-6 max-w-sm w-full">
            {/* Instructions */}
            <div className="text-white text-center mb-4">
              <p className="text-lg font-medium">How strongly do you feel?</p>
              <p className="text-sm opacity-80">Tap and hold, then move to select</p>
            </div>

            {/* Face selection area */}
            <div className="relative w-full h-48 flex items-center justify-center">
              {/* Low intensity (50% size) - Left */}
              <div className={`absolute left-0 transform -translate-y-1/2 transition-all duration-200 ${
                selectedIntensity === 'low' ? 'scale-110' : 'scale-100'
              }`}>
                <GrumpyFace size={60} className="opacity-80" />
                <div className="text-center text-white text-sm mt-2 font-medium">
                  Low
                </div>
              </div>

              {/* Medium intensity (100% size) - Center */}
              <div className={`absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                selectedIntensity === 'medium' ? 'scale-110' : 'scale-100'
              }`}>
                <GrumpyFace size={80} className="opacity-80" />
                <div className="text-center text-white text-sm mt-2 font-medium">
                  Medium
                </div>
              </div>

              {/* High intensity (150% size) - Right */}
              <div className={`absolute right-0 transform -translate-y-1/2 transition-all duration-200 ${
                selectedIntensity === 'high' ? 'scale-110' : 'scale-100'
              }`}>
                <GrumpyFace size={100} className="opacity-80" />
                <div className="text-center text-white text-sm mt-2 font-medium">
                  High
                </div>
              </div>
            </div>

            {/* Selection indicator */}
            {selectedIntensity && (
              <div className="text-white text-center">
                <p className="text-sm opacity-80">
                  Selected: <span className="font-medium">{selectedIntensity}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
