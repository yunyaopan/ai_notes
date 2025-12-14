'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CharacterType = 'octupus' | 'yellow' | 'worm' | 'furry';
type Intensity = 'low' | 'medium' | 'high';

const CHARACTERS: CharacterType[] = ['octupus', 'yellow', 'worm', 'furry'];
const INTENSITIES: Intensity[] = ['low', 'medium', 'high'];

const getImageSrc = (character: CharacterType, intensity: Intensity) => {
  const suffix = intensity === 'low' ? '_i' : intensity === 'medium' ? '_m' : '_s';
  return `/images/monsters/${character}${suffix}.png`;
};

const getIntensityLabel = (intensity: Intensity) => {
  switch (intensity) {
    case 'low':
      return 'Mild';
    case 'medium':
      return 'Moderate';
    case 'high':
      return 'Severe';
  }
};

export default function AnxietyCharacterPage() {
  const router = useRouter();
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<CharacterType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCurrentCharacter();
  }, []);

  const fetchCurrentCharacter = async () => {
    try {
      const response = await fetch('/api/settings/anxiety-character');
      if (response.ok) {
        const data = await response.json();
        setCurrentCharacter(data.anxietyCharacter);
        setSelectedCharacter(data.anxietyCharacter);
      }
    } catch (error) {
      console.error('Error fetching current character:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCharacter) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/anxiety-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anxietyCharacter: selectedCharacter }),
      });

      if (response.ok) {
        setCurrentCharacter(selectedCharacter);
        router.push('/protected');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save character');
      }
    } catch (error) {
      console.error('Error saving character:', error);
      alert('Failed to save character. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Anxiety Character</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a character that represents your anxiety. Each character has three intensity levels
            (mild, moderate, severe) that will be displayed based on how you&apos;re feeling.
          </p>
          {currentCharacter && (
            <div className="mt-2">
              <Badge variant="secondary">
                Current: {currentCharacter.charAt(0).toUpperCase() + currentCharacter.slice(1)}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {CHARACTERS.map((character) => (
            <div
              key={character}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedCharacter === character
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {character}
                {selectedCharacter === character && (
                  <Badge variant="default" className="ml-2">Selected</Badge>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {INTENSITIES.map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => setSelectedCharacter(character)}
                    className={`flex flex-col items-center p-4 rounded-lg transition-all ${
                      selectedCharacter === character
                        ? 'bg-primary/10 hover:bg-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-2">
                      <Image
                        src={getImageSrc(character, intensity)}
                        alt={`${character} ${getIntensityLabel(intensity)}`}
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                    <span className="text-sm font-medium text-center">
                      {getIntensityLabel(intensity)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/protected')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedCharacter || isSaving || selectedCharacter === currentCharacter}
            >
              {isSaving ? 'Saving...' : 'Save Character'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

