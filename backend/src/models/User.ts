import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { passwordService } from '@/utils/password';

export interface UserData {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  avatar_url?: string;
  subscription_tier: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
  avatar_url?: string;
  subscription_tier?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  subscription_tier?: string;
}

export class User {
  private static tableName = 'users';

  /**
   * Create a new user
   */
  static async create(userData: CreateUserData): Promise<UserData> {
    try {
      // Validate password
      const passwordValidation = passwordService.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash password
      const hashedPassword = await passwordService.hashPassword(userData.password);

      const sql = `
        INSERT INTO ${this.tableName} (
          username, email, password_hash, display_name, avatar_url, subscription_tier
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        userData.username,
        userData.email,
        hashedPassword,
        userData.display_name || userData.username,
        userData.avatar_url,
        userData.subscription_tier || 'free'
      ];

      const result = await db.query(sql, values);
      const user = result.rows[0];

      logger.info('User created successfully', { 
        userId: user.id, 
        username: user.username, 
        email: user.email 
      });

      return user;
    } catch (error: any) {
      const errorDetails = {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        detail: error?.detail,
        constraint: error?.constraint,
        username: userData.username,
        email: userData.email,
      };
      
      logger.error('Failed to create user', errorDetails);
      console.error('User.create error:', errorDetails);
      
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<UserData | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = $1 AND is_active = true`;
      const result = await db.query(sql, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by ID', { error, userId: id });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<UserData | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE email = $1 AND is_active = true`;
      const result = await db.query(sql, [email.toLowerCase()]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<UserData | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE username = $1 AND is_active = true`;
      const result = await db.query(sql, [username]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by username', { error, username });
      throw error;
    }
  }

  /**
   * Find user by email or username
   */
  static async findByEmailOrUsername(identifier: string): Promise<UserData | null> {
    try {
      const sql = `
        SELECT * FROM ${this.tableName} 
        WHERE (email = $1 OR username = $1) AND is_active = true
      `;
      const result = await db.query(sql, [identifier.toLowerCase()]);
      
      return result.rows[0] || null;
    } catch (error: any) {
      const errorDetails = {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        detail: error?.detail,
        constraint: error?.constraint,
        identifier,
      };
      
      logger.error('Failed to find user by email or username', errorDetails);
      console.error('User.findByEmailOrUsername error:', errorDetails);
      
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(id: string, updateData: UpdateUserData): Promise<UserData | null> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
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
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `;

      const result = await db.query(sql, values);
      const updatedUser = result.rows[0];

      if (updatedUser) {
        logger.info('User updated successfully', { 
          userId: id, 
          updatedFields: Object.keys(updateData) 
        });
      }

      return updatedUser || null;
    } catch (error) {
      logger.error('Failed to update user', { error, userId: id, updateData });
      throw error;
    }
  }

  /**
   * Update password
   */
  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      // Validate new password
      const passwordValidation = passwordService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash new password
      const hashedPassword = await passwordService.hashPassword(newPassword);

      const sql = `
        UPDATE ${this.tableName} 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2 AND is_active = true
      `;

      const result = await db.query(sql, [hashedPassword, id]);
      
      if (result.rowCount && result.rowCount > 0) {
        logger.info('User password updated successfully', { userId: id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to update user password', { error, userId: id });
      throw error;
    }
  }

  /**
   * Verify user password
   */
  static async verifyPassword(id: string, password: string): Promise<boolean> {
    try {
      const user = await this.findById(id);
      if (!user) {
        return false;
      }

      return await passwordService.verifyPassword(password, user.password_hash);
    } catch (error) {
      logger.error('Failed to verify user password', { error, userId: id });
      return false;
    }
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id: string): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET last_login = NOW()
        WHERE id = $1 AND is_active = true
      `;

      await db.query(sql, [id]);
      logger.debug('User last login updated', { userId: id });
    } catch (error) {
      logger.error('Failed to update last login', { error, userId: id });
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Soft delete user (deactivate)
   */
  static async deactivate(id: string): Promise<boolean> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `;

      const result = await db.query(sql, [id]);
      
      if (result.rowCount && result.rowCount > 0) {
        logger.info('User deactivated successfully', { userId: id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to deactivate user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Reactivate user
   */
  static async reactivate(id: string): Promise<boolean> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET is_active = true, updated_at = NOW()
        WHERE id = $1
      `;

      const result = await db.query(sql, [id]);
      
      if (result.rowCount && result.rowCount > 0) {
        logger.info('User reactivated successfully', { userId: id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to reactivate user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      let sql = `SELECT id FROM ${this.tableName} WHERE username = $1`;
      const values = [username];

      if (excludeUserId) {
        sql += ` AND id != $2`;
        values.push(excludeUserId);
      }

      const result = await db.query(sql, values);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check username existence', { error, username });
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      let sql = `SELECT id FROM ${this.tableName} WHERE email = $1`;
      const values = [email.toLowerCase()];

      if (excludeUserId) {
        sql += ` AND id != $2`;
        values.push(excludeUserId);
      }

      const result = await db.query(sql, values);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check email existence', { error, email });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getStats(id: string): Promise<{
    storiesCreated: number;
    collaborations: number;
    promptsGenerated: number;
    joinDate: Date;
  }> {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM stories WHERE author_id = $1) as stories_created,
          (SELECT COUNT(*) FROM story_collaborators WHERE user_id = $1) as collaborations,
          (SELECT COUNT(*) FROM generated_prompts WHERE user_id = $1) as prompts_generated,
          created_at as join_date
        FROM ${this.tableName}
        WHERE id = $1
      `;

      const result = await db.query(sql, [id]);
      const stats = result.rows[0];

      return {
        storiesCreated: parseInt(stats.stories_created) || 0,
        collaborations: parseInt(stats.collaborations) || 0,
        promptsGenerated: parseInt(stats.prompts_generated) || 0,
        joinDate: stats.join_date,
      };
    } catch (error) {
      logger.error('Failed to get user statistics', { error, userId: id });
      throw error;
    }
  }

  /**
   * Get paginated users (for admin)
   */
  static async findMany(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    includeInactive?: boolean;
  } = {}): Promise<{ users: UserData[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        sortBy = 'created_at',
        sortOrder = 'DESC',
        includeInactive = false
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = includeInactive ? 'WHERE 1=1' : 'WHERE is_active = true';
      const values: any[] = [];
      let paramIndex = 1;

      // Add search filter
      if (search) {
        whereClause += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR display_name ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
      }

      // Count query
      const countSql = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
      const countResult = await db.query(countSql, values);
      const total = parseInt(countResult.rows[0].count);

      // Data query
      const dataSql = `
        SELECT id, username, email, display_name, avatar_url, subscription_tier, 
               created_at, updated_at, last_login, is_active
        FROM ${this.tableName} 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      values.push(limit, offset);

      const dataResult = await db.query(dataSql, values);
      const users = dataResult.rows;

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to find users', { error, options });
      throw error;
    }
  }
}
