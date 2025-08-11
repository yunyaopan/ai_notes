'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TextChunk } from '@/lib/api/types';

interface TextCategorizerProps {
  onSave?: (chunks: TextChunk[]) => void;
}

const categoryLabels = {
  other_emotions: 'Other Emotions',
  insights: 'Insights',
  gratitudes: 'Gratitudes',
  worries_anxiety: 'Worries & Anxiety',
  other: 'Other'
};

const categoryColors = {
  other_emotions: 'bg-blue-100 text-blue-800',
  insights: 'bg-green-100 text-green-800',
  gratitudes: 'bg-yellow-100 text-yellow-800',
  worries_anxiety: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
};

export function TextCategorizer({ onSave }: TextCategorizerProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunks, setChunks] = useState<Omit<TextChunk, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        body: JSON.stringify({ text: text.trim() }),
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
      
      // Reset form
      setText('');
      setChunks([]);
      setShowConfirmation(false);
      
      if (onSave) {
        onSave(data.chunks);
      }
      
      alert('Text chunks saved successfully!');
    } catch (error) {
      console.error('Error saving chunks:', error);
      alert(error instanceof Error ? error.message : 'Failed to save chunks. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Confirm Categorization</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and edit the categorized chunks below. You can modify the text or change categories.
          </p>
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
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
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
              <Badge className={categoryColors[chunk.category]}>
                {categoryLabels[chunk.category]}
              </Badge>
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
    );
  }

  return (
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
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts, feelings, insights, or concerns here..."
            className="w-full p-3 border rounded-md min-h-[200px] resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
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

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Categories:</strong></p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Badge key={key} variant="outline" className={categoryColors[key as keyof typeof categoryColors]}>
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
