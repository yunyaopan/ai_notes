'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TextChunk } from '@/lib/api/types';

interface IdeasPriorityOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: TextChunk[];
  onImportanceUpdate: (chunkId: string, importance: '1' | '2' | '3' | 'deprioritized' | null) => Promise<void>;
}

export function IdeasPriorityOverlay({ 
  isOpen, 
  onClose, 
  ideas, 
  onImportanceUpdate 
}: IdeasPriorityOverlayProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [localIdeas, setLocalIdeas] = useState<TextChunk[]>(ideas);

  // Update local ideas when props change
  useEffect(() => {
    setLocalIdeas(ideas);
  }, [ideas]);

  // Filter ideas by importance from local state
  const unrankedIdeas = localIdeas.filter(idea => !idea.importance);
  const topPriorityIdeas = localIdeas.filter(idea => idea.importance === '1').sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );
  const secondPriorityIdeas = localIdeas.filter(idea => idea.importance === '2').sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );
  const thirdPriorityIdeas = localIdeas.filter(idea => idea.importance === '3').sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );
  const deprioritizedIdeas = localIdeas.filter(idea => idea.importance === 'deprioritized').sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );

  const handleImportanceClick = async (chunkId: string, importance: '1' | '2' | '3' | 'deprioritized') => {
    setIsUpdating(chunkId);
    
    // Optimistically update local state immediately
    setLocalIdeas(prev => 
      prev.map(idea => 
        idea.id === chunkId 
          ? { ...idea, importance } 
          : idea
      )
    );

    try {
      // Call the parent's update function (but don't wait for page refresh)
      await onImportanceUpdate(chunkId, importance);
    } catch (error) {
      // If the API call fails, revert the optimistic update
      setLocalIdeas(prev => 
        prev.map(idea => 
          idea.id === chunkId 
            ? ideas.find(originalIdea => originalIdea.id === chunkId) || idea
            : idea
        )
      );
      console.error('Failed to update importance:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const ImportanceButtons = ({ chunk }: { chunk: TextChunk }) => (
    <div className="flex gap-1 mt-2">
      <Button
        size="sm"
        variant={chunk.importance === '1' ? 'default' : 'outline'}
        onClick={() => handleImportanceClick(chunk.id!, '1')}
        disabled={isUpdating === chunk.id}
        className="text-xs px-2 py-1 h-6"
      >
        #1
      </Button>
      <Button
        size="sm"
        variant={chunk.importance === '2' ? 'default' : 'outline'}
        onClick={() => handleImportanceClick(chunk.id!, '2')}
        disabled={isUpdating === chunk.id}
        className="text-xs px-2 py-1 h-6"
      >
        #2
      </Button>
      <Button
        size="sm"
        variant={chunk.importance === '3' ? 'default' : 'outline'}
        onClick={() => handleImportanceClick(chunk.id!, '3')}
        disabled={isUpdating === chunk.id}
        className="text-xs px-2 py-1 h-6"
      >
        #3
      </Button>
      <Button
        size="sm"
        variant={chunk.importance === 'deprioritized' ? 'default' : 'outline'}
        onClick={() => handleImportanceClick(chunk.id!, 'deprioritized')}
        disabled={isUpdating === chunk.id}
        className="text-xs px-2 py-1 h-6 text-gray-600"
      >
        Later
      </Button>
    </div>
  );

  const IdeaCard = ({ idea }: { idea: TextChunk }) => (
    <div key={idea.id} className="border rounded-lg p-3 bg-white space-y-2">
      <div className="text-sm">{idea.content}</div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {new Date(idea.created_at || '').toLocaleDateString()}
        </div>
        {idea.emotional_intensity && (
          <Badge variant="outline" className="text-xs">
            {idea.emotional_intensity} intensity
          </Badge>
        )}
      </div>
      <ImportanceButtons chunk={idea} />
    </div>
  );

  const PrioritySection = ({ 
    title, 
    ideas, 
    badgeVariant = 'default' 
  }: { 
    title: string; 
    ideas: TextChunk[];
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <Badge variant={badgeVariant} className="text-xs">
          {ideas.length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {ideas.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No ideas in this category</p>
        ) : (
          ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ideas Priority Manager</CardTitle>
            <Button variant="outline" onClick={onClose} className="text-sm">
              ✕ Close
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Organize your ideas by importance. Click the buttons to prioritize or deprioritize ideas.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Section 1: Unranked Ideas */}
          <PrioritySection 
            title="📝 Unranked Ideas" 
            ideas={unrankedIdeas}
            badgeVariant="outline"
          />

          {/* Section 2: Top 3 Priorities */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">🎯 Top Priorities</h3>
            
            <PrioritySection 
              title="🥇 #1 Priority" 
              ideas={topPriorityIdeas}
              badgeVariant="default"
            />
            
            <PrioritySection 
              title="🥈 #2 Priority" 
              ideas={secondPriorityIdeas}
              badgeVariant="secondary"
            />
            
            <PrioritySection 
              title="🥉 #3 Priority" 
              ideas={thirdPriorityIdeas}
              badgeVariant="secondary"
            />
          </div>

          {/* Section 3: Deprioritized */}
          <PrioritySection 
            title="📋 For Later" 
            ideas={deprioritizedIdeas}
            badgeVariant="outline"
          />
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
