# OpenAPI Documentation

This project now includes comprehensive OpenAPI 3.0 specification for all API endpoints.

## Accessing the API Documentation

Once the server is running, you can access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

This provides a Swagger UI interface where you can:
- Browse all available endpoints
- View request/response schemas
- Test API endpoints directly from the browser
- See authentication requirements
- View example requests and responses

## OpenAPI Specification File

The OpenAPI specification is defined in `openapi.yaml` at the project root. This file includes:

- **All API endpoints** with detailed descriptions
- **Request/response schemas** for all data models
- **Authentication** requirements (JWT Bearer tokens)
- **Validation rules** for all parameters
- **Error responses** with standard error codes
- **Examples** for common use cases

## Key Features

### 1. Complete API Coverage

All endpoints are documented including:
- Admin dashboard
- Batch management
- Course creation and management
- Student enrollment
- Test creation and submission
- Progress tracking
- File uploads

### 2. Schema Definitions

All data models are formally defined:
- Batch
- Course
- CourseSection
- User (Student/Admin)
- Test
- FileUpload
- StudentProgress

### 3. Security

JWT Bearer authentication is documented for all protected endpoints with role-based access control (admin/student).

### 4. Validation

All request parameters include validation rules:
- Required fields
- Data types (UUID, email, date-time, etc.)
- Enums for restricted values
- Min/max constraints
- Array validation

## Using the Documentation

### Testing Endpoints

1. Navigate to `http://localhost:3000/api-docs`
2. Click on any endpoint to expand it
3. Click "Try it out"
4. Fill in the required parameters
5. Click "Execute" to test the endpoint

### Authentication

For protected endpoints:
1. Obtain a JWT token from your authentication service
2. Click the "Authorize" button at the top of the Swagger UI
3. Enter your token in the format: `Bearer <your-token>`
4. Click "Authorize"
5. All subsequent requests will include the token

## Updating the Documentation

When you add or modify endpoints:

1. Update `openapi.yaml` with the new endpoint definition
2. Add any new schemas to the `components/schemas` section
3. The changes will be reflected immediately (no restart needed in dev mode)

## OpenAPI Specification Structure

```yaml
openapi: 3.0.0
info:
  title: TMS API
  version: 1.0.0
  description: Training Management System API

servers:
  - url: http://localhost:3000/api/v1

paths:
  /endpoint:
    method:
      summary: Brief description
      tags: [Category]
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SchemaName'
      responses:
        '200':
          description: Success response

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    SchemaName:
      type: object
      properties:
        field: 
          type: string
```

## Benefits

1. **Auto-generated Documentation** - Always up-to-date API docs
2. **Interactive Testing** - Test endpoints without Postman
3. **Client SDK Generation** - Generate TypeScript/JavaScript clients
4. **Contract Testing** - Validate API responses match spec
5. **Developer Onboarding** - Easy for new developers to understand the API
6. **Standards Compliance** - Industry-standard OpenAPI 3.0 format

## Next Steps

### Generate TypeScript Types (Optional)

You can generate TypeScript types from the OpenAPI spec:

```bash
npm install --save-dev openapi-typescript
npx openapi-typescript openapi.yaml --output src/types/api.ts
```

### Add Request Validation (Optional)

Install OpenAPI validator middleware:

```bash
npm install express-openapi-validator
```

Then add to your app:

```typescript
import { OpenApiValidator } from 'express-openapi-validator';

app.use(
  OpenApiValidator.middleware({
    apiSpec: './openapi.yaml',
    validateRequests: true,
    validateResponses: true
  })
);
```

### Generate Client SDKs (Optional)

Generate client libraries for frontend:

```bash
npm install --save-dev @openapitools/openapi-generator-cli
npx openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./client
```

## Troubleshooting

### Swagger UI not loading

- Check that `openapi.yaml` exists in the project root
- Verify the server is running on the correct port
- Check browser console for CSP errors

### Authentication not working

- Ensure you're using the correct token format: `Bearer <token>`
- Verify the token is valid and not expired
- Check that the endpoint requires the correct role

### Schema validation errors

- Ensure request body matches the schema definition
- Check that all required fields are provided
- Verify data types match (UUID, date-time, etc.)
