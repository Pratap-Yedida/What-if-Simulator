import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env['SUPABASE_URL'] || '';
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] || '';
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY'] || '';

// Only throw error if we're in production and variables are missing
// In development, allow the app to start but database operations will fail gracefully
if (process.env['NODE_ENV'] === 'production' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Create Supabase clients only if URL is provided (to avoid validation errors)
// In development, these may be undefined, which is okay since we're using direct PostgreSQL connection
let supabase: ReturnType<typeof createClient> | undefined;
let supabaseAdmin: ReturnType<typeof createClient> | undefined;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (error) {
    console.warn('Warning: Failed to create Supabase clients:', error);
    console.warn('This is okay if you are using direct PostgreSQL connection via DATABASE_URL');
  }
}

// Export clients (may be undefined in development)
export { supabase, supabaseAdmin };

// Database configuration
export const dbConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
  // Use DATABASE_URL if provided (from Supabase dashboard > Settings > Database)
  // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  // Or use SUPABASE_DB_PASSWORD if provided to construct the connection string
  connectionString: process.env['DATABASE_URL'] || 
    (process.env['SUPABASE_DB_PASSWORD'] && supabaseUrl
      ? (() => {
          // Extract project ref from Supabase URL
          // https://wpifwwamyltspunhkjwu.supabase.co -> wpifwwamyltspunhkjwu
          const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
          const projectRef = urlMatch ? urlMatch[1] : supabaseUrl.replace('https://', '').replace('.supabase.co', '');
          return `postgresql://postgres:${process.env['SUPABASE_DB_PASSWORD']}@db.${projectRef}.supabase.co:5432/postgres`;
        })()
      : null),
};

export default supabase;
