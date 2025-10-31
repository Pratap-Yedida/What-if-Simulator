'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { StoryNode, UpdateStoryNodeData } from '@/types/story';
import { cn, formatDateTime } from '@/lib/utils';

interface NodeEditorProps {
  storyId: string;
  nodeId: string;
  onUpdate: (nodeId: string, updates: UpdateStoryNodeData) => void;
  onClose: () => void;
}

export function NodeEditor({ storyId, nodeId, onUpdate, onClose }: NodeEditorProps) {
  const { toast } = useToast();
  const [node, setNode] = useState<StoryNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    node_type: 'story' as 'story' | 'choice' | 'ending' | 'divergence',
    position_order: 0,
  });

  // Load node data
  useEffect(() => {
    fetchNode();
  }, [nodeId]);

  // Auto-save when form changes
  useEffect(() => {
    if (isDirty && node) {
      const timer = setTimeout(() => {
        handleSave();
      }, 1500); // Auto-save after 1.5 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [isDirty, formData]);

  const fetchNode = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for development
      // In real app, this would fetch from API
      const mockNode: StoryNode = {
        id: nodeId,
        story_id: storyId,
        content: 'The detective arrived at the mysterious mansion on a stormy night. Lightning illuminated the Gothic windows as she approached the heavy wooden door.',
        author_id: 'user-1',
        position_order: 0,
        node_type: 'story',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          word_count: 25,
          reading_time: 1,
          character_count: 145,
        },
      };

      setNode(mockNode);
      setFormData({
        content: mockNode.content,
        node_type: mockNode.node_type,
        position_order: mockNode.position_order,
      });
    } catch (error) {
      console.error('Failed to fetch node:', error);
      toast({
        type: 'error',
        title: 'Error loading node',
        description: 'Failed to load node content. Please try again.',
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
    if (!node || !isDirty) return;

    try {
      setIsSaving(true);

      const updates: UpdateStoryNodeData = {};
      if (formData.content !== node.content) updates.content = formData.content;
      if (formData.node_type !== node.node_type) updates.node_type = formData.node_type;
      if (formData.position_order !== node.position_order) updates.position_order = formData.position_order;

      if (Object.keys(updates).length === 0) {
        setIsDirty(false);
        return;
      }

      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      onUpdate(nodeId, updates);
      setNode(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
      setIsDirty(false);

      toast({
        type: 'success',
        title: 'Node saved',
        description: 'Your changes have been saved.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to save node:', error);
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
    if (!node) return;

    if (!confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);

      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        type: 'success',
        title: 'Node deleted',
        description: 'The node has been deleted.',
      });

      onClose();
    } catch (error) {
      console.error('Failed to delete node:', error);
      toast({
        type: 'error',
        title: 'Delete failed',
        description: 'Failed to delete the node. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!node) return;

    try {
      setIsSaving(true);

      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        type: 'success',
        title: 'Node duplicated',
        description: 'A copy of this node has been created.',
      });
    } catch (error) {
      console.error('Failed to duplicate node:', error);
      toast({
        type: 'error',
        title: 'Duplicate failed',
        description: 'Failed to duplicate the node. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = (text: string): number => {
    const wordCount = getWordCount(text);
    return Math.ceil(wordCount / 200); // Assume 200 words per minute
  };

  const nodeTypeOptions = [
    { value: 'story', label: 'Story', icon: 'book', description: 'Narrative content' },
    { value: 'choice', label: 'Choice', icon: 'git-branch', description: 'Decision point' },
    { value: 'ending', label: 'Ending', icon: 'flag', description: 'Story conclusion' },
    { value: 'divergence', label: 'Divergence', icon: 'zap', description: 'Major plot split' },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner h-8 w-8"></div>
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Icon name="warning" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Node not found</p>
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
            Edit Node
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
        {/* Node Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Node Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {nodeTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInputChange('node_type', option.value)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all',
                  formData.node_type === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name={option.icon as any} className="h-4 w-4" />
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Write your story content here..."
          />
          
          {/* Content Stats */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{getWordCount(formData.content)} words</span>
              <span>{formData.content.length} characters</span>
              <span>~{getReadingTime(formData.content)} min read</span>
            </div>
            <span className={cn(
              formData.content.length > 1000 ? 'text-orange-500' : 'text-gray-500'
            )}>
              {formData.content.length > 1000 && 'Long content'}
            </span>
          </div>
        </div>

        {/* Position Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position Order
          </label>
          <Input
            type="number"
            value={formData.position_order}
            onChange={(e) => handleInputChange('position_order', parseInt(e.target.value) || 0)}
            className="w-full"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Controls the order of nodes when multiple branches lead to the same level
          </p>
        </div>

        {/* Metadata */}
        {node.metadata && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metadata
            </label>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Word Count</span>
                  <p className="font-medium">{node.metadata.word_count || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Reading Time</span>
                  <p className="font-medium">{node.metadata.reading_time || 0} min</p>
                </div>
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="font-medium">{formatDateTime(node.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Updated</span>
                  <p className="font-medium">{formatDateTime(node.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connections */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connections
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-sm">Incoming branches</span>
              <Badge variant="outline">2</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-sm">Outgoing branches</span>
              <Badge variant="outline">3</Badge>
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
            onClick={handleDuplicate}
            variant="outline"
            className="flex-1"
            disabled={isSaving}
          >
            <Icon name="copy" className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="flex-1"
            disabled={isSaving}
          >
            <Icon name="delete" className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Node ID: {node.id}
        </div>
      </div>
    </div>
  );
}
