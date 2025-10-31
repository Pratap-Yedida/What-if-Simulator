import { User, UserData, CreateUserData } from '@/models/User';
import { jwtService } from '@/utils/jwt';
import { passwordService } from '@/utils/password';
import { logger } from '@/utils/logger';
import { usernameRules } from '@/config/auth';
import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError, 
  NotFoundError 
} from '@/middleware/errorHandler';

interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

interface RegisterData extends CreateUserData {
  confirmPassword: string;
}

interface AuthResponse {
  user: Omit<UserData, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}

interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Validate input data
      await this.validateRegistrationData(userData);

      // Check if user already exists
      const existingUserByEmail = await User.findByEmail(userData.email);
      if (existingUserByEmail) {
        throw new ConflictError('Email address is already registered');
      }

      const existingUserByUsername = await User.findByUsername(userData.username);
      if (existingUserByUsername) {
        throw new ConflictError('Username is already taken');
      }

      // Create user
      const newUser = await User.create({
        username: userData.username,
        email: userData.email.toLowerCase(),
        password: userData.password,
        display_name: userData.display_name || '',
        avatar_url: userData.avatar_url || '',
        subscription_tier: userData.subscription_tier || 'free',
      });

      // Generate tokens
      const { accessToken, refreshToken } = jwtService.generateTokenPair({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        subscriptionTier: newUser.subscription_tier,
      });

      // Update last login
      await User.updateLastLogin(newUser.id);

      logger.info('User registered successfully', {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
      });

      // Return user data without password hash
      const { password_hash, ...userWithoutPassword } = newUser;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      const errorDetails = {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack,
        email: userData.email,
        username: userData.username,
      };
      
      logger.error('User registration failed', errorDetails);
      console.error('AuthService.register error:', errorDetails);
      
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Find user by email or username
      const user = await User.findByEmailOrUsername(credentials.emailOrUsername);
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await passwordService.verifyPassword(
        credentials.password,
        user.password_hash
      );

      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', {
          userId: user.id,
          username: user.username,
        });
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if password needs rehashing
      if (await passwordService.needsRehashing(user.password_hash)) {
        logger.info('Rehashing user password', { userId: user.id });
        await User.updatePassword(user.id, credentials.password);
      }

      // Generate tokens
      const { accessToken, refreshToken } = jwtService.generateTokenPair({
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscription_tier,
      });

      // Update last login
      await User.updateLastLogin(user.id);

      logger.info('User logged in successfully', {
        userId: user.id,
        username: user.username,
      });

      // Return user data without password hash
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      const errorDetails = {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack,
        emailOrUsername: credentials.emailOrUsername,
      };
      
      logger.error('User login failed', errorDetails);
      console.error('AuthService.login error:', errorDetails);
      
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = jwtService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findById(payload.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new token pair
      const tokens = jwtService.generateTokenPair({
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscription_tier,
      }, payload.tokenVersion);

      logger.info('Token refreshed successfully', { userId: user.id });

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    try {
      // Validate new password
      if (newPassword !== confirmPassword) {
        throw new ValidationError('Password confirmation does not match');
      }

      const passwordValidation = passwordService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError('Password validation failed', passwordValidation.errors);
      }

      // Verify current password
      const isCurrentPasswordValid = await User.verifyPassword(userId, currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      logger.info('User password changed successfully', { userId });
    } catch (error) {
      logger.error('Password change failed', { error, userId });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal whether email exists
        return { message: 'If the email exists, a password reset link has been sent' };
      }

      // Generate password reset token
      const resetToken = jwtService.generatePasswordResetToken(user.id, user.email);

      // TODO: Send email with reset token
      // For now, return token in response (remove in production)
      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
      });

      return {
        message: 'Password reset link has been sent to your email',
        ...(process.env['NODE_ENV'] === 'development' && { token: resetToken }),
      };
    } catch (error) {
      logger.error('Password reset request failed', { error, email });
      throw error;
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(resetData: PasswordResetData): Promise<void> {
    try {
      // Validate passwords match
      if (resetData.newPassword !== resetData.confirmPassword) {
        throw new ValidationError('Password confirmation does not match');
      }

      // Validate new password
      const passwordValidation = passwordService.validatePassword(resetData.newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError('Password validation failed', passwordValidation.errors);
      }

      // Verify reset token
      const { userId } = jwtService.verifyPasswordResetToken(resetData.token);

      // Update password
      await User.updatePassword(userId, resetData.newPassword);

      logger.info('Password reset successfully', { userId });
    } catch (error) {
      logger.error('Password reset failed', { error });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<Omit<UserData, 'password_hash'>> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to get user profile', { error, userId });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updateData: {
      username?: string;
      email?: string;
      display_name?: string;
      avatar_url?: string;
    }
  ): Promise<Omit<UserData, 'password_hash'>> {
    try {
      // Validate update data
      if (updateData.username) {
        this.validateUsername(updateData.username);
        
        // Check if username is taken
        const usernameExists = await User.usernameExists(updateData.username, userId);
        if (usernameExists) {
          throw new ConflictError('Username is already taken');
        }
      }

      if (updateData.email) {
        this.validateEmail(updateData.email);
        
        // Check if email is taken
        const emailExists = await User.emailExists(updateData.email, userId);
        if (emailExists) {
          throw new ConflictError('Email address is already registered');
        }
      }

      // Update user
      const updatedUser = await User.update(userId, updateData);
      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }

      logger.info('User profile updated successfully', { userId });

      const { password_hash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to update user profile', { error, userId });
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateAccount(userId: string, password: string): Promise<void> {
    try {
      // Verify password
      const isPasswordValid = await User.verifyPassword(userId, password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Password is incorrect');
      }

      // Deactivate user
      await User.deactivate(userId);

      logger.info('User account deactivated', { userId });
    } catch (error) {
      logger.error('Failed to deactivate user account', { error, userId });
      throw error;
    }
  }

  /**
   * Validate registration data
   */
  private static async validateRegistrationData(userData: RegisterData): Promise<void> {
    const errors: string[] = [];

    // Validate username
    try {
      this.validateUsername(userData.username);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid username');
    }

    // Validate email
    if (!this.validateEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    // Validate password
    const passwordValidation = passwordService.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Validate password confirmation
    if (userData.password !== userData.confirmPassword) {
      errors.push('Password confirmation does not match');
    }

    if (errors.length > 0) {
      throw new ValidationError('Registration validation failed', errors);
    }
  }

  /**
   * Validate username
   */
  private static validateUsername(username: string): void {
    if (!username) {
      throw new Error('Username is required');
    }

    if (username.length < usernameRules.minLength) {
      throw new Error(`Username must be at least ${usernameRules.minLength} characters long`);
    }

    if (username.length > usernameRules.maxLength) {
      throw new Error(`Username must be no more than ${usernameRules.maxLength} characters long`);
    }

    if (!usernameRules.pattern.test(username)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }

    if (usernameRules.forbiddenUsernames.includes(username.toLowerCase())) {
      throw new Error('Username is not available');
    }
  }

  /**
   * Validate email format
   */
  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

