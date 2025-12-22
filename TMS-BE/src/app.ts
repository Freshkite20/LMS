import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yaml from 'js-yaml';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Load OpenAPI specification
// In development (tsx): __dirname is src/, so we need ../openapi.yaml
// In production (compiled): __dirname is dist/, so we need ../openapi.yaml
const openapiPath = join(__dirname, '../openapi.yaml');
const openapiFile = readFileSync(openapiPath, 'utf8');
const openapiDocument = yaml.load(openapiFile) as swaggerUi.JsonObject;

// Swagger UI options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TMS API Documentation',
  customfavIcon: '/favicon.ico'
};

app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for Swagger UI
}));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests from this IP' } }
  })
);
app.use(
  (pinoHttp as any)({
    autoLogging: true
  })
);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, swaggerOptions));

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/v1', apiRouter);

app.use(errorHandler);

export default app;

