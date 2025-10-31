import bcrypt from 'bcryptjs';
import { authConfig, passwordRules } from '@/config/auth';
import { logger } from './logger';

class PasswordService {
  private saltRounds: number;

  constructor() {
    this.saltRounds = authConfig.bcrypt.saltRounds;
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      // Validate password before hashing
      this.validatePassword(password);
      
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      logger.debug('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      logger.error('Password hashing failed', { error });
      throw error;
    }
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      logger.debug('Password verification', { isValid });
      return isValid;
    } catch (error) {
      logger.error('Password verification failed', { error });
      return false;
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check length
    if (password.length < passwordRules.minLength) {
      errors.push(`Password must be at least ${passwordRules.minLength} characters long`);
    }

    if (password.length > passwordRules.maxLength) {
      errors.push(`Password must be no more than ${passwordRules.maxLength} characters long`);
    }

    // Check for uppercase letters
    if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters
    if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (passwordRules.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special characters
    if (passwordRules.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check against common passwords
    const lowercasePassword = password.toLowerCase();
    if (passwordRules.forbiddenPasswords.some(forbidden => lowercasePassword.includes(forbidden))) {
      errors.push('Password is too common, please choose a more secure password');
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      errors.push('Password should not contain sequential characters (like 123 or abc)');
    }

    // Check for repeated characters
    if (this.hasRepeatedChars(password)) {
      errors.push('Password should not contain repeated characters (like aaa or 111)');
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      logger.debug('Password validation failed', { errors });
    }

    return { isValid, errors };
  }

  /**
   * Check for sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      '0123456789',
      'abcdefghijklmnopqrstuvwxyz',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const substr = sequence.substring(i, i + 3);
        if (password.toLowerCase().includes(substr) || 
            password.toLowerCase().includes(substr.split('').reverse().join(''))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for repeated characters
   */
  private hasRepeatedChars(password: string): boolean {
    const pattern = /(.)\1{2,}/; // 3 or more repeated characters
    return pattern.test(password);
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + special;
    
    let password = '';
    
    // Ensure at least one character from each required category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if password needs to be updated (e.g., after changing hash rounds)
   */
  async needsRehashing(hashedPassword: string): Promise<boolean> {
    try {
      // This is a bcrypt-specific check
      const currentRounds = parseInt(hashedPassword.split('$')[2] || '12');
      return currentRounds < this.saltRounds;
    } catch (error) {
      logger.error('Failed to check if password needs rehashing', { error });
      return false;
    }
  }

  /**
   * Get password strength score (0-100)
   */
  getPasswordStrength(password: string): number {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
    
    // Penalty for common patterns
    if (this.hasSequentialChars(password)) score -= 20;
    if (this.hasRepeatedChars(password)) score -= 20;
    if (passwordRules.forbiddenPasswords.some(forbidden => 
      password.toLowerCase().includes(forbidden))) score -= 30;
    
    return Math.max(0, Math.min(100, score));
  }
}

// Export singleton instance
export const passwordService = new PasswordService();
