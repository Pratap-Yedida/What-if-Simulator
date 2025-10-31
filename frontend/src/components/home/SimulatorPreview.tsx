'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';

export function SimulatorPreview() {
  const [selectedGenre, setSelectedGenre] = useState('mystery');
  const [selectedCharacter, setSelectedCharacter] = useState('detective');

  const genres = [
    { id: 'mystery', name: 'Mystery', icon: 'search' },
    { id: 'fantasy', name: 'Fantasy', icon: 'star' },
    { id: 'sci-fi', name: 'Sci-Fi', icon: 'zap' },
    { id: 'romance', name: 'Romance', icon: 'heart' },
  ];

  const characters = [
    { id: 'detective', name: 'Detective' },
    { id: 'wizard', name: 'Wizard' },
    { id: 'scientist', name: 'Scientist' },
    { id: 'writer', name: 'Writer' },
  ];

  const samplePrompts = {
    mystery: [
      "What if the detective discovered they were investigating their own forgotten past?",
      "What if the murder weapon was something completely ordinary that everyone overlooked?",
      "What if the victim was actually alive and orchestrating their own disappearance?",
    ],
    fantasy: [
      "What if magic suddenly stopped working in the middle of a great battle?",
      "What if the wizard discovered their powers came from a source they morally opposed?",
      "What if dragons were actually trying to protect humans from a greater threat?",
    ],
    'sci-fi': [
      "What if the time machine only worked when the traveler was emotionally distressed?",
      "What if artificial intelligence developed the ability to dream?",
      "What if faster-than-light travel accidentally connected to parallel universes?",
    ],
    romance: [
      "What if the couple discovered they were characters in someone else's story?",
      "What if love could only exist between people who had never met before?",
      "What if every kiss transported the lovers to a different time period?",
    ],
  };

  return (
    <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Experience the AI Story Simulator
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            See how our AI generates infinite "What if" scenarios to spark your creativity
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Input Panel */}
          <Card className="glass-morphism border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon name="settings" className="h-5 w-5" />
                <span>Story Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Genre Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genre
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => setSelectedGenre(genre.id)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedGenre === genre.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon name={genre.icon as any} className="h-4 w-4" />
                        <span className="text-sm font-medium">{genre.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Character Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Main Character
                </label>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="input-field"
                >
                  {characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Event (Optional)
                </label>
                <Input
                  placeholder="e.g., discovers a mysterious letter"
                  className="w-full"
                />
              </div>

              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Icon name="zap" className="mr-2 h-4 w-4" />
                Generate What-If Prompts
              </Button>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="glass-morphism border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon name="book" className="h-5 w-5" />
                <span>Generated Prompts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {samplePrompts[selectedGenre as keyof typeof samplePrompts].map((prompt, index) => (
                <div
                  key={index}
                  className="prompt-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="shrink-0">
                      {selectedGenre}
                    </Badge>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Icon name="zap" className="h-3 w-3" />
                      <span>Impact: {(Math.random() * 0.3 + 0.7).toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {prompt}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Icon name="copy" className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Icon name="heart" className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button size="sm">
                      Use This Prompt
                    </Button>
                  </div>
                </div>
              ))}

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Try the full simulator for unlimited prompts and advanced features
                </p>
                <Button className="w-full" variant="outline">
                  <Icon name="arrow-right" className="mr-2 h-4 w-4" />
                  Open Full Simulator
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
