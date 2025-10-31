export interface User {
  id: string;
  username: string;
  email: string;
  subscriptionTier: 'free' | 'premium' | 'professional';
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  author_id: string;
  author?: User;
  root_node_id?: string;
  genre?: string;
  tone?: string;
  audience_age?: string;
  is_public: boolean;
  is_collaborative: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  stats?: StoryStats;
}

export interface StoryStats {
  node_count: number;
  branch_count: number;
  collaborator_count: number;
  view_count: number;
  like_count: number;
  last_activity: string;
}

export interface StoryNode {
  id: string;
  story_id: string;
  content: string;
  author_id: string;
  author?: User;
  parent_node_id?: string;
  position_order: number;
  sync_id?: string;
  sync_offset?: number;
  node_type: 'story' | 'choice' | 'ending' | 'divergence';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  children?: StoryNode[];
  branches?: StoryBranch[];
}

export interface StoryBranch {
  id: string;
  story_id: string;
  from_node_id: string;
  to_node_id: string;
  label: string;
  branch_type: 'character-driven' | 'plot-twist' | 'moral-dilemma' | 'procedural' | 'escalation' | 'de-escalation';
  impact_score?: number;
  selection_count: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  from_node?: StoryNode;
  to_node?: StoryNode;
}

export interface StoryTree {
  root: StoryNode;
  nodes: Map<string, StoryNode>;
  branches: StoryBranch[];
  maxDepth: number;
}

export interface CreateStoryData {
  title: string;
  description?: string;
  content?: string;
  genre?: string;
  tone?: string;
  audience_age?: string;
  is_public?: boolean;
  is_collaborative?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateStoryData {
  title?: string;
  description?: string;
  genre?: string;
  tone?: string;
  audience_age?: string;
  is_public?: boolean;
  is_collaborative?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateStoryNodeData {
  content: string;
  parent_node_id?: string;
  position_order?: number;
  sync_id?: string;
  sync_offset?: number;
  node_type?: 'story' | 'choice' | 'ending' | 'divergence';
  metadata?: Record<string, any>;
}

export interface UpdateStoryNodeData {
  content?: string;
  position_order?: number;
  sync_id?: string;
  sync_offset?: number;
  node_type?: 'story' | 'choice' | 'ending' | 'divergence';
  metadata?: Record<string, any>;
}

export interface CreateStoryBranchData {
  from_node_id: string;
  to_node_id: string;
  label: string;
  branch_type?: 'character-driven' | 'plot-twist' | 'moral-dilemma' | 'procedural' | 'escalation' | 'de-escalation';
  impact_score?: number;
  metadata?: Record<string, any>;
}

export interface UpdateStoryBranchData {
  label?: string;
  branch_type?: 'character-driven' | 'plot-twist' | 'moral-dilemma' | 'procedural' | 'escalation' | 'de-escalation';
  impact_score?: number;
  metadata?: Record<string, any>;
}

// UI-specific types
export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeLayout extends StoryNode {
  position: NodePosition;
  level: number;
  isExpanded: boolean;
}

export interface BranchLayout extends StoryBranch {
  path: string; // SVG path for drawing the connection
}

export interface StoryTreeLayout {
  nodes: NodeLayout[];
  branches: BranchLayout[];
  bounds: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// Editor state types
export interface EditorState {
  story: Story | null;
  selectedNodeId: string | null;
  selectedBranchId: string | null;
  isEditing: boolean;
  isDirty: boolean;
  viewMode: 'tree' | 'linear' | 'outline';
  zoomLevel: number;
  panOffset: { x: number; y: number };
}

export interface EditorAction {
  type: 'SET_STORY' | 'SELECT_NODE' | 'SELECT_BRANCH' | 'START_EDITING' | 'STOP_EDITING' | 
        'SET_DIRTY' | 'SET_VIEW_MODE' | 'SET_ZOOM' | 'SET_PAN' | 'RESET';
  payload?: any;
}

// API response types
export interface StoryResponse {
  success: boolean;
  story: Story;
  stats?: StoryStats;
  tree_structure?: StoryTree;
  metadata?: {
    user_can_edit: boolean;
  };
}

export interface StoriesResponse {
  success: boolean;
  stories: Story[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  metadata?: {
    filters_applied: Record<string, any>;
    total_stories: number;
  };
}

export interface NodeResponse {
  success: boolean;
  node: StoryNode;
  message?: string;
}

export interface BranchResponse {
  success: boolean;
  branch: StoryBranch;
  message?: string;
}
