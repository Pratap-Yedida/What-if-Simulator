import { PoolConfig } from 'pg';

interface DatabaseConfig {
  database: PoolConfig;
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

const config: DatabaseConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'what_if_simulator',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '20'), // Max connections
    min: parseInt(process.env.DB_POOL_MIN || '2'),  // Min connections
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    
    // SSL configuration (for production)
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false // Set to true in production with proper certificates
    } : false,
    
    // Application name for monitoring
    application_name: 'what-if-simulator-backend',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
  }
};

// Validate configuration
function validateConfig() {
  const required = ['DB_NAME', 'DB_USER'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }
  
  // Validate numeric values
  if (isNaN(config.database.port!)) {
    throw new Error('DB_PORT must be a valid number');
  }
  
  if (config.database.max! < config.database.min!) {
    throw new Error('DB_POOL_MAX must be greater than DB_POOL_MIN');
  }
}

// Only validate in production
if (process.env.NODE_ENV === 'production') {
  validateConfig();
}

export { config };

// Export connection string for migrations and other tools
export const connectionString = process.env.DATABASE_URL || 
  `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.database}`;

// Export test database configuration
export const testConfig: DatabaseConfig = {
  ...config,
  database: {
    ...config.database,
    database: `${config.database.database}_test`,
    max: 5, // Smaller pool for tests
    min: 1,
  }
};
