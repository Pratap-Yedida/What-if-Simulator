import fs from 'fs/promises';
import path from 'path';
import { db } from './connection';
import { logger } from '@/utils/logger';

interface Migration {
  id: string;
  filename: string;
  sql: string;
  executed_at?: Date;
}

class MigrationRunner {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  // Create migrations table if it doesn't exist
  private async ensureMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await db.query(sql);
    logger.info('Migrations table ensured');
  }

  // Get list of executed migrations
  private async getExecutedMigrations(): Promise<string[]> {
    const result = await db.query('SELECT id FROM migrations ORDER BY executed_at ASC');
    return result.rows.map((row: any) => row.id);
  }

  // Get list of migration files
  private async getMigrationFiles(): Promise<Migration[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrations: Migration[] = [];

      for (const filename of files.sort()) {
        if (filename.endsWith('.sql')) {
          const filePath = path.join(this.migrationsPath, filename);
          const sql = await fs.readFile(filePath, 'utf-8');
          const id = filename.replace('.sql', '');
          
          migrations.push({
            id,
            filename,
            sql,
          });
        }
      }

      return migrations;
    } catch (error) {
      logger.error('Error reading migration files', { error });
      return [];
    }
  }

  // Execute a single migration
  private async executeMigration(migration: Migration): Promise<void> {
    await db.transaction(async (client) => {
      logger.info(`Executing migration: ${migration.filename}`);
      
      // Execute the migration SQL
      await client.query(migration.sql);
      
      // Record the migration as executed
      await client.query(
        'INSERT INTO migrations (id, filename, executed_at) VALUES ($1, $2, NOW())',
        [migration.id, migration.filename]
      );
      
      logger.info(`Migration completed: ${migration.filename}`);
    });
  }

  // Run all pending migrations
  public async migrate(): Promise<void> {
    try {
      logger.info('Starting database migration');
      
      await this.ensureMigrationsTable();
      
      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles(),
      ]);

      const pendingMigrations = migrationFiles.filter(
        migration => !executedMigrations.includes(migration.id)
      );

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      logger.info('All migrations completed successfully');
      
    } catch (error) {
      logger.error('Migration failed', { error });
      throw error;
    }
  }

  // Rollback last migration (be careful with this!)
  public async rollback(): Promise<void> {
    try {
      logger.warn('Starting migration rollback');
      
      const result = await db.query(
        'SELECT id, filename FROM migrations ORDER BY executed_at DESC LIMIT 1'
      );

      if (result.rows.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const lastMigration = result.rows[0];
      logger.warn(`Rolling back migration: ${lastMigration.filename}`);
      
      // Remove from migrations table
      await db.query('DELETE FROM migrations WHERE id = $1', [lastMigration.id]);
      
      logger.warn(`Rollback completed for: ${lastMigration.filename}`);
      logger.warn('Note: This only removes the migration record. You may need to manually revert schema changes.');
      
    } catch (error) {
      logger.error('Rollback failed', { error });
      throw error;
    }
  }

  // Get migration status
  public async status(): Promise<void> {
    try {
      await this.ensureMigrationsTable();
      
      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles(),
      ]);

      logger.info('Migration Status:');
      logger.info(`Total migrations: ${migrationFiles.length}`);
      logger.info(`Executed: ${executedMigrations.length}`);
      logger.info(`Pending: ${migrationFiles.length - executedMigrations.length}`);

      // List all migrations with status
      for (const migration of migrationFiles) {
        const status = executedMigrations.includes(migration.id) ? '✓' : '✗';
        logger.info(`${status} ${migration.filename}`);
      }
      
    } catch (error) {
      logger.error('Failed to get migration status', { error });
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2] || 'migrate';

  (async () => {
    try {
      switch (command) {
        case 'migrate':
          await runner.migrate();
          break;
        case 'rollback':
          await runner.rollback();
          break;
        case 'status':
          await runner.status();
          break;
        default:
          logger.error(`Unknown command: ${command}`);
          logger.info('Available commands: migrate, rollback, status');
          process.exit(1);
      }
      
      process.exit(0);
    } catch (error) {
      logger.error('Migration runner failed', { error });
      process.exit(1);
    }
  })();
}

export { MigrationRunner };
