'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TextChunk } from '@/lib/api/types';
import { CATEGORIES } from '@/lib/config/categories';
import { MoreVertical, Pin, PinOff } from 'lucide-react';

// Category data is now accessed directly from CATEGORIES array

interface SavedChunksProps {
  refreshTrigger?: number;
}

export function SavedChunks({ refreshTrigger }: SavedChunksProps) {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTogglePin = async (chunkId: string, currentlyPinned: boolean) => {
    try {
      const response = await fetch('/api/chunks/pin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chunkId, 
          pinned: !currentlyPinned 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update pin status');
      }

      // Refresh the chunks to show the updated pin status
      fetchChunks();
    } catch (error) {
      console.error('Error updating pin status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update pin status');
    }
  };

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
        {CATEGORIES.map((categoryConfig) => {
          const categoryChunks = groupedChunks[categoryConfig.key] || [];
          
          if (categoryChunks.length === 0) return null;
          
          return (
            <div key={categoryConfig.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={categoryConfig.color}>
                  {categoryConfig.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({categoryChunks.length})
                </span>
              </div>
              
              <div className="space-y-2">
                {categoryChunks.map((chunk) => (
                  <div key={chunk.id} className={`rounded-lg p-3 relative group ${
                    chunk.pinned 
                      ? 'bg-yellow-50 border-2 border-yellow-200' 
                      : 'bg-muted/50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2 pr-8">
                        {chunk.pinned && (
                          <Pin className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        )}
                        <p className="text-sm leading-relaxed">{chunk.content}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 absolute top-2 right-2"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => handleTogglePin(chunk.id!, chunk.pinned || false)}
                            className="cursor-pointer"
                          >
                            {chunk.pinned ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                Pin to top
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
