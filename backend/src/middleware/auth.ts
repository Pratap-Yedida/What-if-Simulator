import { Request, Response, NextFunction } from 'express';
import { jwtService, JWTPayload } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { AuthenticationError, AuthorizationError } from './errorHandler';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Extract token from request headers or cookies
 */
function extractToken(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) {
    return cookieToken;
  }

  // Check query parameter (for WebSocket connections)
  const queryToken = req.query['token'] as string;
  if (queryToken) {
    return queryToken;
  }

  return null;
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify the token
    const payload = jwtService.verifyAccessToken(token);

    // Add user info to request
    req.user = payload;

    logger.debug('User authenticated', { 
      userId: payload.userId, 
      username: payload.username 
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', { 
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path 
    });
    
    if (error instanceof Error && error.message.includes('expired')) {
      next(new AuthenticationError('Token expired'));
    } else if (error instanceof Error && error.message.includes('invalid')) {
      next(new AuthenticationError('Invalid token'));
    } else {
      next(new AuthenticationError('Authentication failed'));
    }
  }
};

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = jwtService.verifyAccessToken(token);
      req.user = payload;
      logger.debug('User optionally authenticated', { userId: payload.userId });
    }

    next();
  } catch (error) {
    // Log the error but don't fail the request
    logger.debug('Optional authentication failed', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    next();
  }
};

/**
 * Authorization middleware - checks user permissions
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Check if user has required role/subscription tier
    const userTier = req.user.subscriptionTier;
    
    if (roles.length > 0 && !roles.includes(userTier)) {
      logger.warn('Authorization failed', { 
        userId: req.user.userId,
        userTier,
        requiredRoles: roles 
      });
      return next(new AuthorizationError(`Requires one of: ${roles.join(', ')}`));
    }

    logger.debug('User authorized', { 
      userId: req.user.userId,
      userTier,
      requiredRoles: roles 
    });

    next();
  };
};

/**
 * Subscription tier middleware
 */
export const requireSubscription = (minTier: string) => {
  const tierHierarchy = ['free', 'premium', 'pro', 'enterprise'];
  
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const userTierIndex = tierHierarchy.indexOf(req.user.subscriptionTier);
    const requiredTierIndex = tierHierarchy.indexOf(minTier);

    if (userTierIndex === -1 || requiredTierIndex === -1) {
      return next(new AuthorizationError('Invalid subscription tier'));
    }

    if (userTierIndex < requiredTierIndex) {
      logger.warn('Subscription tier insufficient', {
        userId: req.user.userId,
        userTier: req.user.subscriptionTier,
        requiredTier: minTier
      });
      return next(new AuthorizationError(`Requires ${minTier} subscription or higher`));
    }

    next();
  };
};

/**
 * Resource ownership middleware - checks if user owns a resource
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // This would need to be implemented with database checks
    // For now, we'll pass it through and handle ownership in the route handlers
    
    logger.debug('Ownership check requested', {
      userId: req.user.userId,
      resourceId: req.params[resourceIdParam],
      resourceType: resourceIdParam
    });

    next();
  };
};

/**
 * Rate limiting by user
 */
export const rateLimitByUser = (windowMs: number, maxRequests: number) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const userId = req.user.userId;
    const now = Date.now();
    const userLimit = userRequestCounts.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize user limit
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      logger.warn('User rate limit exceeded', {
        userId,
        count: userLimit.count,
        maxRequests,
        windowMs
      });
      return next(new AuthorizationError('Rate limit exceeded for user'));
    }

    userLimit.count++;
    next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  // Check if user is admin (you might want to add an isAdmin field to the user)
  if (req.user.subscriptionTier !== 'enterprise' && req.user.username !== 'admin') {
    logger.warn('Admin access denied', { userId: req.user.userId });
    return next(new AuthorizationError('Admin access required'));
  }

  next();
};

/**
 * Middleware to validate token freshness (for sensitive operations)
 */
export const requireFreshToken = (maxAgeMinutes: number = 30) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.iat) {
      return next(new AuthenticationError('Authentication required'));
    }

    const tokenAge = (Date.now() / 1000) - req.user.iat;
    const maxAgeSeconds = maxAgeMinutes * 60;

    if (tokenAge > maxAgeSeconds) {
      logger.warn('Token too old for sensitive operation', {
        userId: req.user.userId,
        tokenAge,
        maxAgeSeconds
      });
      return next(new AuthenticationError('Please re-authenticate for this action'));
    }

    next();
  };
};
