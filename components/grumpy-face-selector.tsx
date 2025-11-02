'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

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

  const getImageSrc = (intensity: 'low' | 'medium' | 'high', transparent = false) => {
    const suffix = transparent ? '_t' : '';
    switch (intensity) {
      case 'low':
        return `/images/mild${suffix}.png`;
      case 'medium':
        return `/images/moderate${suffix}.png`;
      case 'high':
        return `/images/severe${suffix}.png`;
    }
  };

  const GrumpyFace = ({ intensity = 'medium', className = '', transparent = false }: { intensity?: 'low' | 'medium' | 'high'; className?: string; transparent?: boolean }) => (
    <Image
      src={getImageSrc(intensity, transparent)}
      alt={`Grumpy face - ${intensity} intensity`}
      width={200}
      height={200}
      className={`${className} rounded-full`}
      style={{ objectFit: 'cover' }}
    />
  );

  return (
    <div className={`relative ${className}`}>
      {/* Main grumpy face */}
      <div
        className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={handleMainFaceClick}
      >
        <GrumpyFace intensity="medium" className="w-[100px] h-[100px]" transparent={true} />
      </div>

      {/* Selection overlay using portal to render at document root */}
      {showSelector && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleOverlayClick}
        >
          <div 
            className="flex flex-col items-center space-y-6 sm:space-y-8 md:space-y-10 max-w-sm sm:max-w-2xl md:max-w-4xl w-full px-4"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on content
          >
            {/* Instructions */}
            <div className="text-white text-center mb-2 sm:mb-4">
              <p className="text-lg sm:text-xl md:text-2xl font-medium">Checking in with Grizzle</p>
              <p className="text-sm sm:text-base md:text-lg opacity-80 mt-1">Sometimes anxiety pops in for a quick hello — and that’s okay. Grizzle’s here to help you notice how big the storm feels right now.</p>
            </div>

            {/* Face selection area */}
            <div className="flex justify-center items-center w-full mx-auto px-2 sm:px-4 gap-4 sm:gap-6 md:gap-10 lg:gap-12 xl:gap-16 2xl:gap-20">
              {/* Low intensity - Left */}
              <button 
                className="flex flex-col items-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
                onClick={() => handleFaceSelect('low')}
              >
                <div className="rounded-full overflow-hidden">
                  <GrumpyFace intensity="low" className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] md:w-[180px] md:h-[180px] lg:w-[250px] lg:h-[250px] xl:w-[250px] xl:h-[250px] 2xl:w-[500px] 2xl:h-[500px] opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm md:text-base lg:text-lg mt-2 sm:mt-3 font-medium">
                  Low
                </div>
              </button>

              {/* Medium intensity - Center */}
              <button 
                className="flex flex-col items-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
                onClick={() => handleFaceSelect('medium')}
              >
                <div className="rounded-full overflow-hidden">
                  <GrumpyFace intensity="medium" className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] md:w-[180px] md:h-[180px] lg:w-[250px] lg:h-[250px] xl:w-[250px] xl:h-[250px] 2xl:w-[500px] 2xl:h-[500px] opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm md:text-base lg:text-lg mt-2 sm:mt-3 font-medium">
                  Medium
                </div>
              </button>

              {/* High intensity - Right */}
              <button 
                className="flex flex-col items-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
                onClick={() => handleFaceSelect('high')}
              >
                <div className="rounded-full overflow-hidden">
                  <GrumpyFace intensity="high" className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] md:w-[180px] md:h-[180px] lg:w-[250px] lg:h-[250px] xl:w-[250px] xl:h-[250px] 2xl:w-[500px] 2xl:h-[500px] opacity-90" />
                </div>
                <div className="text-center text-white text-xs sm:text-sm md:text-base lg:text-lg mt-2 sm:mt-3 font-medium">
                  High
                </div>
              </button>
            </div>

            {/* Help text */}
            <div className="text-white text-center">
              <p className="text-xs sm:text-sm md:text-base opacity-60">
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