'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TextChunk } from '@/lib/api/types';

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

interface SavedChunksProps {
  refreshTrigger?: number;
}

export function SavedChunks({ refreshTrigger }: SavedChunksProps) {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChunks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/chunks');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chunks');
      }
      
      const data = await response.json();
      setChunks(data.chunks || []);
    } catch (error) {
      console.error('Error fetching chunks:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch chunks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChunks();
  }, [refreshTrigger]);

  const groupedChunks = chunks.reduce((acc, chunk) => {
    if (!acc[chunk.category]) {
      acc[chunk.category] = [];
    }
    acc[chunk.category].push(chunk);
    return acc;
  }, {} as Record<string, TextChunk[]>);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading your saved chunks...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chunks.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Saved Chunks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No chunks saved yet. Use the text categorizer above to get started!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Saved Chunks ({chunks.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(categoryLabels).map(([category, label]) => {
          const categoryChunks = groupedChunks[category] || [];
          
          if (categoryChunks.length === 0) return null;
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                  {label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({categoryChunks.length})
                </span>
              </div>
              
              <div className="space-y-2">
                {categoryChunks.map((chunk) => (
                  <div key={chunk.id} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm leading-relaxed">{chunk.content}</p>
                    {chunk.created_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(chunk.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
