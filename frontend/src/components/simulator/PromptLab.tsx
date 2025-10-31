'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

interface SimulatorParameters {
  character?: { name: string; traits: string[] };
  setting?: { era?: string; place?: string; mood?: string };
  event?: string;
  genre?: string;
  tone?: string;
  constraints?: {
    length_target?: string;
    vocabulary_level?: string;
    banned_content?: string[];
    educational_goals?: string[];
  };
  mode?: 'logical' | 'creative' | 'balanced';
  audience_age?: string;
  theme_keywords?: string[];
}

interface PromptLabProps {
  parameters: SimulatorParameters;
  onParametersChange: (parameters: SimulatorParameters) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function PromptLab({ parameters, onParametersChange, onGenerate, isGenerating }: PromptLabProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  const [characterTraits, setCharacterTraits] = useState<string[]>(parameters.character?.traits || []);
  const [newTrait, setNewTrait] = useState('');
  const [themeKeywords, setThemeKeywords] = useState<string[]>(parameters.theme_keywords || []);
  const [newKeyword, setNewKeyword] = useState('');

  const updateParameter = (key: keyof SimulatorParameters, value: any) => {
    onParametersChange({ ...parameters, [key]: value });
  };

  const updateCharacter = (updates: Partial<{ name: string; traits: string[] }>) => {
    const character = { ...parameters.character, ...updates };
    updateParameter('character', character);
  };

  const updateSetting = (updates: Partial<{ era?: string; place?: string; mood?: string }>) => {
    const setting = { ...parameters.setting, ...updates };
    updateParameter('setting', setting);
  };

  const updateConstraints = (updates: Partial<SimulatorParameters['constraints']>) => {
    const constraints = { ...parameters.constraints, ...updates };
    updateParameter('constraints', constraints);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const addCharacterTrait = () => {
    if (newTrait.trim() && !characterTraits.includes(newTrait.trim())) {
      const updatedTraits = [...characterTraits, newTrait.trim()];
      setCharacterTraits(updatedTraits);
      updateCharacter({ traits: updatedTraits });
      setNewTrait('');
    }
  };

  const removeCharacterTrait = (trait: string) => {
    const updatedTraits = characterTraits.filter(t => t !== trait);
    setCharacterTraits(updatedTraits);
    updateCharacter({ traits: updatedTraits });
  };

  const addThemeKeyword = () => {
    if (newKeyword.trim() && !themeKeywords.includes(newKeyword.trim())) {
      const updatedKeywords = [...themeKeywords, newKeyword.trim()];
      setThemeKeywords(updatedKeywords);
      updateParameter('theme_keywords', updatedKeywords);
      setNewKeyword('');
    }
  };

  const removeThemeKeyword = (keyword: string) => {
    const updatedKeywords = themeKeywords.filter(k => k !== keyword);
    setThemeKeywords(updatedKeywords);
    updateParameter('theme_keywords', updatedKeywords);
  };

  const resetParameters = () => {
    const resetParams: SimulatorParameters = { mode: 'balanced' };
    onParametersChange(resetParams);
    setCharacterTraits([]);
    setThemeKeywords([]);
  };

  const genres = [
    'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 
    'Horror', 'Adventure', 'Historical Fiction', 'Contemporary', 'Comedy'
  ];

  const tones = [
    'Light-hearted', 'Serious', 'Dark', 'Humorous', 'Mysterious', 
    'Romantic', 'Suspenseful', 'Melancholy', 'Optimistic', 'Satirical'
  ];

  const audienceAges = ['All Ages', '10-12', '13-15', '16-18', '18+', 'Mature (21+)'];

  const sections = [
    {
      id: 'basic',
      title: 'Basic Parameters',
      icon: 'settings',
      content: (
        <div className="space-y-4">
          {/* Generation Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Generation Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['logical', 'creative', 'balanced'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateParameter('mode', mode)}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg border transition-colors',
                    parameters.mode === mode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genre
            </label>
            <select
              value={parameters.genre || ''}
              onChange={(e) => updateParameter('genre', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select genre...</option>
              {genres.map((genre) => (
                <option key={genre} value={genre.toLowerCase().replace(/\s+/g, '-')}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tone
            </label>
            <select
              value={parameters.tone || ''}
              onChange={(e) => updateParameter('tone', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select tone...</option>
              {tones.map((tone) => (
                <option key={tone} value={tone.toLowerCase().replace(/\s+/g, '-')}>
                  {tone}
                </option>
              ))}
            </select>
          </div>

          {/* Current Event */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Event
            </label>
            <Input
              value={parameters.event || ''}
              onChange={(e) => updateParameter('event', e.target.value || undefined)}
              placeholder="e.g., discovers a mysterious letter, hears strange sounds..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'character',
      title: 'Character Details',
      icon: 'user',
      content: (
        <div className="space-y-4">
          {/* Character Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Character Name
            </label>
            <Input
              value={parameters.character?.name || ''}
              onChange={(e) => updateCharacter({ name: e.target.value || undefined })}
              placeholder="e.g., detective, wizard, protagonist..."
            />
          </div>

          {/* Character Traits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Character Traits
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={newTrait}
                  onChange={(e) => setNewTrait(e.target.value)}
                  placeholder="e.g., brave, curious, stubborn..."
                  onKeyPress={(e) => e.key === 'Enter' && addCharacterTrait()}
                />
                <Button onClick={addCharacterTrait} size="sm">
                  <Icon name="plus" className="h-4 w-4" />
                </Button>
              </div>
              {characterTraits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {characterTraits.map((trait) => (
                    <Badge
                      key={trait}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                      onClick={() => removeCharacterTrait(trait)}
                    >
                      {trait}
                      <Icon name="close" className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'setting',
      title: 'Setting & Environment',
      icon: 'globe',
      content: (
        <div className="space-y-4">
          {/* Place */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Place
            </label>
            <Input
              value={parameters.setting?.place || ''}
              onChange={(e) => updateSetting({ place: e.target.value || undefined })}
              placeholder="e.g., mansion, forest, spaceship, city..."
            />
          </div>

          {/* Era */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Period
            </label>
            <Input
              value={parameters.setting?.era || ''}
              onChange={(e) => updateSetting({ era: e.target.value || undefined })}
              placeholder="e.g., medieval, modern day, far future..."
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Atmosphere/Mood
            </label>
            <Input
              value={parameters.setting?.mood || ''}
              onChange={(e) => updateSetting({ mood: e.target.value || undefined })}
              placeholder="e.g., tense, peaceful, chaotic, mysterious..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'advanced',
      title: 'Advanced Options',
      icon: 'cog',
      content: (
        <div className="space-y-4">
          {/* Audience Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Audience
            </label>
            <select
              value={parameters.audience_age || ''}
              onChange={(e) => updateParameter('audience_age', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Any age...</option>
              {audienceAges.map((age) => (
                <option key={age} value={age.toLowerCase().replace(/\s+/g, '-')}>
                  {age}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme Keywords
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., redemption, family, betrayal..."
                  onKeyPress={(e) => e.key === 'Enter' && addThemeKeyword()}
                />
                <Button onClick={addThemeKeyword} size="sm">
                  <Icon name="plus" className="h-4 w-4" />
                </Button>
              </div>
              {themeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {themeKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="outline"
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                      onClick={() => removeThemeKeyword(keyword)}
                    >
                      {keyword}
                      <Icon name="close" className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Length Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prompt Length
            </label>
            <select
              value={parameters.constraints?.length_target || ''}
              onChange={(e) => updateConstraints({ length_target: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Any length...</option>
              <option value="short">Short (1-2 sentences)</option>
              <option value="medium">Medium (3-5 sentences)</option>
              <option value="long">Long (6+ sentences)</option>
            </select>
          </div>

          {/* Vocabulary Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vocabulary Level
            </label>
            <select
              value={parameters.constraints?.vocabulary_level || ''}
              onChange={(e) => updateConstraints({ vocabulary_level: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Any level...</option>
              <option value="simple">Simple</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="zap" className="h-5 w-5" />
            <span>Prompt Laboratory</span>
          </div>
          <Button onClick={resetParameters} variant="ghost" size="sm">
            <Icon name="refresh" className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sections */}
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <Icon name={section.icon as any} className="h-4 w-4" />
                <span className="font-medium">{section.title}</span>
              </div>
              <Icon
                name={expandedSections.has(section.id) ? 'arrow-up' : 'arrow-down'}
                className="h-4 w-4"
              />
            </button>
            {expandedSections.has(section.id) && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                {section.content}
              </div>
            )}
          </div>
        ))}

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full mt-6"
          size="lg"
        >
          {isGenerating ? (
            <div className="loading-spinner h-5 w-5 mr-2" />
          ) : (
            <Icon name="zap" className="mr-2 h-5 w-5" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Prompts'}
        </Button>

        {/* Parameter Summary */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Active Parameters:</p>
          <div className="flex flex-wrap gap-1">
            {parameters.mode && (
              <Badge variant="outline" className="text-xs">Mode: {parameters.mode}</Badge>
            )}
            {parameters.genre && (
              <Badge variant="outline" className="text-xs">Genre: {parameters.genre}</Badge>
            )}
            {parameters.character?.name && (
              <Badge variant="outline" className="text-xs">Character: {parameters.character.name}</Badge>
            )}
            {parameters.setting?.place && (
              <Badge variant="outline" className="text-xs">Setting: {parameters.setting.place}</Badge>
            )}
            {characterTraits.length > 0 && (
              <Badge variant="outline" className="text-xs">{characterTraits.length} traits</Badge>
            )}
            {themeKeywords.length > 0 && (
              <Badge variant="outline" className="text-xs">{themeKeywords.length} themes</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
