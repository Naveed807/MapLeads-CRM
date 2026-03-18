import 'dotenv/config';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  nodeEnv:     process.env.NODE_ENV || 'development',
  port:        parseInt(process.env.PORT || '4000', 10),
  appUrl:      process.env.APP_URL || 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  jwt: {
    accessSecret:  requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES  || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  },

  stripe: {
    secretKey:          process.env.STRIPE_SECRET_KEY || '',
    webhookSecret:      process.env.STRIPE_WEBHOOK_SECRET || '',
    freelancerPriceId:  process.env.STRIPE_FREELANCER_PRICE_ID || '',
    agencyPriceId:      process.env.STRIPE_AGENCY_PRICE_ID || '',
  },

  smtp: {
    host:      process.env.SMTP_HOST      || 'smtp.gmail.com',
    port:      parseInt(process.env.SMTP_PORT || '587', 10),
    secure:    process.env.SMTP_SECURE    === 'true',
    user:      process.env.SMTP_USER      || '',
    pass:      process.env.SMTP_PASS      || '',
    fromName:  process.env.SMTP_FROM_NAME  || 'MapLeads CRM',
    fromEmail: process.env.SMTP_FROM_EMAIL || '',
  },

  aws: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket:        process.env.AWS_S3_BUCKET         || 'mapleads-uploads',
    region:          process.env.AWS_REGION            || 'us-east-1',
    useS3:           process.env.USE_S3                === 'true',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    uploadDir:     process.env.UPLOAD_DIR || './storage/uploads',
  },

  admin: {
    email:    process.env.ADMIN_EMAIL    || '',
    password: process.env.ADMIN_PASSWORD || '',
    name:     process.env.ADMIN_NAME     || 'System Admin',
  },

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;
