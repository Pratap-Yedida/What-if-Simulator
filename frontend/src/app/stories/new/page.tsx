'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-simple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { CreateStoryData } from '@/types/story';
import { cn } from '@/lib/utils';

export default function NewStoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateStoryData>({
    title: '',
    description: '',
    genre: '',
    tone: '',
    audience_age: '',
    is_public: false,
    is_collaborative: false,
    metadata: {},
    content: '',
  });

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const steps = [
    { title: 'Basic Info', description: 'Title and description' },
    { title: 'Classification', description: 'Genre, tone, and audience' },
    { title: 'Settings', description: 'Visibility and collaboration' },
    { title: 'First Content', description: 'Opening scene or scenario' },
  ];

  const genreOptions = [
    { value: 'fantasy', label: 'Fantasy', icon: 'star' },
    { value: 'science-fiction', label: 'Science Fiction', icon: 'zap' },
    { value: 'mystery', label: 'Mystery', icon: 'search' },
    { value: 'romance', label: 'Romance', icon: 'heart' },
    { value: 'thriller', label: 'Thriller', icon: 'warning' },
    { value: 'horror', label: 'Horror', icon: 'eye-off' },
    { value: 'adventure', label: 'Adventure', icon: 'map' },
    { value: 'historical-fiction', label: 'Historical Fiction', icon: 'clock' },
    { value: 'contemporary', label: 'Contemporary', icon: 'globe' },
    { value: 'comedy', label: 'Comedy', icon: 'smile' },
  ];

  const toneOptions = [
    'Light-hearted', 'Serious', 'Dark', 'Humorous', 'Mysterious', 
    'Romantic', 'Suspenseful', 'Melancholy', 'Optimistic', 'Satirical'
  ];

  const audienceAgeOptions = [
    'All Ages', '10-12', '13-15', '16-18', '18+', 'Mature (21+)'
  ];

  const handleInputChange = (field: keyof CreateStoryData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({
        type: 'error',
        title: 'Title required',
        description: 'Please enter a title for your story.',
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Call the actual backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || '',
          content: formData.content || '',
          isPublic: formData.is_public || false,
          tags: formData.genre ? [formData.genre] : [],
          category: formData.genre || 'General',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create story');
      }

      const result = await response.json();
      
      toast({
        type: 'success',
        title: 'Story created!',
        description: 'Your new story has been created successfully.',
      });

      router.push(`/stories/${result.data.id}/edit`);
    } catch (error) {
      console.error('Failed to create story:', error);
      let errorMessage = 'Failed to create your story. Please try again.';
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        errorMessage = `Unable to connect to the server. Please make sure the backend server is running on ${apiUrl}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        type: 'error',
        title: 'Creation failed',
        description: errorMessage,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return formData.title.trim().length > 0;
      case 1:
        return true; // Optional fields
      case 2:
        return true; // Optional fields
      case 3:
        return true; // Optional field
      default:
        return false;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Story</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Start your interactive storytelling journey
              </p>
            </div>
            <Button onClick={() => router.push('/stories')} variant="outline">
              <Icon name="arrow-left" className="mr-2 h-4 w-4" />
              Back to Stories
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => (
                <li key={step.title} className={cn(
                  'relative',
                  index < steps.length - 1 && 'flex-1'
                )}>
                  <div className="flex items-center">
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
                      index < currentStep 
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : index === currentStep
                        ? 'border-blue-600 text-blue-600'
                        : 'border-gray-300 text-gray-500'
                    )}>
                      {index < currentStep ? (
                        <Icon name="check" className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={cn(
                        'text-sm font-medium',
                        index === currentStep ? 'text-blue-600' : 'text-gray-500'
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'absolute top-4 left-8 w-full h-0.5',
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    )} />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 0: Basic Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Story Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter a compelling title for your story..."
                    className="w-full text-lg"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your story in a few sentences. This will help readers discover and understand your story..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description?.length || 0}/500 characters
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Icon name="info" className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                        Tips for a great story
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                        <li>• Choose a title that captures the essence of your story</li>
                        <li>• Write a description that hooks readers and sets expectations</li>
                        <li>• Think about the central conflict or question your story explores</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Classification */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Genre
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {genreOptions.map((genre) => (
                      <button
                        key={genre.value}
                        onClick={() => handleInputChange('genre', genre.value)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all hover:border-gray-400',
                          formData.genre === genre.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon name={genre.icon as any} className="h-4 w-4" />
                          <span className="text-sm font-medium">{genre.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone
                  </label>
                  <select
                    value={formData.tone}
                    onChange={(e) => handleInputChange('tone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a tone (optional)</option>
                    {toneOptions.map((tone) => (
                      <option key={tone} value={tone.toLowerCase().replace(/\s+/g, '-')}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={formData.audience_age}
                    onChange={(e) => handleInputChange('audience_age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select age group (optional)</option>
                    {audienceAgeOptions.map((age) => (
                      <option key={age} value={age.toLowerCase().replace(/\s+/g, '-')}>
                        {age}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Settings */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Icon name="globe" className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Public Story</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
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

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Icon name="users" className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Collaborative Editing</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
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

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Icon name="info" className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                        Privacy & Collaboration
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        You can change these settings later from your story's settings panel.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: First Content */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opening Scene (Optional)
                  </label>
                  <textarea
                    value={formData.content || ''}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write the opening of your story here, or leave blank to start with a simple beginning node..."
                    className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.content || '').length}/1000 characters
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Icon name="zap" className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900 dark:text-green-200">
                        Ready to start!
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        After creating your story, you'll be taken to the editor where you can:
                      </p>
                      <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                        <li>• Add and edit story nodes</li>
                        <li>• Create branching paths and choices</li>
                        <li>• Use the AI simulator for "What if" scenarios</li>
                        <li>• Invite collaborators if enabled</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
          >
            <Icon name="arrow-left" className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full',
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                )}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
            >
              Next
              <Icon name="arrow-right" className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={!isStepValid(currentStep) || isCreating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <div className="loading-spinner h-4 w-4 mr-2" />
              ) : (
                <Icon name="plus" className="mr-2 h-4 w-4" />
              )}
              {isCreating ? 'Creating...' : 'Create Story'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
