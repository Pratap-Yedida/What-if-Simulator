import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthService } from '@/services/authService';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, displayName } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required',
    });
  }

  try {
    // Try to register using AuthService (requires database)
    try {
      const result = await AuthService.register({
        username,
        email,
        password,
        display_name: displayName,
        confirmPassword: password, // Use password as confirmation for now
      });

      // Format response to match frontend expectations
      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          displayName: result.user.display_name || result.user.username,
          createdAt: result.user.created_at,
        },
        token: result.accessToken, // Frontend expects 'token', not 'accessToken'
      });
    } catch (dbError: any) {
      // If database is not configured, provide a helpful error message
      const errorMessage = dbError.message || String(dbError);
      
      // Check for database connection issues
      if (
        dbError.code === 'ECONNREFUSED' ||
        dbError.code === 'ENOTFOUND' ||
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('connect')
      ) {
        return res.status(503).json({
          success: false,
          message: 'Database connection failed. Please ensure the database is running and configured correctly.',
        });
      }
      
      // Check for missing tables
      if (
        errorMessage.includes('relation') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('table')
      ) {
        return res.status(503).json({
          success: false,
          message: 'Database tables not found. Please run database migrations first.',
        });
      }
      
      // Check for conflict errors (user already exists)
      if (dbError.statusCode === 409 || errorMessage.includes('already') || errorMessage.includes('taken')) {
        return res.status(409).json({
          success: false,
          message: errorMessage || 'Username or email is already taken.',
        });
      }
      
      // Re-throw other errors to be handled by errorHandler
      throw dbError;
    }
  } catch (error: any) {
    // Log the FULL error for debugging
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    if (error.response) console.error('Response:', error.response);
    if (error.request) console.error('Request:', error.request);
    console.error('========================');
    
    // Re-throw to let errorHandler show the actual error
    throw error;
  }
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  try {
    // Try to login using AuthService (requires database)
    try {
      const result = await AuthService.login({
        emailOrUsername: email, // Can be email or username
        password,
      });

      // Format response to match frontend expectations
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          displayName: result.user.display_name || result.user.username,
        },
        token: result.accessToken, // Frontend expects 'token', not 'accessToken'
      });
    } catch (dbError: any) {
      // If database is not configured, provide a helpful error message
      const errorMessage = dbError.message || String(dbError);
      
      // Check for database connection issues
      if (
        dbError.code === 'ECONNREFUSED' ||
        dbError.code === 'ENOTFOUND' ||
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('connect')
      ) {
        return res.status(503).json({
          success: false,
          message: 'Database connection failed. Please ensure the database is running and configured correctly.',
        });
      }
      
      // Check for missing tables
      if (
        errorMessage.includes('relation') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('table')
      ) {
        return res.status(503).json({
          success: false,
          message: 'Database tables not found. Please run database migrations first.',
        });
      }
      
      // Check for authentication errors (user not found, wrong password)
      if (dbError.statusCode === 401 || errorMessage.includes('Invalid credentials')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password. Please check your credentials and try again.',
        });
      }
      
      // Re-throw other errors to be handled by errorHandler
      throw dbError;
    }
  } catch (error: any) {
    // Log the FULL error for debugging
    console.error('=== LOGIN ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    if (error.response) console.error('Response:', error.response);
    if (error.request) console.error('Request:', error.request);
    console.error('===================');
    
    // Re-throw to let errorHandler show the actual error
    throw error;
  }
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Implement actual logout logic
  return res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export const getCurrentUser = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Implement actual user retrieval
  return res.json({
    success: true,
    user: {
      id: 'temp-user-id',
      username: 'temp-user',
      email: 'temp@example.com',
      displayName: 'Temp User',
    },
  });
});

/**
 * Refresh token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Implement token refresh logic
  return res.json({
    success: true,
    token: 'new-temp-jwt-token',
  });
});