import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load OpenAPI specification
const openapiPath = join(__dirname, '../../openapi.yaml');
const openapiFile = readFileSync(openapiPath, 'utf8');
const openapiDocument = yaml.load(openapiFile) as swaggerUi.JsonObject;

export { openapiDocument, swaggerUi };
