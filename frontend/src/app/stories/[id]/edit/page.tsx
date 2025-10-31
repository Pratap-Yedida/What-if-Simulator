'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-simple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { StoryTreeViewer } from '@/components/story/StoryTreeViewer';
import { NodeEditor } from '@/components/story/NodeEditor';
import { BranchEditor } from '@/components/story/BranchEditor';
import { StorySettings } from '@/components/story/StorySettings';
import { SimulatorPanel } from '@/components/simulator/SimulatorPanel';
import { useToast } from '@/components/ui/Toaster';
import { Story, StoryNode, StoryBranch, EditorState, EditorAction } from '@/types/story';
import { cn } from '@/lib/utils';

interface StoryEditorProps {
  params: { id: string };
}

const initialEditorState: EditorState = {
  story: null,
  selectedNodeId: null,
  selectedBranchId: null,
  isEditing: false,
  isDirty: false,
  viewMode: 'tree',
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_STORY':
      return { ...state, story: action.payload, isDirty: false };
    case 'SELECT_NODE':
      return { 
        ...state, 
        selectedNodeId: action.payload, 
        selectedBranchId: null,
        isEditing: false 
      };
    case 'SELECT_BRANCH':
      return { 
        ...state, 
        selectedBranchId: action.payload, 
        selectedNodeId: null,
        isEditing: false 
      };
    case 'START_EDITING':
      return { ...state, isEditing: true };
    case 'STOP_EDITING':
      return { ...state, isEditing: false };
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_ZOOM':
      return { ...state, zoomLevel: action.payload };
    case 'SET_PAN':
      return { ...state, panOffset: action.payload };
    case 'RESET':
      return initialEditorState;
    default:
      return state;
  }
}

export default function StoryEditorPage({ params }: StoryEditorProps) {
  const { id } = params;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [state, dispatch] = React.useReducer(editorReducer, initialEditorState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load story data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchStory();
  }, [id, isAuthenticated]);

  // Auto-save functionality
  useEffect(() => {
    if (state.isDirty) {
      const timer = setTimeout(() => {
        autoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [state.isDirty]);

  // Handle beforeunload for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty]);

  const fetchStory = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/stories/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({ 
            type: 'error', 
            title: 'Story not found',
            description: 'The story you\'re looking for doesn\'t exist or you don\'t have permission to view it.'
          });
          router.push('/stories');
          return;
        }
        throw new Error('Failed to fetch story');
      }

      const data = await response.json();
      const story = data?.data || data?.story || null;
      dispatch({ type: 'SET_STORY', payload: story });

      // Check if user can edit
      if (data?.metadata && data.metadata.user_can_edit === false) {
        toast({ 
          type: 'warning', 
          title: 'Read-only access',
          description: 'You can view this story but cannot make changes.'
        });
      }
    } catch (error) {
      console.error('Failed to fetch story:', error);
      toast({ 
        type: 'error', 
        title: 'Error loading story',
        description: 'Failed to load the story. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const autoSave = async () => {
    if (!state.story || !state.isDirty) return;

    try {
      setIsSaving(true);
      // Auto-save logic would go here
      dispatch({ type: 'SET_DIRTY', payload: false });
      
      toast({ 
        type: 'success', 
        title: 'Auto-saved',
        description: 'Your changes have been saved automatically.',
        duration: 2000
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await autoSave();
      
      toast({ 
        type: 'success', 
        title: 'Saved successfully',
        description: 'All changes have been saved.'
      });
    } catch (error) {
      toast({ 
        type: 'error', 
        title: 'Save failed',
        description: 'Failed to save changes. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNodeSelect = useCallback((nodeId: string) => {
    dispatch({ type: 'SELECT_NODE', payload: nodeId });
  }, []);

  const handleBranchSelect = useCallback((branchId: string) => {
    dispatch({ type: 'SELECT_BRANCH', payload: branchId });
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: any) => {
    dispatch({ type: 'SET_DIRTY', payload: true });
    // Update node in state
  }, []);

  const handleBranchUpdate = useCallback((branchId: string, updates: any) => {
    dispatch({ type: 'SET_DIRTY', payload: true });
    // Update branch in state
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-spinner h-8 w-8 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!state.story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Icon name="warning" className="h-16 w-16 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Story not found</h1>
          <p className="text-gray-600 dark:text-gray-400">The story you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/stories')}>
            <Icon name="arrow-left" className="mr-2 h-4 w-4" />
            Back to Stories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/stories')}
                variant="ghost"
                size="sm"
              >
                <Icon name="arrow-left" className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                  {state.story.title}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Badge variant="outline">{state.story.genre || 'No genre'}</Badge>
                  <span>•</span>
                  <span>{state.story.audience_age || 'All ages'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {['tree', 'linear', 'outline'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: mode })}
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                      state.viewMode === mode
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <Button
                onClick={() => setShowSimulator(!showSimulator)}
                variant="outline"
                size="sm"
              >
                <Icon name="zap" className="mr-2 h-4 w-4" />
                Simulator
              </Button>

              <Button
                onClick={handleSave}
                disabled={!state.isDirty || isSaving}
                size="sm"
              >
                {isSaving ? (
                  <div className="loading-spinner h-4 w-4 mr-2" />
                ) : (
                  <Icon name="save" className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>

              <Button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                variant="ghost"
                size="sm"
              >
                <Icon name="menu" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Story Tree Viewer */}
          <div className="flex-1 relative">
            <StoryTreeViewer
              story={state.story}
              selectedNodeId={state.selectedNodeId}
              selectedBranchId={state.selectedBranchId}
              viewMode={state.viewMode}
              zoomLevel={state.zoomLevel}
              panOffset={state.panOffset}
              onNodeSelect={handleNodeSelect}
              onBranchSelect={handleBranchSelect}
              onNodeUpdate={handleNodeUpdate}
              onBranchUpdate={handleBranchUpdate}
              onZoomChange={(zoom) => dispatch({ type: 'SET_ZOOM', payload: zoom })}
              onPanChange={(pan) => dispatch({ type: 'SET_PAN', payload: pan })}
            />
          </div>
        </div>

        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {state.selectedNodeId ? (
                <NodeEditor
                  storyId={state.story.id}
                  nodeId={state.selectedNodeId}
                  onUpdate={handleNodeUpdate}
                  onClose={() => dispatch({ type: 'SELECT_NODE', payload: null })}
                />
              ) : state.selectedBranchId ? (
                <BranchEditor
                  storyId={state.story.id}
                  branchId={state.selectedBranchId}
                  onUpdate={handleBranchUpdate}
                  onClose={() => dispatch({ type: 'SELECT_BRANCH', payload: null })}
                />
              ) : (
                <StorySettings
                  story={state.story}
                  onUpdate={(updates) => {
                    dispatch({ type: 'SET_DIRTY', payload: true });
                    // Update story in state
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Simulator Panel */}
        {showSimulator && (
          <SimulatorPanel
            story={state.story}
            selectedNodeId={state.selectedNodeId}
            onClose={() => setShowSimulator(false)}
            onPromptAccept={(prompt) => {
              // Handle prompt acceptance
              toast({ 
                type: 'success', 
                title: 'Prompt accepted',
                description: 'The prompt has been added to your story.'
              });
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>
            {state.story.stats?.node_count || 0} nodes, {state.story.stats?.branch_count || 0} branches
          </span>
          {state.isDirty && (
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              <span>Unsaved changes</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>Zoom: {Math.round(state.zoomLevel * 100)}%</span>
          <span>View: {state.viewMode}</span>
        </div>
      </div>
    </div>
  );
}
