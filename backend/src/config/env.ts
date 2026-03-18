import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got: ${raw}`);
  }
  return parsed;
}

function optionalBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (!raw) return fallback;
  return raw === 'true' || raw === '1';
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isDev: optional('NODE_ENV', 'development') === 'development',

  // Database
  databaseUrl: required('DATABASE_URL'),

  // Storage (MinIO / S3)
  storage: {
    provider: optional('STORAGE_PROVIDER', 'minio') as 'minio' | 's3',
    endpoint: optional('STORAGE_ENDPOINT', 'localhost'),
    port: optionalInt('STORAGE_PORT', 9000),
    useSsl: optionalBool('STORAGE_USE_SSL', false),
    accessKey: optional('STORAGE_ACCESS_KEY', 'minioadmin'),
    secretKey: optional('STORAGE_SECRET_KEY', 'minioadmin'),
    bucket: optional('STORAGE_BUCKET', 'ibanez-images'),
    region: optional('STORAGE_REGION', 'us-east-1'),
  },

  // Server
  server: {
    host: optional('BACKEND_HOST', '0.0.0.0'),
    port: optionalInt('BACKEND_PORT', 3001),
  },

  // Scraper
  scraper: {
    concurrency: optionalInt('SCRAPE_CONCURRENCY', 5),
    delayMs: optionalInt('SCRAPE_DELAY_MS', 500),
    scrapeImages: optionalBool('SCRAPE_IMAGES', true),
  },
} as const;
