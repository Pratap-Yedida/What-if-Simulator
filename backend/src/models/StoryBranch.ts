import { db } from '@/database/connection';
import { logger } from '@/utils/logger';

export interface StoryBranchData {
  id: string;
  story_id: string;
  from_node_id: string;
  to_node_id: string;
  label: string;
  branch_type: string;
  impact_score: number;
  selection_count: number;
  created_at: Date;
  metadata: any;
}

export interface CreateStoryBranchData {
  story_id: string;
  from_node_id: string;
  to_node_id: string;
  label: string;
  branch_type?: string;
  impact_score?: number;
  metadata?: any;
}

export interface UpdateStoryBranchData {
  label?: string;
  branch_type?: string;
  impact_score?: number;
  metadata?: any;
}

export interface StoryBranchWithDetails extends StoryBranchData {
  from_node_content_preview: string;
  to_node_content_preview: string;
  story_title: string;
}

export interface BranchAnalytics {
  branch_id: string;
  selection_count: number;
  selection_rate: number;
  average_impact_score: number;
  last_selected: Date | null;
}

export type BranchType = 
  | 'character-driven'
  | 'plot-twist'
  | 'moral-dilemma'
  | 'procedural'
  | 'escalation'
  | 'de-escalation'
  | 'exploration'
  | 'revelation';

export class StoryBranch {
  private static tableName = 'story_branches';

  /**
   * Create a new story branch
   */
  static async create(branchData: CreateStoryBranchData): Promise<StoryBranchData> {
    try {
      const sql = `
        INSERT INTO ${this.tableName} (
          story_id, from_node_id, to_node_id, label, branch_type,
          impact_score, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        branchData.story_id,
        branchData.from_node_id,
        branchData.to_node_id,
        branchData.label,
        branchData.branch_type ?? 'character-driven',
        branchData.impact_score ?? 0.5,
        JSON.stringify(branchData.metadata || {}),
      ];

      const result = await db.query(sql, values);
      const branch = result.rows[0];

      logger.info('Story branch created successfully', {
        branchId: branch.id,
        storyId: branch.story_id,
        fromNodeId: branch.from_node_id,
        toNodeId: branch.to_node_id,
        label: branch.label,
      });

      return branch;
    } catch (error) {
      logger.error('Failed to create story branch', {
        error,
        storyId: branchData.story_id,
        fromNodeId: branchData.from_node_id,
        toNodeId: branchData.to_node_id,
      });
      throw error;
    }
  }

  /**
   * Find branch by ID
   */
  static async findById(id: string): Promise<StoryBranchData | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await db.query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find story branch by ID', { error, branchId: id });
      throw error;
    }
  }

  /**
   * Find branch with details
   */
  static async findByIdWithDetails(id: string): Promise<StoryBranchWithDetails | null> {
    try {
      const sql = `
        SELECT 
          sb.*,
          SUBSTRING(from_node.content, 1, 100) as from_node_content_preview,
          SUBSTRING(to_node.content, 1, 100) as to_node_content_preview,
          s.title as story_title
        FROM ${this.tableName} sb
        JOIN story_nodes from_node ON sb.from_node_id = from_node.id
        JOIN story_nodes to_node ON sb.to_node_id = to_node.id
        JOIN stories s ON sb.story_id = s.id
        WHERE sb.id = $1
      `;

      const result = await db.query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find story branch with details', { error, branchId: id });
      throw error;
    }
  }

  /**
   * Update story branch
   */
  static async update(id: string, updateData: UpdateStoryBranchData): Promise<StoryBranchData | null> {
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

      values.push(id);

      const sql = `
        UPDATE ${this.tableName} 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(sql, values);
      const updatedBranch = result.rows[0];

      if (updatedBranch) {
        logger.info('Story branch updated successfully', {
          branchId: id,
          updatedFields: Object.keys(updateData),
        });
      }

      return updatedBranch || null;
    } catch (error) {
      logger.error('Failed to update story branch', { error, branchId: id, updateData });
      throw error;
    }
  }

  /**
   * Delete story branch
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
      const result = await db.query(sql, [id]);

      if (result.rowCount && result.rowCount > 0) {
        logger.info('Story branch deleted successfully', { branchId: id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete story branch', { error, branchId: id });
      throw error;
    }
  }

  /**
   * Find branches from a specific node
   */
  static async findFromNode(fromNodeId: string): Promise<StoryBranchWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sb.*,
          SUBSTRING(from_node.content, 1, 100) as from_node_content_preview,
          SUBSTRING(to_node.content, 1, 100) as to_node_content_preview,
          s.title as story_title
        FROM ${this.tableName} sb
        JOIN story_nodes from_node ON sb.from_node_id = from_node.id
        JOIN story_nodes to_node ON sb.to_node_id = to_node.id
        JOIN stories s ON sb.story_id = s.id
        WHERE sb.from_node_id = $1
        ORDER BY sb.impact_score DESC, sb.created_at ASC
      `;

      const result = await db.query(sql, [fromNodeId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find branches from node', { error, fromNodeId });
      throw error;
    }
  }

  /**
   * Find branches to a specific node
   */
  static async findToNode(toNodeId: string): Promise<StoryBranchWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sb.*,
          SUBSTRING(from_node.content, 1, 100) as from_node_content_preview,
          SUBSTRING(to_node.content, 1, 100) as to_node_content_preview,
          s.title as story_title
        FROM ${this.tableName} sb
        JOIN story_nodes from_node ON sb.from_node_id = from_node.id
        JOIN story_nodes to_node ON sb.to_node_id = to_node.id
        JOIN stories s ON sb.story_id = s.id
        WHERE sb.to_node_id = $1
        ORDER BY sb.impact_score DESC, sb.created_at ASC
      `;

      const result = await db.query(sql, [toNodeId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find branches to node', { error, toNodeId });
      throw error;
    }
  }

  /**
   * Find all branches in a story
   */
  static async findByStory(storyId: string): Promise<StoryBranchWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sb.*,
          SUBSTRING(from_node.content, 1, 100) as from_node_content_preview,
          SUBSTRING(to_node.content, 1, 100) as to_node_content_preview,
          s.title as story_title
        FROM ${this.tableName} sb
        JOIN story_nodes from_node ON sb.from_node_id = from_node.id
        JOIN story_nodes to_node ON sb.to_node_id = to_node.id
        JOIN stories s ON sb.story_id = s.id
        WHERE sb.story_id = $1
        ORDER BY sb.impact_score DESC, sb.created_at ASC
      `;

      const result = await db.query(sql, [storyId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find branches in story', { error, storyId });
      throw error;
    }
  }

  /**
   * Increment selection count when a branch is chosen
   */
  static async incrementSelection(id: string): Promise<boolean> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET selection_count = selection_count + 1
        WHERE id = $1
        RETURNING selection_count
      `;

      const result = await db.query(sql, [id]);

      if (result.rowCount && result.rowCount > 0) {
        logger.info('Branch selection count incremented', {
          branchId: id,
          newCount: result.rows[0].selection_count,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to increment branch selection count', { error, branchId: id });
      throw error;
    }
  }

  /**
   * Get branch analytics for a story
   */
  static async getStoryBranchAnalytics(storyId: string): Promise<BranchAnalytics[]> {
    try {
      const sql = `
        SELECT 
          sb.id as branch_id,
          sb.selection_count,
          CASE 
            WHEN total_selections.total > 0 
            THEN ROUND((sb.selection_count::numeric / total_selections.total::numeric) * 100, 2)
            ELSE 0 
          END as selection_rate,
          sb.impact_score as average_impact_score,
          analytics.last_selected
        FROM ${this.tableName} sb
        CROSS JOIN (
          SELECT COALESCE(SUM(selection_count), 1) as total 
          FROM ${this.tableName} 
          WHERE story_id = $1
        ) total_selections
        LEFT JOIN (
          SELECT 
            event_data->>'branch_id' as branch_id,
            MAX(created_at) as last_selected
          FROM user_analytics 
          WHERE story_id = $1 
          AND event_type = 'branch_selected'
          AND event_data->>'branch_id' IS NOT NULL
          GROUP BY event_data->>'branch_id'
        ) analytics ON sb.id = analytics.branch_id
        WHERE sb.story_id = $1
        ORDER BY sb.selection_count DESC, sb.impact_score DESC
      `;

      const result = await db.query(sql, [storyId]);
      return result.rows.map(row => ({
        ...row,
        selection_rate: parseFloat(row.selection_rate) || 0,
        average_impact_score: parseFloat(row.average_impact_score) || 0,
      }));
    } catch (error) {
      logger.error('Failed to get story branch analytics', { error, storyId });
      throw error;
    }
  }

  /**
   * Get popular branches across all stories
   */
  static async getPopularBranches(limit: number = 10): Promise<StoryBranchWithDetails[]> {
    try {
      const sql = `
        SELECT 
          sb.*,
          SUBSTRING(from_node.content, 1, 100) as from_node_content_preview,
          SUBSTRING(to_node.content, 1, 100) as to_node_content_preview,
          s.title as story_title
        FROM ${this.tableName} sb
        JOIN story_nodes from_node ON sb.from_node_id = from_node.id
        JOIN story_nodes to_node ON sb.to_node_id = to_node.id
        JOIN stories s ON sb.story_id = s.id
        WHERE s.is_public = true
        ORDER BY sb.selection_count DESC, sb.impact_score DESC
        LIMIT $1
      `;

      const result = await db.query(sql, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get popular branches', { error, limit });
      throw error;
    }
  }

  /**
   * Find branches by type
   */
  static async findByType(branchType: BranchType, storyId?: string): Promise<StoryBranchWithDetails[]> {
    try {
      let sql = `
        SELECT 
          sb.*,
          SUBSTRING(from_node.content, 1, 100) as from_node_content_preview,
          SUBSTRING(to_node.content, 1, 100) as to_node_content_preview,
          s.title as story_title
        FROM ${this.tableName} sb
        JOIN story_nodes from_node ON sb.from_node_id = from_node.id
        JOIN story_nodes to_node ON sb.to_node_id = to_node.id
        JOIN stories s ON sb.story_id = s.id
        WHERE sb.branch_type = $1
      `;

      const values = [branchType];

      if (storyId) {
        sql += ` AND sb.story_id = $2`;
        values.push(storyId);
      } else {
        sql += ` AND s.is_public = true`;
      }

      sql += ` ORDER BY sb.impact_score DESC, sb.selection_count DESC`;

      const result = await db.query(sql, values);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find branches by type', { error, branchType, storyId });
      throw error;
    }
  }

  /**
   * Get branch type distribution for a story
   */
  static async getBranchTypeDistribution(storyId: string): Promise<Array<{ branch_type: string; count: number; percentage: number }>> {
    try {
      const sql = `
        SELECT 
          branch_type,
          COUNT(*) as count,
          ROUND((COUNT(*)::numeric / total.total_count::numeric) * 100, 2) as percentage
        FROM ${this.tableName} sb
        CROSS JOIN (
          SELECT COUNT(*) as total_count 
          FROM ${this.tableName} 
          WHERE story_id = $1
        ) total
        WHERE sb.story_id = $1
        GROUP BY branch_type, total.total_count
        ORDER BY count DESC
      `;

      const result = await db.query(sql, [storyId]);
      return result.rows.map(row => ({
        branch_type: row.branch_type,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage) || 0,
      }));
    } catch (error) {
      logger.error('Failed to get branch type distribution', { error, storyId });
      throw error;
    }
  }

  /**
   * Find orphaned branches (branches where nodes don't exist)
   */
  static async findOrphanedBranches(): Promise<StoryBranchData[]> {
    try {
      const sql = `
        SELECT sb.* FROM ${this.tableName} sb
        LEFT JOIN story_nodes from_node ON sb.from_node_id = from_node.id
        LEFT JOIN story_nodes to_node ON sb.to_node_id = to_node.id
        WHERE from_node.id IS NULL OR to_node.id IS NULL
      `;

      const result = await db.query(sql);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find orphaned branches', { error });
      throw error;
    }
  }

  /**
   * Clean up orphaned branches
   */
  static async cleanupOrphanedBranches(): Promise<number> {
    try {
      const sql = `
        DELETE FROM ${this.tableName}
        WHERE id IN (
          SELECT sb.id FROM ${this.tableName} sb
          LEFT JOIN story_nodes from_node ON sb.from_node_id = from_node.id
          LEFT JOIN story_nodes to_node ON sb.to_node_id = to_node.id
          WHERE from_node.id IS NULL OR to_node.id IS NULL
        )
      `;

      const result = await db.query(sql);
      const deletedCount = result.rowCount || 0;

      logger.info('Orphaned branches cleaned up', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to clean up orphaned branches', { error });
      throw error;
    }
  }

  /**
   * Get branch statistics
   */
  static async getStats(branchId: string): Promise<{
    selectionCount: number;
    impactScore: number;
    createdDaysAgo: number;
    averageSelectionRate: number;
  }> {
    try {
      const branch = await this.findById(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      const sql = `
        SELECT 
          COALESCE(AVG(selection_count), 0) as avg_selection_count
        FROM ${this.tableName}
        WHERE story_id = $1
      `;

      const result = await db.query(sql, [branch.story_id]);
      const avgSelectionCount = parseFloat(result.rows[0].avg_selection_count) || 0;

      const createdDaysAgo = Math.floor(
        (Date.now() - branch.created_at.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        selectionCount: branch.selection_count,
        impactScore: branch.impact_score,
        createdDaysAgo,
        averageSelectionRate: avgSelectionCount > 0 ? (branch.selection_count / avgSelectionCount) : 0,
      };
    } catch (error) {
      logger.error('Failed to get branch statistics', { error, branchId });
      throw error;
    }
  }
}
