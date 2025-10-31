'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Story, StoryNode, StoryBranch, NodePosition } from '@/types/story';
import { cn } from '@/lib/utils';

interface StoryTreeViewerProps {
  story: Story;
  selectedNodeId: string | null;
  selectedBranchId: string | null;
  viewMode: 'tree' | 'linear' | 'outline';
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onNodeSelect: (nodeId: string) => void;
  onBranchSelect: (branchId: string) => void;
  onNodeUpdate: (nodeId: string, updates: any) => void;
  onBranchUpdate: (branchId: string, updates: any) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
}

interface TreeNode extends StoryNode {
  position: NodePosition;
  level: number;
  children: TreeNode[];
}

export function StoryTreeViewer({
  story,
  selectedNodeId,
  selectedBranchId,
  viewMode,
  zoomLevel,
  panOffset,
  onNodeSelect,
  onBranchSelect,
  onNodeUpdate,
  onBranchUpdate,
  onZoomChange,
  onPanChange,
}: StoryTreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [branches, setBranches] = useState<StoryBranch[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Mock data for development - in real app this would come from the API
  useEffect(() => {
    // Generate mock tree structure
    const mockNodes: TreeNode[] = [
      {
        id: '1',
        story_id: story.id,
        content: 'The detective arrived at the mysterious mansion on a stormy night...',
        author_id: story.author_id,
        position_order: 0,
        node_type: 'story',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: { x: 400, y: 50 },
        level: 0,
        children: [],
      },
      {
        id: '2',
        story_id: story.id,
        content: 'She decided to investigate the strange sounds coming from upstairs.',
        author_id: story.author_id,
        position_order: 1,
        node_type: 'choice',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: { x: 200, y: 200 },
        level: 1,
        children: [],
      },
      {
        id: '3',
        story_id: story.id,
        content: 'Instead, she chose to examine the old library first.',
        author_id: story.author_id,
        position_order: 2,
        node_type: 'choice',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: { x: 600, y: 200 },
        level: 1,
        children: [],
      },
      {
        id: '4',
        story_id: story.id,
        content: 'The creaking floorboards revealed a hidden passage behind the bookshelf.',
        author_id: story.author_id,
        position_order: 3,
        node_type: 'story',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: { x: 100, y: 350 },
        level: 2,
        children: [],
      },
      {
        id: '5',
        story_id: story.id,
        content: 'A portrait on the wall seemed to be watching her every move.',
        author_id: story.author_id,
        position_order: 4,
        node_type: 'story',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: { x: 300, y: 350 },
        level: 2,
        children: [],
      },
    ];

    const mockBranches: StoryBranch[] = [
      {
        id: 'b1',
        story_id: story.id,
        from_node_id: '1',
        to_node_id: '2',
        label: 'Investigate upstairs',
        branch_type: 'character-driven',
        selection_count: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'b2',
        story_id: story.id,
        from_node_id: '1',
        to_node_id: '3',
        label: 'Explore the library',
        branch_type: 'procedural',
        selection_count: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'b3',
        story_id: story.id,
        from_node_id: '2',
        to_node_id: '4',
        label: 'Follow the sounds',
        branch_type: 'escalation',
        selection_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'b4',
        story_id: story.id,
        from_node_id: '2',
        to_node_id: '5',
        label: 'Notice the portrait',
        branch_type: 'plot-twist',
        selection_count: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    setNodes(mockNodes);
    setBranches(mockBranches);
  }, [story.id]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse event handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      onPanChange(newPan);
    }
  }, [isDragging, dragStart, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(3, zoomLevel + delta));
    onZoomChange(newZoom);
  }, [zoomLevel, onZoomChange]);

  const handleZoomIn = () => {
    onZoomChange(Math.min(3, zoomLevel * 1.2));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(0.1, zoomLevel / 1.2));
  };

  const handleZoomReset = () => {
    onZoomChange(1);
    onPanChange({ x: 0, y: 0 });
  };

  // Get node type icon
  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'story': return 'book';
      case 'choice': return 'git-branch';
      case 'ending': return 'flag';
      case 'divergence': return 'zap';
      default: return 'book';
    }
  };

  // Get branch type color
  const getBranchColor = (branchType: string) => {
    switch (branchType) {
      case 'character-driven': return '#3B82F6'; // blue
      case 'plot-twist': return '#9333EA'; // purple
      case 'moral-dilemma': return '#DC2626'; // red
      case 'procedural': return '#059669'; // green
      case 'escalation': return '#D97706'; // orange
      case 'de-escalation': return '#0891B2'; // cyan
      default: return '#6B7280'; // gray
    }
  };

  // Calculate connection path between nodes
  const getConnectionPath = (fromNode: TreeNode, toNode: TreeNode): string => {
    const startX = fromNode.position.x + 150; // Node width / 2
    const startY = fromNode.position.y + 40; // Node height
    const endX = toNode.position.x + 150;
    const endY = toNode.position.y;

    const midY = startY + (endY - startY) / 2;

    return `M ${startX} ${startY} 
            C ${startX} ${midY} 
              ${endX} ${midY} 
              ${endX} ${endY}`;
  };

  if (viewMode === 'linear') {
    return (
      <div className="p-6 space-y-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onNodeSelect(node.id)}
            className={cn(
              'story-node cursor-pointer',
              selectedNodeId === node.id && 'active'
            )}
          >
            <div className="flex items-start space-x-3">
              <Icon name={getNodeIcon(node.node_type)} className="h-5 w-5 mt-1 text-blue-600" />
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white">{node.content}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="outline">{node.node_type}</Badge>
                  <span className="text-xs text-gray-500">Level {node.level}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === 'outline') {
    return (
      <div className="p-6">
        <div className="space-y-2">
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => onNodeSelect(node.id)}
              className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ paddingLeft: `${node.level * 24 + 8}px` }}
            >
              <Icon name={getNodeIcon(node.node_type)} className="h-4 w-4 text-blue-600" />
              <span className={cn(
                'flex-1 text-sm',
                selectedNodeId === node.id ? 'font-medium text-blue-600' : 'text-gray-700 dark:text-gray-300'
              )}>
                {node.content.substring(0, 100)}...
              </span>
              <Badge variant="outline" className="text-xs">{node.node_type}</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tree view (default)
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col space-y-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
        <Button onClick={handleZoomIn} variant="ghost" size="sm">
          <Icon name="plus" className="h-4 w-4" />
        </Button>
        <Button onClick={handleZoomOut} variant="ghost" size="sm">
          <Icon name="minus" className="h-4 w-4" />
        </Button>
        <Button onClick={handleZoomReset} variant="ghost" size="sm">
          <Icon name="refresh" className="h-4 w-4" />
        </Button>
        <div className="text-xs text-center text-gray-500 px-2">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Tree Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            width: '2000px',
            height: '1500px',
          }}
        >
          {/* SVG for connections */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            width="2000"
            height="1500"
          >
            {branches.map((branch) => {
              const fromNode = nodes.find(n => n.id === branch.from_node_id);
              const toNode = nodes.find(n => n.id === branch.to_node_id);
              
              if (!fromNode || !toNode) return null;

              return (
                <g key={branch.id}>
                  <path
                    d={getConnectionPath(fromNode, toNode)}
                    stroke={getBranchColor(branch.branch_type)}
                    strokeWidth={selectedBranchId === branch.id ? 3 : 2}
                    fill="none"
                    className="cursor-pointer hover:stroke-width-3"
                    onClick={() => onBranchSelect(branch.id)}
                  />
                  {/* Branch label */}
                  <text
                    x={(fromNode.position.x + toNode.position.x) / 2 + 150}
                    y={(fromNode.position.y + toNode.position.y) / 2 + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400 pointer-events-none"
                  >
                    {branch.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Story Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={cn(
                'absolute bg-white dark:bg-gray-800 rounded-lg border-2 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl',
                selectedNodeId === node.id
                  ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              )}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: '300px',
                minHeight: '80px',
              }}
              onClick={() => onNodeSelect(node.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Icon 
                    name={getNodeIcon(node.node_type)} 
                    className="h-5 w-5 text-blue-600 flex-shrink-0" 
                  />
                  <Badge variant="outline" className="text-xs ml-2">
                    {node.node_type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
                  {node.content}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Level {node.level}</span>
                  <span>Node {node.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini-map (optional) */}
      <div className="absolute bottom-4 right-4 w-48 h-32 bg-white dark:bg-gray-800 rounded border shadow-lg opacity-80 hover:opacity-100 transition-opacity">
        <div className="w-full h-full relative overflow-hidden">
          <div className="text-xs text-gray-500 p-1">Mini-map</div>
          {/* Simplified view of the tree */}
          <div className="absolute inset-2 top-6">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={cn(
                  'absolute w-2 h-2 rounded',
                  selectedNodeId === node.id ? 'bg-blue-500' : 'bg-gray-400'
                )}
                style={{
                  left: `${(node.position.x / 2000) * 100}%`,
                  top: `${(node.position.y / 1500) * 100}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
