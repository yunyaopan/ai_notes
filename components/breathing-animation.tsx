'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface BreathingAnimationProps {
  onComplete: () => void;
}

export function BreathingAnimation({ onComplete }: BreathingAnimationProps) {
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [animationProgress, setAnimationProgress] = useState(0); // 0 to 1

  useEffect(() => {
    if (currentCycle >= 5) {
      onComplete();
      return;
    }

    let duration = 4000; // Default inhale duration
    let animationSteps = 60; // 60fps animation
    
    switch (phase) {
      case 'inhale':
        duration = 4000; // 4 seconds
        animationSteps = 240; // 240 steps over 4 seconds (60fps)
        break;
      case 'hold':
        duration = 2000; // 2 seconds
        animationSteps = 1; // No animation needed
        break;
      case 'exhale':
        duration = 6000; // 6 seconds
        animationSteps = 360; // 360 steps over 6 seconds (60fps)
        break;
      case 'pause':
        duration = 2000; // 2 seconds
        animationSteps = 1; // No animation needed
        break;
    }

    // Handle smooth animations for inhale and exhale
    if (phase === 'inhale' || phase === 'exhale') {
      const stepDuration = duration / animationSteps;
      let currentStep = 0;
      
      const animationTimer = setInterval(() => {
        currentStep++;
        const progress = currentStep / animationSteps;
        setAnimationProgress(progress);
        
        if (currentStep >= animationSteps) {
          clearInterval(animationTimer);
          // Move to next phase
          switch (phase) {
            case 'inhale':
              setPhase('hold');
              setAnimationProgress(1);
              break;
            case 'exhale':
              setPhase('pause');
              setAnimationProgress(0);
              break;
          }
        }
      }, stepDuration);

      return () => clearInterval(animationTimer);
    } else {
      // For hold and pause phases, just wait and move to next phase
      const timer = setTimeout(() => {
        switch (phase) {
          case 'hold':
            setPhase('exhale');
            setAnimationProgress(0);
            break;
          case 'pause':
            setCurrentCycle((prev) => prev + 1);
            setPhase('inhale');
            setAnimationProgress(0);
            break;
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [phase, currentCycle, onComplete]);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'pause':
        return 'Pause';
    }
  };

  const getCircleSize = () => {
    const minSize = 80;
    const maxSize = 224;
    
    switch (phase) {
      case 'inhale':
        // Smoothly grow from minSize to maxSize
        const inhaleSize = minSize + (maxSize - minSize) * animationProgress;
        return `${inhaleSize}px`;
      case 'hold':
        return '224px'; // Stay at max size
      case 'exhale':
        // Smoothly shrink from maxSize to minSize
        const exhaleSize = maxSize - (maxSize - minSize) * animationProgress;
        return `${exhaleSize}px`;
      case 'pause':
        return '80px'; // Stay at min size
    }
  };



  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">
                      It&apos;s just a passing wave of emotion—let it rise and fall. Breathe, and let your breath carry you through. 
          </h3>
          
          <div className="flex flex-col items-center space-y-6">
            {/* Breathing Circles */}
            <div className="relative flex items-center justify-center w-64 h-64">
              {/* Outer dimmer circle - always visible */}
              <div className="w-56 h-56 rounded-full bg-gradient-to-br from-blue-300/40 to-blue-500/40 border-2 border-blue-300/30" />
              
              {/* Inner animated circle - grows and shrinks */}
              <div 
                className="absolute rounded-full bg-gradient-to-br from-blue-400 to-blue-600"
                style={{
                  width: getCircleSize(),
                  height: getCircleSize(),
                }}
              />
              
              {/* Center text overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {getPhaseText()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Instructions and Progress */}
            <div className="space-y-2">
              <p className="text-gray-600 text-sm">
                {phase === 'inhale' && 'Slowly breathe in through your nose'}
              {phase === 'hold' && 'Hold your breath gently'}
              {phase === 'exhale' && 'Slowly breathe out through your mouth'}
              {phase === 'pause' && 'Rest and prepare for the next breath'}
              </p>
              
              <div className="flex items-center justify-center space-x-2">
                <span className="text-gray-500 text-sm">Cycle {currentCycle + 1} of 5</span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i <= currentCycle ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Skip button */}
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-gray-600 text-sm underline mt-4"
            >
              Skip breathing exercise
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
