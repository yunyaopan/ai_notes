'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { TextChunk } from '@/lib/api/types';
import { CATEGORIES } from '@/lib/config/categories';
import { MoreVertical, Pin, PinOff, ChevronDown, Clock, Tag, Edit, Trash2 } from 'lucide-react';
import { PriorityOverlay } from '@/components/priority-overlay';
import { isCategoryRankable, getRankableCategories } from '@/lib/config/categories';

// Category data is now accessed directly from CATEGORIES array

interface SavedChunksProps {
  refreshTrigger?: number;
}

type SortOption = 'category' | 'time';

export function SavedChunks({ refreshTrigger }: SavedChunksProps) {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [editingChunk, setEditingChunk] = useState<TextChunk | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [showPriorityOverlay, setShowPriorityOverlay] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

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

  const handleEditChunk = (chunk: TextChunk) => {
    setEditingChunk(chunk);
    setEditContent(chunk.content);
    setEditCategory(chunk.category);
  };

  const handleSaveEdit = async () => {
    if (!editingChunk || !editContent.trim()) return;
    
    try {
      const response = await fetch(`/api/chunks/${editingChunk.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
          category: editCategory
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update chunk');
      }

      // Close edit modal and refresh
      setEditingChunk(null);
      setEditContent('');
      setEditCategory('');
      fetchChunks();
    } catch (error) {
      console.error('Error updating chunk:', error);
      alert(error instanceof Error ? error.message : 'Failed to update chunk');
    }
  };

  const handleCancelEdit = () => {
    setEditingChunk(null);
    setEditContent('');
    setEditCategory('');
  };

  const handleDeleteChunk = async (chunkId: string) => {
    if (!confirm('Are you sure you want to delete this chunk? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/chunks/${chunkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete chunk');
      }

      // Refresh chunks after deletion
      fetchChunks();
    } catch (error) {
      console.error('Error deleting chunk:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete chunk');
    }
  };

  const handleImportanceUpdate = async (chunkId: string, importance: '1' | '2' | '3' | 'deprioritized' | null) => {
    try {
      // Update local state immediately for responsive UI
      setChunks(prev => 
        prev.map(chunk => 
          chunk.id === chunkId 
            ? { ...chunk, importance } 
            : chunk
        )
      );

      // Make API call in background
      const response = await fetch('/api/chunks/importance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chunkId, importance }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update importance');
      }

      // API call succeeded, state is already updated
    } catch (error) {
      console.error('Error updating importance:', error);
      alert(error instanceof Error ? error.message : 'Failed to update importance');
      
      // Revert the optimistic update on error
      fetchChunks();
    }
  };

  const handleCategoryClick = (categoryKey: string) => {
    if (isCategoryRankable(categoryKey)) {
      setSelectedCategory(categoryKey);
      setShowPriorityOverlay(true);
    }
  };

  const handleQuickCategoryChange = async (chunkId: string, newCategory: string) => {
    try {
      const response = await fetch(`/api/chunks/${chunkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: newCategory
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      // Update local state immediately for responsive UI
      setChunks(prev => 
        prev.map(chunk => 
          chunk.id === chunkId 
            ? { ...chunk, category: newCategory } 
            : chunk
        )
      );

      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert(error instanceof Error ? error.message : 'Failed to update category');
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

  // Sort and group chunks based on selected sort option
  const getSortedAndGroupedChunks = () => {
    if (sortBy === 'time') {
      // For time sorting, return all chunks in a single group sorted by time
      const sortedChunks = [...chunks].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Latest first
      });
      return { 'All Chunks': sortedChunks };
    } else {
      // For category sorting, group by category
      return chunks.reduce((acc, chunk) => {
        if (!acc[chunk.category]) {
          acc[chunk.category] = [];
        }
        acc[chunk.category].push(chunk);
        return acc;
      }, {} as Record<string, TextChunk[]>);
    }
  };

  const groupedChunks = getSortedAndGroupedChunks();

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Your Saved Chunks ({chunks.length})</CardTitle>
            <div className="flex gap-2">
              {getRankableCategories().map((category) => {
                const categoryChunks = chunks.filter(chunk => chunk.category === category.key);
                if (categoryChunks.length === 0) return null;
                
                return (
                  <Button
                    key={category.key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategoryClick(category.key)}
                    className="text-xs"
                  >
                    Review {category.label} ({categoryChunks.length})
                  </Button>
                );
              })}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {sortBy === 'category' ? (
                  <>
                    <Tag className="h-4 w-4" />
                    Sort by Category
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Sort by Time
                  </>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setSortBy('category')}
                className="cursor-pointer"
              >
                <Tag className="h-4 w-4 mr-2" />
                Sort by Category
                {sortBy === 'category' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('time')}
                className="cursor-pointer"
              >
                <Clock className="h-4 w-4 mr-2" />
                Sort by Time (Latest)
                {sortBy === 'time' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortBy === 'time' ? (
          // Time-based sorting: show all chunks in chronological order
          Object.entries(groupedChunks).map(([groupName, chunks]) => (
            <div key={groupName} className="space-y-3">
              <div className="space-y-2">
                {chunks.map((chunk) => {
                  const categoryConfig = CATEGORIES.find(cat => cat.key === chunk.category);
                  return (
                    <div key={chunk.id} className={`rounded-lg p-3 relative group ${
                      chunk.pinned 
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800/30' 
                        : 'bg-muted/50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2 pr-8">
                          {chunk.pinned && (
                            <Pin className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {editingCategory === chunk.id ? (
                                <select
                                  value={chunk.category}
                                  onChange={(e) => handleQuickCategoryChange(chunk.id!, e.target.value)}
                                  onBlur={() => setEditingCategory(null)}
                                  className="px-2 py-1 text-xs border rounded-md bg-background"
                                  autoFocus
                                >
                                  {CATEGORIES.map((category) => (
                                    <option key={category.key} value={category.key}>
                                      {category.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Badge 
                                  className={`${categoryConfig?.color || 'bg-gray-100 text-gray-800'} cursor-pointer hover:opacity-80`} 
                                  variant="outline"
                                  onClick={() => {
                                    if (isCategoryRankable(chunk.category)) {
                                      handleCategoryClick(chunk.category);
                                    } else {
                                      setEditingCategory(chunk.id!);
                                    }
                                  }}
                                >
                                  {categoryConfig?.label || chunk.category}
                                </Badge>
                              )}
                              {chunk.importance && (
                                <Badge variant="secondary" className="text-xs">
                                  {chunk.importance === 'deprioritized' ? 'Later' : `#${chunk.importance}`}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed">{chunk.content}</p>
                          </div>
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
                            <DropdownMenuItem
                              onClick={() => handleEditChunk(chunk)}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteChunk(chunk.id!)}
                              className="cursor-pointer text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          // Category-based sorting: show chunks grouped by category
          CATEGORIES.map((categoryConfig) => {
            const categoryChunks = groupedChunks[categoryConfig.key] || [];
            
            if (categoryChunks.length === 0) return null;
            
            return (
              <div key={categoryConfig.key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`${categoryConfig.color} ${
                      isCategoryRankable(categoryConfig.key) ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                    onClick={isCategoryRankable(categoryConfig.key) ? () => handleCategoryClick(categoryConfig.key) : undefined}
                  >
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
                      ? 'bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800/30' 
                      : 'bg-muted/50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2 pr-8">
                        {chunk.pinned && (
                          <Pin className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
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
                          <DropdownMenuItem
                            onClick={() => handleEditChunk(chunk)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteChunk(chunk.id!)}
                            className="cursor-pointer text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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
        })
        )}
      </CardContent>
      
      {/* Edit Modal */}
      {editingChunk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Chunk</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm min-h-[100px] resize-vertical mt-1"
                  placeholder="Edit your content..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm mt-1"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Overlay */}
      <PriorityOverlay
        isOpen={showPriorityOverlay}
        onClose={() => setShowPriorityOverlay(false)}
        categoryKey={selectedCategory}
        chunks={chunks.filter(chunk => chunk.category === selectedCategory)}
        onImportanceUpdate={handleImportanceUpdate}
      />
    </Card>
  );
}
