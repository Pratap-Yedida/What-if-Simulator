'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { PromptLab } from '@/components/simulator/PromptLab';
import { GeneratedPromptList } from '@/components/simulator/GeneratedPromptList';
import { SimulatorHistory } from '@/components/simulator/SimulatorHistory';
import { TemplateLibrary } from '@/components/simulator/TemplateLibrary';
import { cn } from '@/lib/utils';

interface GeneratedPrompt {
  id: string;
  prompt_text: string;
  type: 'logical' | 'creative' | 'twist' | 'character' | 'thematic';
  tags: string[];
  impact: number;
  confidence_score: number;
  generation_method: string;
  created_at: string;
}

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

export default function SimulatorPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'templates'>('generator');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [parameters, setParameters] = useState<SimulatorParameters>({
    mode: 'balanced',
  });
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);

  // Mock data for development
  const mockPrompts: GeneratedPrompt[] = [
    {
      id: '1',
      prompt_text: 'What if the detective discovered that every clue led back to their own forgotten past?',
      type: 'character',
      tags: ['psychology', 'memory', 'identity'],
      impact: 0.89,
      confidence_score: 0.84,
      generation_method: 'logical-template',
      created_at: new Date().toISOString(),
    },
    {
      id: '2', 
      prompt_text: 'What if magic stopped working, but only for the most powerful wizards?',
      type: 'twist',
      tags: ['power-reversal', 'magic-system', 'consequences'],
      impact: 0.92,
      confidence_score: 0.78,
      generation_method: 'creative-blend',
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      prompt_text: 'What if the spaceship\'s AI developed the ability to dream, and those dreams started affecting reality?',
      type: 'creative',
      tags: ['ai-consciousness', 'reality-bending', 'sci-fi'],
      impact: 0.85,
      confidence_score: 0.81,
      generation_method: 'concept-fusion',
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    // Set initial mock data
    setGeneratedPrompts(mockPrompts);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new prompts with variations
      const newPrompts = mockPrompts.map(prompt => ({
        ...prompt,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      }));
      
      setGeneratedPrompts(newPrompts);
      
      // Add to history
      const historyEntry = {
        id: Math.random().toString(36).substr(2, 9),
        parameters,
        prompts: newPrompts,
        created_at: new Date().toISOString(),
      };
      setGenerationHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
      
      toast({
        type: 'success',
        title: 'Prompts generated!',
        description: `Generated ${newPrompts.length} new "What if" prompts.`,
      });
    } catch (error) {
      console.error('Failed to generate prompts:', error);
      toast({
        type: 'error',
        title: 'Generation failed',
        description: 'Failed to generate prompts. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptAction = (promptId: string, action: 'save' | 'copy' | 'export' | 'edit') => {
    const prompt = generatedPrompts.find(p => p.id === promptId);
    if (!prompt) return;

    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(prompt.prompt_text);
        toast({
          type: 'success',
          title: 'Copied!',
          description: 'Prompt copied to clipboard.',
          duration: 1500,
        });
        break;
      case 'save':
        toast({
          type: 'success',
          title: 'Prompt saved',
          description: 'Prompt added to your saved collection.',
        });
        break;
      case 'export':
        // Would export prompt to story editor or external tool
        toast({
          type: 'success',
          title: 'Prompt exported',
          description: 'Prompt exported successfully.',
        });
        break;
      case 'edit':
        // Would open prompt editor
        toast({
          type: 'info',
          title: 'Edit prompt',
          description: 'Prompt editor would open here.',
        });
        break;
    }
  };

  const tabs = [
    { id: 'generator', label: 'Prompt Generator', icon: 'zap' },
    { id: 'history', label: 'History', icon: 'clock' },
    { id: 'templates', label: 'Templates', icon: 'copy' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Story Simulator</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Generate infinite "What if" scenarios to spark your creativity
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600">
                <Icon name="check" className="h-3 w-3 mr-1" />
                Engine Active
              </Badge>
              {isAuthenticated && (
                <Badge variant="outline">
                  {user?.subscriptionTier === 'free' ? 'Free Tier' : 'Premium'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon name={tab.icon as any} className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'generator' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Panel - Parameters */}
              <div className="lg:col-span-1">
                <PromptLab
                  parameters={parameters}
                  onParametersChange={setParameters}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />
              </div>

              {/* Right Panel - Results */}
              <div className="lg:col-span-2">
                <GeneratedPromptList
                  prompts={generatedPrompts}
                  isLoading={isGenerating}
                  onPromptAction={handlePromptAction}
                />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <SimulatorHistory
              history={generationHistory}
              onRestoreParameters={(params) => {
                setParameters(params);
                setActiveTab('generator');
                toast({
                  type: 'success',
                  title: 'Parameters restored',
                  description: 'Previous settings have been loaded.',
                });
              }}
              onRegenerate={(params) => {
                setParameters(params);
                handleGenerate();
              }}
            />
          )}

          {activeTab === 'templates' && (
            <TemplateLibrary
              onUseTemplate={(template) => {
                // Apply template to parameters
                toast({
                  type: 'success',
                  title: 'Template applied',
                  description: `Using template: ${template.name}`,
                });
                setActiveTab('generator');
              }}
            />
          )}
        </div>

        {/* Quick Stats */}
        {activeTab === 'generator' && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {generatedPrompts.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Prompts Generated
                    </p>
                  </div>
                  <Icon name="zap" className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {generationHistory.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generation Sessions
                    </p>
                  </div>
                  <Icon name="clock" className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {generatedPrompts.length > 0 
                        ? Math.round(generatedPrompts.reduce((acc, p) => acc + p.impact, 0) / generatedPrompts.length * 100)
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Impact Score
                    </p>
                  </div>
                  <Icon name="chart" className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user?.subscriptionTier === 'free' ? 'Limited' : 'Unlimited'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generation Quota
                    </p>
                  </div>
                  <Icon name="settings" className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
