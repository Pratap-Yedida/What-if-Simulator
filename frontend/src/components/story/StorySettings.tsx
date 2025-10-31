'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { Story, UpdateStoryData } from '@/types/story';
import { cn, formatDateTime } from '@/lib/utils';

interface StorySettingsProps {
  story: Story;
  onUpdate: (updates: UpdateStoryData) => void;
}

export function StorySettings({ story, onUpdate }: StorySettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    title: story.title,
    description: story.description || '',
    genre: story.genre || '',
    tone: story.tone || '',
    audience_age: story.audience_age || '',
    is_public: story.is_public,
    is_collaborative: story.is_collaborative,
  });

  // Auto-save when form changes
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [isDirty, formData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!isDirty) return;

    try {
      setIsSaving(true);

      const updates: UpdateStoryData = {};
      if (formData.title !== story.title) updates.title = formData.title;
      if (formData.description !== story.description) updates.description = formData.description;
      if (formData.genre !== story.genre) updates.genre = formData.genre;
      if (formData.tone !== story.tone) updates.tone = formData.tone;
      if (formData.audience_age !== story.audience_age) updates.audience_age = formData.audience_age;
      if (formData.is_public !== story.is_public) updates.is_public = formData.is_public;
      if (formData.is_collaborative !== story.is_collaborative) updates.is_collaborative = formData.is_collaborative;

      if (Object.keys(updates).length === 0) {
        setIsDirty(false);
        return;
      }

      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      onUpdate(updates);
      setIsDirty(false);

      toast({
        type: 'success',
        title: 'Settings saved',
        description: 'Your story settings have been updated.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        type: 'error',
        title: 'Save failed',
        description: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const genreOptions = [
    'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 
    'Horror', 'Adventure', 'Historical Fiction', 'Contemporary', 
    'Young Adult', 'Literary Fiction', 'Comedy', 'Drama'
  ];

  const toneOptions = [
    'Light-hearted', 'Serious', 'Dark', 'Humorous', 'Mysterious', 
    'Romantic', 'Suspenseful', 'Melancholy', 'Optimistic', 'Satirical'
  ];

  const audienceAgeOptions = [
    'All Ages', '10-12', '13-15', '16-18', '18+', 'Mature (21+)'
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Story Settings
          </h2>
          {isDirty && (
            <Badge variant="outline" className="text-xs">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-1" />
              Unsaved
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Basic Information</h3>
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter story title..."
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your story in a few sentences..."
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>
        </div>

        {/* Genre and Tone */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Classification</h3>
          
          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genre
            </label>
            <select
              value={formData.genre}
              onChange={(e) => handleInputChange('genre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a genre...</option>
              {genreOptions.map((genre) => (
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
              value={formData.tone}
              onChange={(e) => handleInputChange('tone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a tone...</option>
              {toneOptions.map((tone) => (
                <option key={tone} value={tone.toLowerCase().replace(/\s+/g, '-')}>
                  {tone}
                </option>
              ))}
            </select>
          </div>

          {/* Audience Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Audience
            </label>
            <select
              value={formData.audience_age}
              onChange={(e) => handleInputChange('audience_age', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select age group...</option>
              {audienceAgeOptions.map((age) => (
                <option key={age} value={age.toLowerCase().replace(/\s+/g, '-')}>
                  {age}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visibility and Collaboration */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Sharing & Collaboration</h3>
          
          {/* Public Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="flex items-center space-x-2">
                <Icon name="globe" className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Public Story</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Allow others to discover and read your story
              </p>
            </div>
            <button
              onClick={() => handleInputChange('is_public', !formData.is_public)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                formData.is_public ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  formData.is_public ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Collaborative Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="flex items-center space-x-2">
                <Icon name="users" className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Collaborative Editing</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Allow other writers to contribute to your story
              </p>
            </div>
            <button
              onClick={() => handleInputChange('is_collaborative', !formData.is_collaborative)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                formData.is_collaborative ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  formData.is_collaborative ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>

        {/* Story Statistics */}
        {story.stats && (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name="book" className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Nodes</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {story.stats.node_count}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name="git-branch" className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Branches</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {story.stats.branch_count}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name="eye" className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Views</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {story.stats.view_count}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name="heart" className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Likes</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {story.stats.like_count}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Story Metadata */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Details</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Created</span>
              <span className="font-medium">{formatDateTime(story.created_at)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Last Updated</span>
              <span className="font-medium">{formatDateTime(story.updated_at)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Story ID</span>
              <span className="font-mono text-xs">{story.id}</span>
            </div>
            {story.stats?.last_activity && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Activity</span>
                <span className="font-medium">{formatDateTime(story.stats.last_activity)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Advanced</h3>
          
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              <Icon name="download" className="mr-2 h-4 w-4" />
              Export Story
            </Button>
            
            <Button variant="outline" className="w-full">
              <Icon name="copy" className="mr-2 h-4 w-4" />
              Duplicate Story
            </Button>
            
            <Button variant="outline" className="w-full">
              <Icon name="share" className="mr-2 h-4 w-4" />
              Share Story
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-3">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => {
                if (confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
                  // Handle delete
                }
              }}
            >
              <Icon name="delete" className="mr-2 h-4 w-4" />
              Delete Story
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will permanently delete your story and all its content
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <div className="loading-spinner h-4 w-4 mr-2" />
          ) : (
            <Icon name="save" className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
