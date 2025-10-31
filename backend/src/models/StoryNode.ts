import { db } from '@/database/connection';
import { logger } from '@/utils/logger';

export interface StoryNodeData {
  id: string;
  story_id: string;
  content: string;
  author_id: string;
  parent_node_id?: string;
  position_order: number;
  sync_id?: string;
  sync_offset: number;
  node_type: string;
  created_at: Date;
  updated_at: Date;
  metadata: any;
}

export interface CreateStoryNodeData {
  story_id: string;
  content: string;
  author_id: string;
  parent_node_id?: string;
  position_order?: number;
  sync_id?: string;
  sync_offset?: number;
  node_type?: string;
  metadata?: any;
}

export interface UpdateStoryNodeData {
  content?: string;
  position_order?: number;
  sync_id?: string;
  sync_offset?: number;
  node_type?: string;
  metadata?: any;
}

export interface StoryNodeWithDetails extends StoryNodeData {
  author_username: string;
  author_display_name: string;
  child_count: number;
  branch_count: number;
}

export interface NodeTreeStructure {
  node: StoryNodeWithDetails;
  children: NodeTreeStructure[];
  branches: BranchInfo[];
}

export interface BranchInfo {
  id: string;
  label: string;
  branch_type: string;
  to_node_id: string;
  impact_score: number;
}

export class StoryNode {
  private static tableName = 'story_nodes';

  /**
   * Create a new story node
   */
  static async create(nodeData: CreateStoryNodeData): Promise<StoryNodeData> {
    try {
      const sql = `
        INSERT INTO ${this.tableName} (
          story_id, content, author_id, parent_node_id, position_order,
          sync_id, sync_offset, node_type, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        nodeData.story_id,
        nodeData.content,
        nodeData.author_id,
        nodeData.parent_node_id,
        nodeData.position_order ?? 0,
        nodeData.sync_id,
        nodeData.sync_offset ?? 0,
        nodeData.node_type ?? 'story',
        JSON.stringify(nodeData.metadata || {}),
      ];

      const result = await db.query(sql, values);
      const node = result.rows[0];

      logger.info('Story node created successfully', {
        nodeId: node.id,
        storyId: node.story_id,
        authorId: node.author_id,
        contentLength: node.content.length,
      });

      return node;
    } catch (error) {
      logger.error('Failed to create story node', {
        error,
        storyId: nodeData.story_id,
        authorId: nodeData.author_id,
      });
      throw error;
    }
  }

  /**
   * Find node by ID
   */
  static async findById(id: string): Promise<StoryNodeData | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await db.query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find story node by ID', { error, nodeId: id });
      throw error;
    }
  }

  /**
   * Find node with details
   */
  static async findByIdWithDetails(id: string): Promise<StoryNodeWithDetails | null> {
    try {
      const sql = `
        SELECT 
          sn.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = sn.id) as child_count,
          (SELECT COUNT(*) FROM story_branches WHERE from_node_id = sn.id) as branch_count
        FROM ${this.tableName} sn
        JOIN users u ON sn.author_id = u.id
        WHERE sn.id = $1
      `;

      const result = await db.query(sql, [id]);
      const node = result.rows[0];

      if (node) {
        node.child_count = parseInt(node.child_count) || 0;
        node.branch_count = parseInt(node.branch_count) || 0;
      }

      return node || null;
    } catch (error) {
      logger.error('Failed to find story node with details', { error, nodeId: id });
      throw error;
    }
  }

  /**
   * Update story node
   */
  static async update(id: string, updateData: UpdateStoryNodeData): Promise<StoryNodeData | null> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'metadata') {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No fields to update');
      }

      // Always update the updated_at timestamp
      setClause.push(`updated_at = NOW()`);
      values.push(id);

      const sql = `
        UPDATE ${this.tableName} 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(sql, values);
      const updatedNode = result.rows[0];

      if (updatedNode) {
        logger.info('Story node updated successfully', {
          nodeId: id,
          updatedFields: Object.keys(updateData),
        });
      }

      return updatedNode || null;
    } catch (error) {
      logger.error('Failed to update story node', { error, nodeId: id, updateData });
      throw error;
    }
  }

  /**
   * Delete story node and handle orphaned children
   */
  static async delete(id: string, reassignParent?: string): Promise<boolean> {
    try {
      return await db.transaction(async (client) => {
        // If reassignParent is provided, update children to point to new parent
        if (reassignParent) {
          await client.query(
            `UPDATE ${this.tableName} SET parent_node_id = $1 WHERE parent_node_id = $2`,
            [reassignParent, id]
          );
        } else {
          // Delete all child nodes (cascading delete)
          await client.query(
            `DELETE FROM ${this.tableName} WHERE parent_node_id = $1`,
            [id]
          );
        }

        // Delete the node itself
        const result = await client.query(
          `DELETE FROM ${this.tableName} WHERE id = $1`,
          [id]
        );

        if (result.rowCount && result.rowCount > 0) {
          logger.info('Story node deleted successfully', { nodeId: id });
          return true;
        }

        return false;
      });
    } catch (error) {
      logger.error('Failed to delete story node', { error, nodeId: id });
      throw error;
    }
  }

  /**
   * Find all nodes in a story
   */
  static async findByStory(storyId: string): Promise<StoryNodeWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sn.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = sn.id) as child_count,
          (SELECT COUNT(*) FROM story_branches WHERE from_node_id = sn.id) as branch_count
        FROM ${this.tableName} sn
        JOIN users u ON sn.author_id = u.id
        WHERE sn.story_id = $1
        ORDER BY sn.position_order ASC, sn.created_at ASC
      `;

      const result = await db.query(sql, [storyId]);
      const nodes = result.rows.map(node => ({
        ...node,
        child_count: parseInt(node.child_count) || 0,
        branch_count: parseInt(node.branch_count) || 0,
      }));

      return nodes;
    } catch (error) {
      logger.error('Failed to find story nodes', { error, storyId });
      throw error;
    }
  }

  /**
   * Find child nodes of a parent
   */
  static async findChildren(parentId: string): Promise<StoryNodeWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sn.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = sn.id) as child_count,
          (SELECT COUNT(*) FROM story_branches WHERE from_node_id = sn.id) as branch_count
        FROM ${this.tableName} sn
        JOIN users u ON sn.author_id = u.id
        WHERE sn.parent_node_id = $1
        ORDER BY sn.position_order ASC, sn.created_at ASC
      `;

      const result = await db.query(sql, [parentId]);
      const nodes = result.rows.map(node => ({
        ...node,
        child_count: parseInt(node.child_count) || 0,
        branch_count: parseInt(node.branch_count) || 0,
      }));

      return nodes;
    } catch (error) {
      logger.error('Failed to find child nodes', { error, parentId });
      throw error;
    }
  }

  /**
   * Find root nodes of a story
   */
  static async findRootNodes(storyId: string): Promise<StoryNodeWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sn.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = sn.id) as child_count,
          (SELECT COUNT(*) FROM story_branches WHERE from_node_id = sn.id) as branch_count
        FROM ${this.tableName} sn
        JOIN users u ON sn.author_id = u.id
        WHERE sn.story_id = $1 AND sn.parent_node_id IS NULL
        ORDER BY sn.position_order ASC, sn.created_at ASC
      `;

      const result = await db.query(sql, [storyId]);
      const nodes = result.rows.map(node => ({
        ...node,
        child_count: parseInt(node.child_count) || 0,
        branch_count: parseInt(node.branch_count) || 0,
      }));

      return nodes;
    } catch (error) {
      logger.error('Failed to find root nodes', { error, storyId });
      throw error;
    }
  }

  /**
   * Build tree structure for a story
   */
  static async buildStoryTree(storyId: string): Promise<NodeTreeStructure[]> {
    try {
      // Get all nodes and branches for the story
      const [nodes, branches] = await Promise.all([
        this.findByStory(storyId),
        this.getBranchesForStory(storyId),
      ]);

      // Group branches by from_node_id
      const branchesByNode = branches.reduce((acc, branch) => {
        if (!acc[branch.from_node_id]) {
          acc[branch.from_node_id] = [];
        }
        acc[branch.from_node_id].push({
          id: branch.id,
          label: branch.label,
          branch_type: branch.branch_type,
          to_node_id: branch.to_node_id,
          impact_score: branch.impact_score,
        });
        return acc;
      }, {} as Record<string, BranchInfo[]>);

      // Build tree recursively
      const buildTree = (parentId: string | null): NodeTreeStructure[] => {
        return nodes
          .filter(node => node.parent_node_id === parentId)
          .map(node => ({
            node,
            children: buildTree(node.id),
            branches: branchesByNode[node.id] || [],
          }));
      };

      return buildTree(null);
    } catch (error) {
      logger.error('Failed to build story tree', { error, storyId });
      throw error;
    }
  }

  /**
   * Get branches for a story (helper method)
   */
  private static async getBranchesForStory(storyId: string): Promise<any[]> {
    try {
      const sql = `
        SELECT sb.* FROM story_branches sb
        JOIN ${this.tableName} sn ON sb.from_node_id = sn.id
        WHERE sn.story_id = $1
        ORDER BY sb.impact_score DESC
      `;

      const result = await db.query(sql, [storyId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get branches for story', { error, storyId });
      throw error;
    }
  }

  /**
   * Find nodes by sync_id (for dual perspectives)
   */
  static async findBySyncId(syncId: string): Promise<StoryNodeWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sn.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = sn.id) as child_count,
          (SELECT COUNT(*) FROM story_branches WHERE from_node_id = sn.id) as branch_count
        FROM ${this.tableName} sn
        JOIN users u ON sn.author_id = u.id
        WHERE sn.sync_id = $1
        ORDER BY sn.sync_offset ASC, sn.created_at ASC
      `;

      const result = await db.query(sql, [syncId]);
      const nodes = result.rows.map(node => ({
        ...node,
        child_count: parseInt(node.child_count) || 0,
        branch_count: parseInt(node.branch_count) || 0,
      }));

      return nodes;
    } catch (error) {
      logger.error('Failed to find nodes by sync ID', { error, syncId });
      throw error;
    }
  }

  /**
   * Get node path from root
   */
  static async getNodePath(nodeId: string): Promise<StoryNodeWithDetails[]> {
    try {
      const sql = `
        WITH RECURSIVE node_path AS (
          -- Base case: start with the given node
          SELECT sn.*, u.username as author_username, u.display_name as author_display_name,
                 0 as depth,
                 (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = sn.id) as child_count,
                 (SELECT COUNT(*) FROM story_branches WHERE from_node_id = sn.id) as branch_count
          FROM ${this.tableName} sn
          JOIN users u ON sn.author_id = u.id
          WHERE sn.id = $1
          
          UNION ALL
          
          -- Recursive case: get parent nodes
          SELECT parent.*, u.username as author_username, u.display_name as author_display_name,
                 np.depth + 1 as depth,
                 (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = parent.id) as child_count,
                 (SELECT COUNT(*) FROM story_branches WHERE from_node_id = parent.id) as branch_count
          FROM ${this.tableName} parent
          JOIN users u ON parent.author_id = u.id
          JOIN node_path np ON parent.id = np.parent_node_id
        )
        SELECT * FROM node_path ORDER BY depth DESC
      `;

      const result = await db.query(sql, [nodeId]);
      const nodes = result.rows.map(node => ({
        ...node,
        child_count: parseInt(node.child_count) || 0,
        branch_count: parseInt(node.branch_count) || 0,
      }));

      return nodes;
    } catch (error) {
      logger.error('Failed to get node path', { error, nodeId });
      throw error;
    }
  }

  /**
   * Get node statistics
   */
  static async getStats(nodeId: string): Promise<{
    wordCount: number;
    childCount: number;
    branchCount: number;
    depth: number;
  }> {
    try {
      const node = await this.findById(nodeId);
      if (!node) {
        throw new Error('Node not found');
      }

      // Calculate word count
      const wordCount = node.content.trim().split(/\s+/).length;

      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = $1) as child_count,
          (SELECT COUNT(*) FROM story_branches WHERE from_node_id = $1) as branch_count
      `;

      const result = await db.query(sql, [nodeId]);
      const stats = result.rows[0];

      // Calculate depth by counting ancestors
      const path = await this.getNodePath(nodeId);
      const depth = path.length - 1; // Subtract 1 because path includes the node itself

      return {
        wordCount,
        childCount: parseInt(stats.child_count) || 0,
        branchCount: parseInt(stats.branch_count) || 0,
        depth,
      };
    } catch (error) {
      logger.error('Failed to get node statistics', { error, nodeId });
      throw error;
    }
  }

  /**
   * Search nodes by content
   */
  static async searchInStory(storyId: string, searchTerm: string): Promise<StoryNodeWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sn.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE parent_node_id = sn.id) as child_count,
          (SELECT COUNT(*) FROM story_branches WHERE from_node_id = sn.id) as branch_count,
          ts_rank(to_tsvector('english', sn.content), plainto_tsquery('english', $2)) as rank
        FROM ${this.tableName} sn
        JOIN users u ON sn.author_id = u.id
        WHERE sn.story_id = $1 
        AND to_tsvector('english', sn.content) @@ plainto_tsquery('english', $2)
        ORDER BY rank DESC, sn.created_at ASC
      `;

      const result = await db.query(sql, [storyId, searchTerm]);
      const nodes = result.rows.map(node => ({
        ...node,
        child_count: parseInt(node.child_count) || 0,
        branch_count: parseInt(node.branch_count) || 0,
      }));

      return nodes;
    } catch (error) {
      logger.error('Failed to search nodes in story', { error, storyId, searchTerm });
      throw error;
    }
  }
}
