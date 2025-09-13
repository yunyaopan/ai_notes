'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TextChunk } from '@/lib/api/types';
import { BreathingAnimation } from '@/components/breathing-animation';
import { GrumpyFaceSelector } from '@/components/grumpy-face-selector';

interface TextCategorizerProps {
  onSave?: (chunks: TextChunk[]) => void;
}


export function TextCategorizer({ onSave }: TextCategorizerProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBreathingAnimation, setShowBreathingAnimation] = useState(false);
  const [emotionalIntensity, setEmotionalIntensity] = useState<'low' | 'medium' | 'high' | null>(null);

  const handleEmotionalIntensitySelect = (intensity: 'low' | 'medium' | 'high') => {
    setEmotionalIntensity(intensity);
    
    // Add text to the beginning of the text area
    const intensityText = `I am feeling ${intensity} anxiety and worry about `;
    
    // If text is empty, just add the intensity text
    // If text already exists, prepend the intensity text with a space
    if (text.trim() === '') {
      setText(intensityText);
    } else {
      setText(intensityText + text);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert('Please enter some text.');
      return;
    }

    setIsProcessing(true);
    try {
      // First, categorize the text
      const categorizeResponse = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text.trim(),
          emotionalIntensity 
        }),
      });

      if (!categorizeResponse.ok) {
        const error = await categorizeResponse.json();
        throw new Error(error.error || 'Failed to categorize text');
      }

      const categorizeData = await categorizeResponse.json();
      const categorizedChunks = categorizeData.chunks;

      // Then immediately save the chunks
      const saveResponse = await fetch('/api/chunks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chunks: categorizedChunks }),
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || 'Failed to save chunks');
      }

      const saveData = await saveResponse.json();
      
      // Check if any chunks are worries_anxiety category
      const hasWorryChunks = categorizedChunks.some((chunk: { category: string }) => chunk.category === 'worries_anxiety');
      
      // Reset form
      setText('');
      setEmotionalIntensity(null);
      
      if (onSave) {
        onSave(saveData.chunks);
      }
      
      // Show breathing animation if there were worry/anxiety chunks
      if (hasWorryChunks) {
        setShowBreathingAnimation(true);
      }
    } catch (error) {
      console.error('Error processing text:', error);
      alert(error instanceof Error ? error.message : 'Failed to process text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBreathingComplete = () => {
    setShowBreathingAnimation(false);
  };


  return (
    <>
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Text Categorizer</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your thoughts and we&apos;ll categorize them into emotions, insights, gratitudes, worries, and more.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-input">Your Text</Label>
          <div className="relative">
            {/* Partially visible grumpy face behind text box */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-0 transition-all duration-300 group">
              <div className={`transition-all duration-300 ${emotionalIntensity ? 'translate-y-0' : 'translate-y-4'} group-hover:-translate-y-1`}>
                <GrumpyFaceSelector 
                  onSelect={handleEmotionalIntensitySelect}
                  className="flex-shrink-0"
                />
                <div className={`text-center mt-2 transition-opacity duration-300 ${emotionalIntensity ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {emotionalIntensity ? (
                    <Badge variant="secondary" className="text-xs">
                      {emotionalIntensity.charAt(0).toUpperCase() + emotionalIntensity.slice(1)} intensity
                    </Badge>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-white/90 px-2 py-1 rounded shadow-sm">
                      How are you feeling?
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your thoughts, feelings, insights, or concerns here..."
              className="w-full p-3 border rounded-md min-h-[200px] resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-10"
              disabled={isProcessing}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Current: {text.length} characters
          </p>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isProcessing || !text.trim()}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Submit'}
        </Button>

      </CardContent>
    </Card>
    {/* Breathing Animation */}
    {showBreathingAnimation && (
      <BreathingAnimation onComplete={handleBreathingComplete} />
    )}
    </>
  );
}
