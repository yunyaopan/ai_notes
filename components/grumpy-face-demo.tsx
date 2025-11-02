'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GrumpyFaceSelector } from './grumpy-face-selector';

export function GrumpyFaceDemo() {
  const [selectedIntensity, setSelectedIntensity] = useState<'low' | 'medium' | 'high' | null>(null);

  const handleIntensitySelect = (intensity: 'low' | 'medium' | 'high') => {
    setSelectedIntensity(intensity);
  };

  const getIntensityColor = (intensity: 'low' | 'medium' | 'high') => {
    switch (intensity) {
      case 'low':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/30';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-900/30';
      case 'high':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/30';
      default:
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    }
  };

  const getIntensityDescription = (intensity: 'low' | 'medium' | 'high') => {
    switch (intensity) {
      case 'low':
        return 'You\'re feeling a bit down, but it\'s manageable';
      case 'medium':
        return 'You\'re experiencing moderate negative emotions';
      case 'high':
        return 'You\'re feeling quite overwhelmed or distressed';
      default:
        return 'Select an intensity level to see how you\'re feeling';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">How are you feeling?</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Click and hold on the grumpy face, then move your mouse to select intensity
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <GrumpyFaceSelector onSelect={handleIntensitySelect} />
        </div>

        {selectedIntensity && (
          <div className="space-y-3 p-4 border rounded-lg bg-secondary/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Selected Intensity:</span>
              <Badge className={getIntensityColor(selectedIntensity)}>
                {selectedIntensity.charAt(0).toUpperCase() + selectedIntensity.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {getIntensityDescription(selectedIntensity)}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>💡 Tip: The larger the grumpy face, the stronger the feeling</p>
        </div>
      </CardContent>
    </Card>
  );
}
