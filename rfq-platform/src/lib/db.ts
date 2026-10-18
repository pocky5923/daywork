import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://disabled:disabled@127.0.0.1:5432/disabled',
  max: 4,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 10000,
});
export const isConfigured = () => Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
