'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { Story } from '@/types/story';
import { cn } from '@/lib/utils';

interface GeneratedPrompt {
  id: string;
  prompt_text: string;
  type: 'logical' | 'creative' | 'twist' | 'character' | 'thematic';
  tags: string[];
  impact: number;
  confidence_score: number;
}

interface SimulatorPanelProps {
  story: Story;
  selectedNodeId: string | null;
  onClose: () => void;
  onPromptAccept: (prompt: GeneratedPrompt) => void;
}

export function SimulatorPanel({ story, selectedNodeId, onClose, onPromptAccept }: SimulatorPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [parameters, setParameters] = useState({
    character: '',
    setting: '',
    event: '',
    mode: 'balanced' as 'logical' | 'creative' | 'balanced',
  });

  // Mock prompts for development
  const mockPrompts: GeneratedPrompt[] = [
    {
      id: '1',
      prompt_text: 'What if the detective discovered that the mansion\'s owner had been dead for decades?',
      type: 'creative',
      tags: ['mystery', 'supernatural', 'plot-twist'],
      impact: 0.85,
      confidence_score: 0.78,
    },
    {
      id: '2',
      prompt_text: 'What if she found evidence that pointed directly to her own past involvement?',
      type: 'character',
      tags: ['psychological', 'personal-stakes', 'revelation'],
      impact: 0.92,
      confidence_score: 0.83,
    },
    {
      id: '3',
      prompt_text: 'What if the storm outside was actually being controlled by someone inside?',
      type: 'twist',
      tags: ['supernatural', 'control', 'environment'],
      impact: 0.67,
      confidence_score: 0.65,
    },
  ];

  useEffect(() => {
    // Set initial prompts
    setPrompts(mockPrompts);
  }, []);

  const handleGeneratePrompts = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, this would call the simulator API
      const newPrompts = mockPrompts.map(prompt => ({
        ...prompt,
        id: Math.random().toString(36).substr(2, 9),
      }));
      
      setPrompts(newPrompts);
      
      toast({
        type: 'success',
        title: 'Prompts generated',
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
      setIsLoading(false);
    }
  };

  const handleAcceptPrompt = (prompt: GeneratedPrompt) => {
    onPromptAccept(prompt);
    toast({
      type: 'success',
      title: 'Prompt accepted',
      description: 'The prompt has been added to your story development notes.',
    });
  };

  const getPromptTypeColor = (type: string) => {
    switch (type) {
      case 'logical': return 'blue';
      case 'creative': return 'purple';
      case 'twist': return 'orange';
      case 'character': return 'green';
      case 'thematic': return 'red';
      default: return 'gray';
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 0.8) return 'text-red-600';
    if (impact >= 0.6) return 'text-orange-600';
    if (impact >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="zap" className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Story Simulator
            </h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <Icon name="close" className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Generate "What if" scenarios for your story
        </p>
      </div>

      {/* Parameters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Parameters</h3>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Character</label>
            <Input
              value={parameters.character}
              onChange={(e) => setParameters(prev => ({ ...prev, character: e.target.value }))}
              placeholder="detective, wizard, scientist..."
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Setting</label>
            <Input
              value={parameters.setting}
              onChange={(e) => setParameters(prev => ({ ...prev, setting: e.target.value }))}
              placeholder="mansion, forest, spaceship..."
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Current Event</label>
            <Input
              value={parameters.event}
              onChange={(e) => setParameters(prev => ({ ...prev, event: e.target.value }))}
              placeholder="discovers a clue, hears a sound..."
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Generation Mode</label>
            <div className="flex space-x-1">
              {['logical', 'creative', 'balanced'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setParameters(prev => ({ ...prev, mode: mode as any }))}
                  className={cn(
                    'flex-1 px-2 py-1 text-xs rounded transition-colors',
                    parameters.mode === mode
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGeneratePrompts}
            disabled={isLoading}
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <div className="loading-spinner h-4 w-4 mr-2" />
            ) : (
              <Icon name="zap" className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Generating...' : 'Generate Prompts'}
          </Button>
        </div>
      </div>

      {/* Generated Prompts */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated Prompts
            </h3>
            <Badge variant="outline" className="text-xs">
              {prompts.length}
            </Badge>
          </div>

          {prompts.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="zap" className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">
                No prompts generated yet
              </p>
              <p className="text-xs text-gray-400">
                Click "Generate Prompts" to create "What if" scenarios
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <Card key={prompt.id} className="prompt-card">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <Badge 
                          variant="outline" 
                          className={`text-xs text-${getPromptTypeColor(prompt.type)}-600`}
                        >
                          {prompt.type}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs">
                          <span className={getImpactColor(prompt.impact)}>
                            Impact: {prompt.impact.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Prompt Text */}
                      <p className="text-sm text-gray-900 dark:text-white font-medium leading-relaxed">
                        {prompt.prompt_text}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {prompt.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>Confidence: {Math.round(prompt.confidence_score * 100)}%</span>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(prompt.prompt_text);
                              toast({ 
                                type: 'success', 
                                title: 'Copied!', 
                                description: 'Prompt copied to clipboard.',
                                duration: 1500
                              });
                            }}
                          >
                            <Icon name="copy" className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleAcceptPrompt(prompt)}
                          >
                            <Icon name="plus" className="h-3 w-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          {selectedNodeId && (
            <p className="mb-2">Context: Node {selectedNodeId}</p>
          )}
          <p>Powered by AI Story Simulator Engine</p>
        </div>
      </div>
    </div>
  );
}
