"use client";

import { useState } from "react";
import { TextCategorizer } from "@/components/text-categorizer";
import { SavedChunks } from "@/components/saved-chunks";
import { PinnedChunk } from "@/components/pinned-chunk";
import { NotesReviewButton } from "@/components/notes-review-button";

export function ProtectedContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleChunksSaved = () => {
    // Trigger a refresh of the saved chunks component
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0">
      <PinnedChunk refreshTrigger={refreshTrigger} />

      <TextCategorizer onSave={handleChunksSaved} />

      <SavedChunks refreshTrigger={refreshTrigger} />

      <NotesReviewButton />
    </div>
  );
}
