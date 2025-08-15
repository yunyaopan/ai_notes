'use client';

import { useState } from "react";
import { TextCategorizer } from "@/components/text-categorizer";
import { SavedChunks } from "@/components/saved-chunks";
import { PinnedChunk } from "@/components/pinned-chunk";

export function ProtectedContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleChunksSaved = () => {
    // Trigger a refresh of the saved chunks component
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        <PinnedChunk refreshTrigger={refreshTrigger} />
        
        <div>
          <h1 className="font-bold text-3xl mb-2">AI Text Categorizer</h1>
          <p className="text-muted-foreground">
            Share your thoughts and let AI help organize them into meaningful categories.
          </p>
        </div>

        <TextCategorizer onSave={handleChunksSaved} />
        
        <SavedChunks refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
