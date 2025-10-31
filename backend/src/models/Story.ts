import { db } from '@/database/connection';
import { logger } from '@/utils/logger';

export interface StoryData {
  id: string;
  title: string;
  description?: string;
  author_id: string;
  root_node_id?: string;
  genre?: string;
  tone?: string;
  audience_age?: string;
  is_public: boolean;
  is_collaborative: boolean;
  created_at: Date;
  updated_at: Date;
  metadata: any;
}

export interface CreateStoryData {
  title: string;
  description?: string;
  author_id: string;
  genre?: string;
  tone?: string;
  audience_age?: string;
  is_public?: boolean;
  is_collaborative?: boolean;
  metadata?: any;
}

export interface UpdateStoryData {
  title?: string;
  description?: string;
  genre?: string;
  tone?: string;
  audience_age?: string;
  is_public?: boolean;
  is_collaborative?: boolean;
  metadata?: any;
}

export interface StoryWithDetails extends StoryData {
  author_username: string;
  author_display_name: string;
  node_count: number;
  collaborator_count: number;
  tags: string[];
}

export interface StoryFilters {
  genre?: string;
  tone?: string;
  audience_age?: string;
  author_id?: string;
  is_public?: boolean;
  search?: string;
  tags?: string[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

export class Story {
  private static tableName = 'stories';

  /**
   * Create a new story
   */
  static async create(storyData: CreateStoryData): Promise<StoryData> {
    try {
      const sql = `
        INSERT INTO ${this.tableName} (
          title, description, author_id, genre, tone, audience_age,
          is_public, is_collaborative, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        storyData.title,
        storyData.description,
        storyData.author_id,
        storyData.genre,
        storyData.tone,
        storyData.audience_age,
        storyData.is_public ?? false,
        storyData.is_collaborative ?? false,
        JSON.stringify(storyData.metadata || {}),
      ];

      const result = await db.query(sql, values);
      const story = result.rows[0];

      logger.info('Story created successfully', {
        storyId: story.id,
        title: story.title,
        authorId: story.author_id,
      });

      return story;
    } catch (error) {
      logger.error('Failed to create story', {
        error,
        authorId: storyData.author_id,
        title: storyData.title,
      });
      throw error;
    }
  }

  /**
   * Find story by ID
   */
  static async findById(id: string, includePrivate: boolean = false): Promise<StoryData | null> {
    try {
      let sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const values = [id];

      if (!includePrivate) {
        sql += ` AND is_public = true`;
      }

      const result = await db.query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find story by ID', { error, storyId: id });
      throw error;
    }
  }

  /**
   * Find story with full details
   */
  static async findByIdWithDetails(id: string, includePrivate: boolean = false): Promise<StoryWithDetails | null> {
    try {
      let sql = `
        SELECT 
          s.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM story_nodes WHERE story_id = s.id) as node_count,
          (SELECT COUNT(*) FROM story_collaborators WHERE story_id = s.id) as collaborator_count,
          COALESCE(
            (SELECT ARRAY_AGG(tag) FROM story_tags WHERE story_id = s.id),
            ARRAY[]::varchar[]
          ) as tags
        FROM ${this.tableName} s
        JOIN users u ON s.author_id = u.id
        WHERE s.id = $1
      `;

      const values = [id];

      if (!includePrivate) {
        sql += ` AND s.is_public = true`;
      }

      const result = await db.query(sql, values);
      const story = result.rows[0];

      if (story) {
        story.node_count = parseInt(story.node_count) || 0;
        story.collaborator_count = parseInt(story.collaborator_count) || 0;
      }

      return story || null;
    } catch (error) {
      logger.error('Failed to find story with details', { error, storyId: id });
      throw error;
    }
  }

  /**
   * Update story
   */
  static async update(id: string, updateData: UpdateStoryData): Promise<StoryData | null> {
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
      const updatedStory = result.rows[0];

      if (updatedStory) {
        logger.info('Story updated successfully', {
          storyId: id,
          updatedFields: Object.keys(updateData),
        });
      }

      return updatedStory || null;
    } catch (error) {
      logger.error('Failed to update story', { error, storyId: id, updateData });
      throw error;
    }
  }

  /**
   * Delete story and all related data
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // The database will handle cascading deletes for related data
      const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
      const result = await db.query(sql, [id]);

      if (result.rowCount && result.rowCount > 0) {
        logger.info('Story deleted successfully', { storyId: id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete story', { error, storyId: id });
      throw error;
    }
  }

  /**
   * Set root node for story
   */
  static async setRootNode(id: string, nodeId: string): Promise<boolean> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET root_node_id = $1, updated_at = NOW()
        WHERE id = $2
      `;

      const result = await db.query(sql, [nodeId, id]);

      if (result.rowCount && result.rowCount > 0) {
        logger.info('Story root node updated', { storyId: id, rootNodeId: nodeId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to set story root node', { error, storyId: id, nodeId });
      throw error;
    }
  }

  /**
   * Find stories with pagination and filters
   */
  static async findMany(
    filters: StoryFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ stories: StoryWithDetails[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'updated_at',
        sortOrder = 'DESC',
      } = pagination;

      const offset = (page - 1) * limit;
      const whereClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build WHERE clause
      if (!filters.author_id) {
        whereClauses.push('s.is_public = true');
      }

      if (filters.genre) {
        whereClauses.push(`s.genre = $${paramIndex}`);
        values.push(filters.genre);
        paramIndex++;
      }

      if (filters.tone) {
        whereClauses.push(`s.tone = $${paramIndex}`);
        values.push(filters.tone);
        paramIndex++;
      }

      if (filters.audience_age) {
        whereClauses.push(`s.audience_age = $${paramIndex}`);
        values.push(filters.audience_age);
        paramIndex++;
      }

      if (filters.author_id) {
        whereClauses.push(`s.author_id = $${paramIndex}`);
        values.push(filters.author_id);
        paramIndex++;
      }

      if (filters.search) {
        whereClauses.push(`(s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`);
        values.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.tags && filters.tags.length > 0) {
        whereClauses.push(`EXISTS (
          SELECT 1 FROM story_tags st 
          WHERE st.story_id = s.id 
          AND st.tag = ANY($${paramIndex})
        )`);
        values.push(filters.tags);
        paramIndex++;
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query
      const countSql = `
        SELECT COUNT(*) 
        FROM ${this.tableName} s
        JOIN users u ON s.author_id = u.id
        ${whereClause}
      `;
      const countResult = await db.query(countSql, values);
      const total = parseInt(countResult.rows[0].count);

      // Data query
      const dataSql = `
        SELECT 
          s.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM story_nodes WHERE story_id = s.id) as node_count,
          (SELECT COUNT(*) FROM story_collaborators WHERE story_id = s.id) as collaborator_count,
          COALESCE(
            (SELECT ARRAY_AGG(tag) FROM story_tags WHERE story_id = s.id),
            ARRAY[]::varchar[]
          ) as tags
        FROM ${this.tableName} s
        JOIN users u ON s.author_id = u.id
        ${whereClause}
        ORDER BY s.${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      values.push(limit, offset);

      const dataResult = await db.query(dataSql, values);
      const stories = dataResult.rows.map(story => ({
        ...story,
        node_count: parseInt(story.node_count) || 0,
        collaborator_count: parseInt(story.collaborator_count) || 0,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        stories,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to find stories', { error, filters, pagination });
      throw error;
    }
  }

  /**
   * Find user's stories (including private)
   */
  static async findByAuthor(
    authorId: string,
    pagination: PaginationOptions = {}
  ): Promise<{ stories: StoryWithDetails[]; total: number; page: number; totalPages: number }> {
    return this.findMany({ author_id: authorId }, pagination);
  }

  /**
   * Find collaborative stories for user
   */
  static async findCollaborativeByUser(
    userId: string,
    pagination: PaginationOptions = {}
  ): Promise<{ stories: StoryWithDetails[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'updated_at',
        sortOrder = 'DESC',
      } = pagination;

      const offset = (page - 1) * limit;

      // Count query
      const countSql = `
        SELECT COUNT(*) 
        FROM ${this.tableName} s
        JOIN story_collaborators sc ON s.id = sc.story_id
        WHERE sc.user_id = $1
      `;
      const countResult = await db.query(countSql, [userId]);
      const total = parseInt(countResult.rows[0].count);

      // Data query
      const dataSql = `
        SELECT 
          s.*,
          u.username as author_username,
          u.display_name as author_display_name,
          (SELECT COUNT(*) FROM story_nodes WHERE story_id = s.id) as node_count,
          (SELECT COUNT(*) FROM story_collaborators WHERE story_id = s.id) as collaborator_count,
          COALESCE(
            (SELECT ARRAY_AGG(tag) FROM story_tags WHERE story_id = s.id),
            ARRAY[]::varchar[]
          ) as tags,
          sc.role as collaborator_role
        FROM ${this.tableName} s
        JOIN users u ON s.author_id = u.id
        JOIN story_collaborators sc ON s.id = sc.story_id
        WHERE sc.user_id = $1
        ORDER BY s.${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;

      const dataResult = await db.query(dataSql, [userId, limit, offset]);
      const stories = dataResult.rows.map(story => ({
        ...story,
        node_count: parseInt(story.node_count) || 0,
        collaborator_count: parseInt(story.collaborator_count) || 0,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        stories,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to find collaborative stories', { error, userId, pagination });
      throw error;
    }
  }

  /**
   * Check if user can access story
   */
  static async canUserAccess(storyId: string, userId?: string): Promise<boolean> {
    try {
      let sql = `
        SELECT 1 FROM ${this.tableName} 
        WHERE id = $1 AND (is_public = true OR author_id = $2)
      `;
      let values = [storyId, userId];

      if (userId) {
        sql += ` OR EXISTS (
          SELECT 1 FROM story_collaborators 
          WHERE story_id = $1 AND user_id = $2
        )`;
      }

      const result = await db.query(sql, values);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check story access', { error, storyId, userId });
      return false;
    }
  }

  /**
   * Check if user can edit story
   */
  static async canUserEdit(storyId: string, userId: string): Promise<boolean> {
    try {
      const sql = `
        SELECT 1 FROM ${this.tableName} 
        WHERE id = $1 AND author_id = $2
        UNION
        SELECT 1 FROM story_collaborators 
        WHERE story_id = $1 AND user_id = $2 AND role IN ('owner', 'editor')
      `;

      const result = await db.query(sql, [storyId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check story edit permission', { error, storyId, userId });
      return false;
    }
  }

  /**
   * Get story statistics
   */
  static async getStats(id: string): Promise<{
    nodeCount: number;
    branchCount: number;
    collaboratorCount: number;
    viewCount: number;
    lastActivity: Date;
  }> {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM story_nodes WHERE story_id = $1) as node_count,
          (SELECT COUNT(*) FROM story_branches WHERE story_id = $1) as branch_count,
          (SELECT COUNT(*) FROM story_collaborators WHERE story_id = $1) as collaborator_count,
          (SELECT COUNT(*) FROM user_analytics WHERE story_id = $1 AND event_type = 'story_viewed') as view_count,
          COALESCE(
            (SELECT MAX(created_at) FROM story_nodes WHERE story_id = $1),
            (SELECT updated_at FROM ${this.tableName} WHERE id = $1)
          ) as last_activity
        FROM ${this.tableName}
        WHERE id = $1
      `;

      const result = await db.query(sql, [id]);
      const stats = result.rows[0];

      return {
        nodeCount: parseInt(stats.node_count) || 0,
        branchCount: parseInt(stats.branch_count) || 0,
        collaboratorCount: parseInt(stats.collaborator_count) || 0,
        viewCount: parseInt(stats.view_count) || 0,
        lastActivity: stats.last_activity,
      };
    } catch (error) {
      logger.error('Failed to get story statistics', { error, storyId: id });
      throw error;
    }
  }
}
