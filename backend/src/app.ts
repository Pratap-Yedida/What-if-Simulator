import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer, Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { logger, morganStream } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { JWTPayload } from '@/utils/jwt';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import storyRoutes from '@/routes/stories';
import simulatorRoutes from '@/routes/simulator';
import analyticsRoutes from '@/routes/analytics';

class App {
  public app: Application;
  public server: Server;
  public io: SocketIOServer;
  
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
        credentials: true
      }
    });
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors({
      origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
      max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: Request, _res: Response, buf: Buffer) => {
        // Store raw body for webhook verification if needed
        (req as any).rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // HTTP request logging
    this.app.use(morgan('combined', { stream: morganStream }));

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = Math.random().toString(36).substr(2, 9);
      res.setHeader('X-Request-Id', req.id);
      next();
    });

    // Request timing
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logger.http(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });
      
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env['npm_package_version'] || '1.0.0',
      });
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/stories', storyRoutes);
    this.app.use('/api/v1/simulator', simulatorRoutes);
    this.app.use('/api/v1/analytics', analyticsRoutes);

    // API documentation
    this.app.get('/api/v1', (_req: Request, res: Response) => {
      res.json({
        name: 'What-If Storytelling Simulator API',
        version: '1.0.0',
        description: 'API for creating and managing branching narrative stories',
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          stories: '/api/v1/stories',
          simulator: '/api/v1/simulator',
          analytics: '/api/v1/analytics',
        },
        documentation: 'https://github.com/your-username/what-if-simulator/blob/main/docs/API.md',
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join story room for real-time collaboration
      socket.on('join-story', (storyId: string) => {
        socket.join(`story-${storyId}`);
        logger.info(`Client ${socket.id} joined story room: ${storyId}`);
      });

      // Leave story room
      socket.on('leave-story', (storyId: string) => {
        socket.leave(`story-${storyId}`);
        logger.info(`Client ${socket.id} left story room: ${storyId}`);
      });

      // Handle story updates
      socket.on('story-update', (data) => {
        socket.to(`story-${data.storyId}`).emit('story-updated', data);
      });

      // Handle node creation
      socket.on('node-created', (data) => {
        socket.to(`story-${data.storyId}`).emit('node-created', data);
      });

      // Handle branch creation
      socket.on('branch-created', (data) => {
        socket.to(`story-${data.storyId}`).emit('branch-created', data);
      });

      // Handle user cursor/selection
      socket.on('user-cursor', (data) => {
        socket.to(`story-${data.storyId}`).emit('user-cursor', {
          ...data,
          userId: socket.id,
        });
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public getServer(): Server {
    return this.server;
  }

  public getSocketIO(): SocketIOServer {
    return this.io;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
      user?: JWTPayload;
    }
  }
}

export default App;
