'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { StoryBranch, UpdateStoryBranchData, StoryNode } from '@/types/story';
import { cn, formatDateTime } from '@/lib/utils';

interface BranchEditorProps {
  storyId: string;
  branchId: string;
  onUpdate: (branchId: string, updates: UpdateStoryBranchData) => void;
  onClose: () => void;
}

export function BranchEditor({ storyId, branchId, onUpdate, onClose }: BranchEditorProps) {
  const { toast } = useToast();
  const [branch, setBranch] = useState<StoryBranch | null>(null);
  const [fromNode, setFromNode] = useState<StoryNode | null>(null);
  const [toNode, setToNode] = useState<StoryNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    branch_type: 'character-driven' as StoryBranch['branch_type'],
    impact_score: 0.5,
  });

  // Load branch data
  useEffect(() => {
    fetchBranch();
  }, [branchId]);

  // Auto-save when form changes
  useEffect(() => {
    if (isDirty && branch) {
      const timer = setTimeout(() => {
        handleSave();
      }, 1500); // Auto-save after 1.5 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [isDirty, formData]);

  const fetchBranch = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for development
      // In real app, this would fetch from API
      const mockBranch: StoryBranch = {
        id: branchId,
        story_id: storyId,
        from_node_id: 'node-1',
        to_node_id: 'node-2',
        label: 'Investigate the mysterious sounds upstairs',
        branch_type: 'character-driven',
        impact_score: 0.75,
        selection_count: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          popularity_score: 0.68,
          average_rating: 4.2,
          completion_rate: 0.85,
        },
      };

      const mockFromNode: StoryNode = {
        id: 'node-1',
        story_id: storyId,
        content: 'The detective stood in the foyer, listening to strange sounds from above.',
        author_id: 'user-1',
        position_order: 0,
        node_type: 'story',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockToNode: StoryNode = {
        id: 'node-2',
        story_id: storyId,
        content: 'She climbed the creaking stairs, following the mysterious sounds.',
        author_id: 'user-1',
        position_order: 1,
        node_type: 'choice',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setBranch(mockBranch);
      setFromNode(mockFromNode);
      setToNode(mockToNode);
      setFormData({
        label: mockBranch.label,
        branch_type: mockBranch.branch_type,
        impact_score: mockBranch.impact_score || 0.5,
      });
    } catch (error) {
      console.error('Failed to fetch branch:', error);
      toast({
        type: 'error',
        title: 'Error loading branch',
        description: 'Failed to load branch data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!branch || !isDirty) return;

    try {
      setIsSaving(true);

      const updates: UpdateStoryBranchData = {};
      if (formData.label !== branch.label) updates.label = formData.label;
      if (formData.branch_type !== branch.branch_type) updates.branch_type = formData.branch_type;
      if (formData.impact_score !== branch.impact_score) updates.impact_score = formData.impact_score;

      if (Object.keys(updates).length === 0) {
        setIsDirty(false);
        return;
      }

      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      onUpdate(branchId, updates);
      setBranch(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
      setIsDirty(false);

      toast({
        type: 'success',
        title: 'Branch saved',
        description: 'Your changes have been saved.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to save branch:', error);
      toast({
        type: 'error',
        title: 'Save failed',
        description: 'Failed to save changes. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!branch) return;

    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);

      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        type: 'success',
        title: 'Branch deleted',
        description: 'The branch has been deleted.',
      });

      onClose();
    } catch (error) {
      console.error('Failed to delete branch:', error);
      toast({
        type: 'error',
        title: 'Delete failed',
        description: 'Failed to delete the branch. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const branchTypeOptions = [
    { 
      value: 'character-driven', 
      label: 'Character-Driven', 
      icon: 'user',
      description: 'Based on character decisions and personality',
      color: 'blue'
    },
    { 
      value: 'plot-twist', 
      label: 'Plot Twist', 
      icon: 'zap',
      description: 'Unexpected story development',
      color: 'purple'
    },
    { 
      value: 'moral-dilemma', 
      label: 'Moral Dilemma', 
      icon: 'help',
      description: 'Ethical choice or moral conflict',
      color: 'red'
    },
    { 
      value: 'procedural', 
      label: 'Procedural', 
      icon: 'search',
      description: 'Logical or investigative choice',
      color: 'green'
    },
    { 
      value: 'escalation', 
      label: 'Escalation', 
      icon: 'arrow-up',
      description: 'Increasing tension or stakes',
      color: 'orange'
    },
    { 
      value: 'de-escalation', 
      label: 'De-escalation', 
      icon: 'arrow-down',
      description: 'Reducing tension or conflict',
      color: 'cyan'
    },
  ];

  const getImpactScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600';
    if (score >= 0.6) return 'text-orange-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getImpactScoreLabel = (score: number) => {
    if (score >= 0.8) return 'High Impact';
    if (score >= 0.6) return 'Medium-High Impact';
    if (score >= 0.4) return 'Medium Impact';
    if (score >= 0.2) return 'Low-Medium Impact';
    return 'Low Impact';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner h-8 w-8"></div>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Icon name="warning" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Branch not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Branch
          </h2>
          <div className="flex items-center space-x-2">
            {isDirty && (
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-1" />
                Unsaved
              </Badge>
            )}
            <Button onClick={onClose} variant="ghost" size="sm">
              <Icon name="close" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Connected Nodes Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connection
          </label>
          <div className="space-y-3">
            {/* From Node */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="arrow-right" className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">From</span>
                <Badge variant="outline" className="text-xs">{fromNode?.node_type}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {fromNode?.content}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <Icon name="arrow-down" className="h-5 w-5 text-blue-500" />
            </div>

            {/* To Node */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="arrow-right" className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">To</span>
                <Badge variant="outline" className="text-xs">{toNode?.node_type}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {toNode?.content}
              </p>
            </div>
          </div>
        </div>

        {/* Branch Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Branch Label
          </label>
          <Input
            value={formData.label}
            onChange={(e) => handleInputChange('label', e.target.value)}
            placeholder="Describe this choice or action..."
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is what readers will see as the choice or action option
          </p>
        </div>

        {/* Branch Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Branch Type
          </label>
          <div className="grid grid-cols-1 gap-2">
            {branchTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInputChange('branch_type', option.value)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all',
                  formData.branch_type === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon name={option.icon as any} className="h-4 w-4" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs',
                      `text-${option.color}-600 border-${option.color}-200`
                    )}
                  >
                    {option.color}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Impact Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Impact Score: {formData.impact_score.toFixed(2)}
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={formData.impact_score}
              onChange={(e) => handleInputChange('impact_score', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low Impact</span>
              <span className={getImpactScoreColor(formData.impact_score)}>
                {getImpactScoreLabel(formData.impact_score)}
              </span>
              <span>High Impact</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            How significantly this choice affects the story outcome
          </p>
        </div>

        {/* Analytics */}
        {branch.metadata && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Analytics
            </label>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Selections</span>
                  <p className="font-medium">{branch.selection_count}</p>
                </div>
                <div>
                  <span className="text-gray-500">Popularity</span>
                  <p className="font-medium">{Math.round((branch.metadata.popularity_score || 0) * 100)}%</p>
                </div>
                <div>
                  <span className="text-gray-500">Avg Rating</span>
                  <p className="font-medium">{branch.metadata.average_rating || 0}/5</p>
                </div>
                <div>
                  <span className="text-gray-500">Completion</span>
                  <p className="font-medium">{Math.round((branch.metadata.completion_rate || 0) * 100)}%</p>
                </div>
              </div>

              {/* Visual popularity indicator */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Reader Preference</span>
                  <span>{Math.round((branch.metadata.popularity_score || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(branch.metadata.popularity_score || 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Details
          </label>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created</span>
                <p className="font-medium">{formatDateTime(branch.created_at)}</p>
              </div>
              <div>
                <span className="text-gray-500">Updated</span>
                <p className="font-medium">{formatDateTime(branch.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex space-x-2">
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <div className="loading-spinner h-4 w-4 mr-2" />
            ) : (
              <Icon name="save" className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="flex-1"
            disabled={isSaving}
          >
            <Icon name="delete" className="mr-2 h-4 w-4" />
            Delete Branch
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Branch ID: {branch.id}
        </div>
      </div>
    </div>
  );
}
