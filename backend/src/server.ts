import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import App from './app';
import { db } from '@/database/connection';
import { logger } from '@/utils/logger';

const PORT = process.env['API_PORT'] || 8000;
const HOST = process.env['API_HOST'] || 'localhost';

async function startServer(): Promise<void> {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbHealthy = await db.testConnection();
    
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }

    // Create app instance
    const app = new App();
    const server = app.getServer();

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server is running at http://${HOST}:${PORT}`);
      logger.info(`📖 API documentation available at http://${HOST}:${PORT}/api/v1`);
      logger.info(`🏥 Health check available at http://${HOST}:${PORT}/health`);
      logger.info(`🔌 WebSocket server ready for real-time collaboration`);
      
      // Log environment
      logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`Database: ${process.env['DB_NAME'] || 'what_if_simulator'}`);
      
      if (process.env['NODE_ENV'] === 'development') {
        logger.info('🛠️  Development mode enabled');
        logger.info('📧 Email notifications disabled in development');
      }
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}
