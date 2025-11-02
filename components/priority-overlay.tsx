'use client';

import React, { useState, useEffect } from 'react';
import { TextChunk } from '@/lib/api/types';
import { CATEGORIES } from '@/lib/config/categories';
import { X, Star, StarOff, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PriorityOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  categoryKey: string;
  chunks: TextChunk[];
  onImportanceUpdate: (chunkId: string, importance: '1' | '2' | '3' | 'deprioritized' | null) => Promise<void>;
}

export function PriorityOverlay({ 
  isOpen, 
  onClose, 
  categoryKey,
  chunks, 
  onImportanceUpdate 
}: PriorityOverlayProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [localChunks, setLocalChunks] = useState<TextChunk[]>(chunks);

  // Update local chunks when props change
  useEffect(() => {
    setLocalChunks(chunks);
  }, [chunks]);

  // Get category configuration
  const categoryConfig = CATEGORIES.find(cat => cat.key === categoryKey);
  const categoryLabel = categoryConfig?.label || categoryKey;

  // Filter chunks by importance from local state
  const unrankedChunks = localChunks.filter(chunk => !chunk.importance);
  const topPriorityChunks = localChunks.filter(chunk => chunk.importance === '1').sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );
  const secondPriorityChunks = localChunks.filter(chunk => chunk.importance === '2').sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );
  const thirdPriorityChunks = localChunks.filter(chunk => chunk.importance === '3').sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );
  const deprioritizedChunks = localChunks.filter(chunk => chunk.importance === 'deprioritized').sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );

  const handleImportanceClick = async (chunkId: string, importance: '1' | '2' | '3' | 'deprioritized' | null) => {
    setIsUpdating(chunkId);
    
    // Optimistically update local state immediately
    setLocalChunks(prev => 
      prev.map(chunk => 
        chunk.id === chunkId 
          ? { ...chunk, importance } 
          : chunk
      )
    );

    try {
      // Call the parent's update function (but don't wait for page refresh)
      await onImportanceUpdate(chunkId, importance);
    } catch (error) {
      // If the API call fails, revert the optimistic update
      setLocalChunks(prev => 
        prev.map(chunk => 
          chunk.id === chunkId 
            ? chunks.find(originalChunk => originalChunk.id === chunkId) || chunk
            : chunk
        )
      );
      console.error('Failed to update importance:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const ImportanceButtons = ({ chunk }: { chunk: TextChunk }) => (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant={chunk.importance === '1' ? 'default' : 'outline'}
        onClick={() => handleImportanceClick(chunk.id!, chunk.importance === '1' ? null : '1')}
        disabled={isUpdating === chunk.id}
        className="h-6 px-2 text-xs"
      >
        1
      </Button>
      <Button
        size="sm"
        variant={chunk.importance === '2' ? 'default' : 'outline'}
        onClick={() => handleImportanceClick(chunk.id!, chunk.importance === '2' ? null : '2')}
        disabled={isUpdating === chunk.id}
        className="h-6 px-2 text-xs"
      >
        2
      </Button>
      <Button
        size="sm"
        variant={chunk.importance === '3' ? 'default' : 'outline'}
        onClick={() => handleImportanceClick(chunk.id!, chunk.importance === '3' ? null : '3')}
        disabled={isUpdating === chunk.id}
        className="h-6 px-2 text-xs"
      >
        3
      </Button>
      <Button
        size="sm"
        variant={chunk.importance === 'deprioritized' ? 'destructive' : 'outline'}
        onClick={() => handleImportanceClick(chunk.id!, chunk.importance === 'deprioritized' ? null : 'deprioritized')}
        disabled={isUpdating === chunk.id}
        className="h-6 px-2 text-xs"
      >
        Later
      </Button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card text-card-foreground rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Priority for {categoryLabel}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Top Priority */}
            {topPriorityChunks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-medium text-yellow-700 dark:text-yellow-400">Top Priority</h3>
                  <Badge variant="outline" className="text-xs">{topPriorityChunks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {topPriorityChunks.map((chunk) => (
                    <div key={chunk.id} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm">{chunk.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(chunk.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ImportanceButtons chunk={chunk} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Second Priority */}
            {secondPriorityChunks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-orange-500" />
                  <h3 className="font-medium text-orange-700 dark:text-orange-400">Second Priority</h3>
                  <Badge variant="outline" className="text-xs">{secondPriorityChunks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {secondPriorityChunks.map((chunk) => (
                    <div key={chunk.id} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm">{chunk.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(chunk.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ImportanceButtons chunk={chunk} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Third Priority */}
            {thirdPriorityChunks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium text-blue-700 dark:text-blue-400">Third Priority</h3>
                  <Badge variant="outline" className="text-xs">{thirdPriorityChunks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {thirdPriorityChunks.map((chunk) => (
                    <div key={chunk.id} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm">{chunk.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(chunk.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ImportanceButtons chunk={chunk} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deprioritized */}
            {deprioritizedChunks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <StarOff className="h-4 w-4 text-gray-500" />
                  <h3 className="font-medium text-gray-700 dark:text-gray-400">Deprioritized</h3>
                  <Badge variant="outline" className="text-xs">{deprioritizedChunks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {deprioritizedChunks.map((chunk) => (
                    <div key={chunk.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{chunk.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(chunk.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ImportanceButtons chunk={chunk} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unranked */}
            {unrankedChunks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <h3 className="font-medium text-gray-700 dark:text-gray-400">Unranked</h3>
                  <Badge variant="outline" className="text-xs">{unrankedChunks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {unrankedChunks.map((chunk) => (
                    <div key={chunk.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm">{chunk.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(chunk.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ImportanceButtons chunk={chunk} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {localChunks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No {categoryLabel.toLowerCase()} found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
