import { Pool, PoolClient } from 'pg';
import { dbConfig } from '@/config/supabase';
import { logger } from '@/utils/logger';

// Log connection string status (without exposing password) - do this after class definition
let connectionStringLogged = false;

class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor() {
    // Log connection string status (only once)
    if (!connectionStringLogged) {
      if (dbConfig.connectionString) {
        const masked = dbConfig.connectionString.replace(/:[^:@]+@/, ':****@');
        logger.info('Database connection string:', masked);
        console.log('✅ Database connection string configured');
      } else {
        logger.error('DATABASE_URL is not set! Database operations will fail.');
        logger.error('Set DATABASE_URL in your .env file from Supabase Dashboard > Settings > Database');
        console.error('❌ DATABASE_URL is missing! Set it in backend/.env');
      }
      connectionStringLogged = true;
    }
    
    // Check if we have a valid connection string
    if (!dbConfig.connectionString) {
      logger.warn('No database connection string configured. Database operations will fail.');
      logger.warn('Please set DATABASE_URL or SUPABASE_DB_PASSWORD environment variable.');
      logger.warn('Get your connection string from Supabase Dashboard > Settings > Database');
    }

    // Use Supabase connection string
    this.pool = new Pool({
      connectionString: dbConfig.connectionString || 'postgresql://localhost:5432/what_if_simulator',
      ssl: dbConfig.connectionString ? {
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Handle pool errors - don't exit in development
    this.pool.on('error', (err) => {
      logger.error('Database pool error', err);
      if (process.env['NODE_ENV'] === 'production') {
        process.exit(-1);
      }
    });

    // Handle pool connection
    this.pool.on('connect', () => {
      logger.info('Connected to database');
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rows: result.rowCount,
      });
      
      return result;
    } catch (error: any) {
      const errorDetails = {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        detail: error?.detail,
        constraint: error?.constraint,
        hint: error?.hint,
        query: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        params: params ? params.map((p, i) => ({ param: i + 1, value: typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p })) : [],
      };
      
      logger.error('Database query error', errorDetails);
      console.error('=== DATABASE QUERY ERROR ===');
      console.error('SQL:', text.substring(0, 500));
      console.error('Params:', params);
      console.error('Error Code:', error?.code);
      console.error('Error Message:', error?.message);
      console.error('Error Detail:', error?.detail);
      console.error('Error Hint:', error?.hint);
      console.error('Full Error:', error);
      console.error('===========================');
      
      throw error;
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      logger.info('Database connection test successful', {
        timestamp: result.rows[0].now,
      });
      return true;
    } catch (error) {
      logger.error('Database connection test failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database connection pool', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Health check for monitoring
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  }> {
    try {
      const pool = this.getPool();
      await this.query('SELECT 1');
      
      return {
        status: 'healthy',
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
      };
    }
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();

// Export types for use in other modules
export type { PoolClient } from 'pg';
