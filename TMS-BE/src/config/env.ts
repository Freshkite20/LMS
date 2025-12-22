import dotenv from 'dotenv';

dotenv.config();

export function loadEnv(): void {
  // Already loaded
}

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  nodeEnv: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  port: Number(process.env.PORT || 3001),
  mongo: {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.MONGODB_DB_NAME || ''
  },
  keycloak: {
    baseUrl: process.env.KEYCLOAK_BASE_URL || '',
    realm: process.env.KEYCLOAK_REALM || '',
    clientId: process.env.KEYCLOAK_CLIENT_ID || '',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || ''
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localDir: process.env.UPLOAD_DIR || 'uploads'
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'mock',
    sendgridApiKey: process.env.SENDGRID_API_KEY || ''
  }
};

