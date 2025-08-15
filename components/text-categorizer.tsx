'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TextChunk } from '@/lib/api/types';
import { CATEGORIES, getCategoryLabels, getCategoryColors } from '@/lib/config/categories';
import { BreathingAnimation } from '@/components/breathing-animation';
import { GrumpyFaceSelector } from '@/components/grumpy-face-selector';

interface TextCategorizerProps {
  onSave?: (chunks: TextChunk[]) => void;
}

// Get category data from config
const categoryLabels = getCategoryLabels();
const categoryColors = getCategoryColors();

export function TextCategorizer({ onSave }: TextCategorizerProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunks, setChunks] = useState<Omit<TextChunk, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    if (!text.trim() || text.length < 10) {
      alert('Please enter at least 10 characters of text.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text.trim(),
          emotionalIntensity 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to categorize text');
      }

      const data = await response.json();
      setChunks(data.chunks);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error categorizing text:', error);
      alert(error instanceof Error ? error.message : 'Failed to categorize text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/chunks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chunks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save chunks');
      }

      const data = await response.json();
      
      // Check if any chunks are worries_anxiety category
      const hasWorryChunks = chunks.some(chunk => chunk.category === 'worries_anxiety');
      
      // Reset form
      setText('');
      setChunks([]);
      setShowConfirmation(false);
      setEmotionalIntensity(null);
      
      if (onSave) {
        onSave(data.chunks);
      }
      
      // Show breathing animation if there were worry/anxiety chunks
      if (hasWorryChunks) {
        setShowBreathingAnimation(true);
      } else {
        alert('Text chunks saved successfully!');
      }
    } catch (error) {
      console.error('Error saving chunks:', error);
      alert(error instanceof Error ? error.message : 'Failed to save chunks. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBreathingComplete = () => {
    setShowBreathingAnimation(false);
    alert('Text chunks saved successfully! Take care of yourself. 💙');
  };

  const handleEdit = () => {
    setShowConfirmation(false);
  };

  const updateChunk = (index: number, field: 'content' | 'category', value: string) => {
    const updatedChunks = [...chunks];
    updatedChunks[index] = { ...updatedChunks[index], [field]: value };
    setChunks(updatedChunks);
  };

  const removeChunk = (index: number) => {
    const updatedChunks = chunks.filter((_, i) => i !== index);
    setChunks(updatedChunks);
  };

  if (showConfirmation) {
    return (
      <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Confirm Categorization</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and edit the categorized chunks below. You can modify the text or change categories.
          </p>
          {emotionalIntensity && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Emotional Intensity: {emotionalIntensity.charAt(0).toUpperCase() + emotionalIntensity.slice(1)}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {chunks.map((chunk, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={chunk.category}
                  onChange={(e) => updateChunk(index, 'category', e.target.value as TextChunk['category'])}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.key} value={category.key}>{category.label}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeChunk(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </Button>
              </div>
              <textarea
                value={chunk.content}
                onChange={(e) => updateChunk(index, 'content', e.target.value)}
                className="w-full p-2 border rounded-md text-sm min-h-[80px] resize-vertical"
                placeholder="Chunk content..."
              />
              <div className="flex gap-2 flex-wrap">
                <Badge className={categoryColors[chunk.category]}>
                  {categoryLabels[chunk.category]}
                </Badge>
                {chunk.emotional_intensity && (
                  <Badge variant="outline" className="text-xs">
                    {chunk.emotional_intensity} intensity
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          {chunks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No chunks to display. Please go back and try again.
            </p>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleEdit} variant="outline" className="flex-1">
              Edit Text
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isSaving || chunks.length === 0}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Chunks'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Breathing Animation */}
      {showBreathingAnimation && (
        <BreathingAnimation onComplete={handleBreathingComplete} />
      )}
      </>
    );
  }

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
            Minimum 10 characters required. Current: {text.length}
          </p>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isProcessing || text.length < 10}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Categorize Text'}
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
