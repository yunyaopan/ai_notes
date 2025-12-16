'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TextChunk } from '@/lib/api/types';
import { CATEGORIES, getCategoryBadgeVariant } from '@/lib/config/categories';
import { Pin } from 'lucide-react';

interface PinnedChunkProps {
  refreshTrigger?: number;
}

export function PinnedChunk({ refreshTrigger }: PinnedChunkProps) {
  const [pinnedChunk, setPinnedChunk] = useState<TextChunk | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPinnedChunk = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chunks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chunks');
      }
      
      const data = await response.json();
      const chunks: TextChunk[] = data.chunks || [];
      
      // Find the pinned chunk
      const pinned = chunks.find(chunk => chunk.pinned);
      setPinnedChunk(pinned || null);
    } catch (error) {
      console.error('Error fetching pinned chunk:', error);
      setPinnedChunk(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPinnedChunk();
  }, [refreshTrigger]);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (!pinnedChunk) {
    return null; // Don't show anything if no pinned chunk
  }

  // Find the category configuration
  const categoryConfig = CATEGORIES.find(cat => cat.key === pinnedChunk.category);

  return (
    <Card className="w-full bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Pin className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getCategoryBadgeVariant(pinnedChunk.category)}>
                {categoryConfig?.label || pinnedChunk.category}
              </Badge>
              <span className="text-xs text-muted-foreground">Pinned</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {pinnedChunk.content}
            </p>
            {pinnedChunk.created_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(pinnedChunk.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
