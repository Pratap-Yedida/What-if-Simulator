interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  session: {
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  passwordReset: {
    tokenExpiresIn: string;
    emailEnabled: boolean;
  };
  oauth: {
  google: {
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    enabled: boolean;
  };
  github: {
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    enabled: boolean;
  };
  };
}

const authConfig: AuthConfig = {
  jwt: {
    secret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '30d',
    issuer: process.env['JWT_ISSUER'] || 'what-if-simulator',
    audience: process.env['JWT_AUDIENCE'] || 'what-if-simulator-users',
  },
  bcrypt: {
    saltRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
  },
  session: {
    maxAge: parseInt(process.env['SESSION_MAX_AGE'] || '604800000'), // 7 days in ms
    secure: process.env['NODE_ENV'] === 'production',
    httpOnly: true,
    sameSite: process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax',
  },
  passwordReset: {
    tokenExpiresIn: process.env['PASSWORD_RESET_EXPIRES_IN'] || '1h',
    emailEnabled: process.env['EMAIL_ENABLED'] === 'true',
  },
  oauth: {
    google: {
      clientId: process.env['GOOGLE_CLIENT_ID'] || undefined,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || undefined,
      enabled: !!(process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET']),
    },
    github: {
      clientId: process.env['GITHUB_CLIENT_ID'] || undefined,
      clientSecret: process.env['GITHUB_CLIENT_SECRET'] || undefined,
      enabled: !!(process.env['GITHUB_CLIENT_ID'] && process.env['GITHUB_CLIENT_SECRET']),
    },
  },
};

// Validate configuration
function validateAuthConfig(): void {
  if (process.env['NODE_ENV'] === 'production') {
    if (!process.env['JWT_SECRET'] || process.env['JWT_SECRET'] === 'your-super-secret-jwt-key-change-this-in-production') {
      throw new Error('JWT_SECRET must be set to a secure value in production');
    }
    
    if (process.env['JWT_SECRET'] && process.env['JWT_SECRET'].length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
  }
  
  if (authConfig.bcrypt.saltRounds < 10) {
    throw new Error('BCRYPT_ROUNDS must be at least 10 for security');
  }
}

// Only validate in production or when explicitly requested
if (process.env['NODE_ENV'] === 'production' || process.env['VALIDATE_CONFIG'] === 'true') {
  validateAuthConfig();
}

export { authConfig };

// Password validation rules
export const passwordRules = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPasswords: [
    'password',
    '12345678',
    'password123',
    'admin',
    'qwerty123',
    'letmein',
  ],
};

// Username validation rules
export const usernameRules = {
  minLength: 3,
  maxLength: 30,
  pattern: /^[a-zA-Z0-9_-]+$/,
  forbiddenUsernames: [
    'admin',
    'root',
    'administrator',
    'moderator',
    'support',
    'help',
    'api',
    'www',
    'mail',
    'ftp',
    'what-if',
    'simulator',
  ],
};
