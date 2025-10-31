import jwt from 'jsonwebtoken';
import { authConfig } from '@/config/auth';
import { logger } from './logger';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  subscriptionTier: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;

  constructor() {
    this.accessTokenSecret = authConfig.jwt.secret;
    this.refreshTokenSecret = authConfig.jwt.secret + '_refresh';
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
    try {
      const token = jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: authConfig.jwt.expiresIn,
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      });

      logger.debug('Access token generated', { userId: payload.userId });
      return token;
    } catch (error) {
      logger.error('Failed to generate access token', { error, userId: payload.userId });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(payload, this.refreshTokenSecret, {
        expiresIn: authConfig.jwt.refreshExpiresIn,
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      });

      logger.debug('Refresh token generated', { userId: payload.userId });
      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', { error, userId: payload.userId });
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(user: {
    id: string;
    username: string;
    email: string;
    subscriptionTier: string;
  }, tokenVersion: number = 1): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      tokenVersion,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }) as JWTPayload;

      logger.debug('Access token verified', { userId: payload.userId });
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Access token expired');
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid access token', { error: error.message });
        throw new Error('Invalid token');
      } else {
        logger.error('Token verification failed', { error });
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }) as RefreshTokenPayload;

      logger.debug('Refresh token verified', { userId: payload.userId });
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Refresh token expired');
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid refresh token', { error: error.message });
        throw new Error('Invalid refresh token');
      } else {
        logger.error('Refresh token verification failed', { error });
        throw new Error('Refresh token verification failed');
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Token decode failed', { error });
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      logger.error('Failed to get token expiration', { error });
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return Date.now() >= expiration;
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId: string, email: string): string {
    try {
      const token = jwt.sign(
        { userId, email, type: 'password_reset' },
        this.accessTokenSecret,
        {
          expiresIn: authConfig.passwordReset.tokenExpiresIn,
          issuer: authConfig.jwt.issuer,
          audience: authConfig.jwt.audience,
        }
      );

      logger.debug('Password reset token generated', { userId });
      return token;
    } catch (error) {
      logger.error('Failed to generate password reset token', { error, userId });
      throw new Error('Password reset token generation failed');
    }
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): { userId: string; email: string } {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }) as any;

      if (payload.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      logger.debug('Password reset token verified', { userId: payload.userId });
      return { userId: payload.userId, email: payload.email };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Password reset token expired');
        throw new Error('Password reset token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid password reset token', { error: error.message });
        throw new Error('Invalid password reset token');
      } else {
        logger.error('Password reset token verification failed', { error });
        throw new Error('Password reset token verification failed');
      }
    }
  }
}

// Export singleton instance
export const jwtService = new JWTService();
