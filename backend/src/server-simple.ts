// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import storiesRoutes from './routes/stories';
import authRoutes from './routes/auth';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

const app: Application = express();
const PORT = process.env['API_PORT'] || 8000;
const HOST = process.env['API_HOST'] || 'localhost';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', limiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = Math.random().toString(36).substr(2, 9);
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// Database test endpoint
app.get('/test-db', async (_req: Request, res: Response) => {
  try {
    const { db } = await import('./database/connection');
    const result = await db.query('SELECT NOW() as time, COUNT(*) as user_count FROM users');
    
    res.status(200).json({
      success: true,
      database: 'connected',
      time: result.rows[0].time,
      userCount: parseInt(result.rows[0].user_count),
      connectionString: process.env['DATABASE_URL'] ? 'configured' : 'missing',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env['NODE_ENV'] !== 'production' ? error.stack : undefined,
    });
  }
});

// Auth routes
app.use('/api/v1/auth', authRoutes);

// API documentation
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    name: 'What-If Storytelling Simulator API',
    version: '1.0.0',
    description: 'API for creating and managing branching narrative stories',
    endpoints: {
      auth: '/api/v1/auth',
    },
  });
});

// Stories routes
app.use('/api/v1/stories', storiesRoutes);

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, _next: any) => {
  const isDevelopment = process.env['NODE_ENV'] !== 'production';
  
  // Log full error details to console
  console.error('=== SERVER ERROR ===');
  console.error('Message:', err.message);
  console.error('Code:', err.code);
  console.error('Name:', err.name);
  console.error('Status Code:', err.statusCode || 500);
  console.error('Stack:', err.stack);
  console.error('Request:', req.method, req.originalUrl);
  console.error('Body:', JSON.stringify(req.body, null, 2));
  console.error('==================');
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: isDevelopment ? (err.message || 'Internal server error') : 'Internal server error',
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack,
      code: err.code,
      name: err.name,
    }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://${HOST}:${PORT}`);
  console.log(`📖 API documentation available at http://${HOST}:${PORT}/api/v1`);
  console.log(`🏥 Health check available at http://${HOST}:${PORT}/health`);
});

export default app;
