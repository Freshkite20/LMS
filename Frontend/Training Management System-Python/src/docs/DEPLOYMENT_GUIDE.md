# Training Management System - Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup](#database-setup)
4. [Keycloak Deployment](#keycloak-deployment)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## System Requirements

### Minimum Requirements

**Keycloak Server:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB

**Backend API Server:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB

**Database (PostgreSQL):**
- CPU: 4 cores
- RAM: 16 GB
- Storage: 100 GB (with growth capacity)

**Frontend (Static Hosting):**
- CDN-based hosting (e.g., Cloudflare, AWS CloudFront)

---

## Infrastructure Setup

### Recommended Architecture

```
                          ┌──────────────┐
                          │   Internet   │
                          └──────┬───────┘
                                 │
                          ┌──────▼───────┐
                          │ Load Balancer│
                          │   (HTTPS)    │
                          └──────┬───────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
          ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
          │  Frontend   │ │  Backend  │ │  Keycloak   │
          │   (CDN)     │ │   API     │ │   Server    │
          └─────────────┘ └─────┬─────┘ └──────┬──────┘
                                │               │
                          ┌─────▼───────────────▼─────┐
                          │     PostgreSQL DB         │
                          └───────────────────────────┘
```

### Cloud Provider Options

#### AWS Architecture

```yaml
Services:
  - VPC: Isolated network
  - EC2: Backend API servers (Auto Scaling Group)
  - RDS: PostgreSQL database (Multi-AZ)
  - S3: File storage
  - CloudFront: Frontend CDN
  - ALB: Application Load Balancer
  - Route53: DNS management
  - SES: Email service
  - ElastiCache: Redis for sessions
```

#### Azure Architecture

```yaml
Services:
  - Virtual Network: Isolated network
  - App Service: Backend API
  - Azure Database for PostgreSQL
  - Blob Storage: File storage
  - Azure CDN: Frontend distribution
  - Application Gateway: Load balancer
  - Azure DNS: DNS management
  - SendGrid: Email service
```

---

## Database Setup

### PostgreSQL Installation (Ubuntu)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

CREATE DATABASE tms_db;
CREATE USER tms_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE tms_db TO tms_user;
\q
```

### Run Database Migrations

**migration.sql:**
```sql
-- Run all CREATE TABLE statements from BACKEND_API_SPECIFICATION.md

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_student_batches_student ON student_batches(student_id);
CREATE INDEX idx_student_batches_batch ON student_batches(batch_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_course_sections_course ON course_sections(course_id);
CREATE INDEX idx_course_assignments_student ON course_assignments(student_id);
CREATE INDEX idx_course_assignments_course ON course_assignments(course_id);
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_course ON student_progress(course_id);
CREATE INDEX idx_test_submissions_student ON test_submissions(student_id);
CREATE INDEX idx_test_submissions_test ON test_submissions(test_id);

-- Create functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Database Connection Pooling (with pg-pool)

**database.js:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

---

## Keycloak Deployment

### Docker Deployment

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  keycloak-db:
    image: postgres:14
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
    volumes:
      - keycloak-db-data:/var/lib/postgresql/data
    networks:
      - keycloak-network

  keycloak:
    image: quay.io/keycloak/keycloak:22.0
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
      KC_HOSTNAME: keycloak.example.com
      KC_HOSTNAME_STRICT: false
      KC_HTTP_ENABLED: true
      KC_PROXY: edge
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    command:
      - start
    ports:
      - "8080:8080"
    depends_on:
      - keycloak-db
    networks:
      - keycloak-network

volumes:
  keycloak-db-data:

networks:
  keycloak-network:
```

**Start Keycloak:**
```bash
# Set environment variables
export KEYCLOAK_DB_PASSWORD=secure_db_password
export KEYCLOAK_ADMIN_PASSWORD=secure_admin_password

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f keycloak
```

### Kubernetes Deployment

**keycloak-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
spec:
  replicas: 2
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
      - name: keycloak
        image: quay.io/keycloak/keycloak:22.0
        env:
        - name: KC_DB
          value: postgres
        - name: KC_DB_URL
          valueFrom:
            secretKeyRef:
              name: keycloak-secrets
              key: db-url
        - name: KC_DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: keycloak-secrets
              key: db-username
        - name: KC_DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: keycloak-secrets
              key: db-password
        - name: KEYCLOAK_ADMIN
          valueFrom:
            secretKeyRef:
              name: keycloak-secrets
              key: admin-username
        - name: KEYCLOAK_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: keycloak-secrets
              key: admin-password
        ports:
        - containerPort: 8080
        command:
        - start
        - --optimized
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: keycloak
```

### Initial Keycloak Configuration

```bash
# Access Keycloak admin console
https://keycloak.example.com/admin

# Login with admin credentials
Username: admin
Password: ${KEYCLOAK_ADMIN_PASSWORD}

# Follow steps in KEYCLOAK_INTEGRATION_GUIDE.md to:
1. Create 'tms' realm
2. Create 'tms-frontend' and 'tms-backend' clients
3. Create 'admin' and 'student' roles
4. Configure password policies
5. Set up email configuration
```

---

## Backend Deployment

### Node.js/Express Backend

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      KEYCLOAK_URL: ${KEYCLOAK_URL}
      KEYCLOAK_REALM: ${KEYCLOAK_REALM}
      KEYCLOAK_CLIENT_ID: ${KEYCLOAK_CLIENT_ID}
      KEYCLOAK_CLIENT_SECRET: ${KEYCLOAK_CLIENT_SECRET}
      SESSION_SECRET: ${SESSION_SECRET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
      EMAIL_SERVICE: ${EMAIL_SERVICE}
      EMAIL_API_KEY: ${EMAIL_API_KEY}
    depends_on:
      - postgres
    restart: unless-stopped
    
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres-data:
```

### PM2 Process Manager (Alternative)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name tms-backend -i max

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'tms-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

### Nginx Reverse Proxy

**nginx.conf:**
```nginx
upstream backend {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}

server {
    listen 80;
    server_name api.tms.example.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tms.example.com;
    
    # SSL configuration
    ssl_certificate /etc/ssl/certs/tms.crt;
    ssl_certificate_key /etc/ssl/private/tms.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/tms-api-access.log;
    error_log /var/log/nginx/tms-api-error.log;
    
    # Client body size limit
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}
```

---

## Frontend Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build application
npm run build

# Output will be in /dist or /build directory
```

### Static Hosting Options

#### 1. AWS S3 + CloudFront

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Sync build to S3
aws s3 sync ./dist s3://tms-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD5678 \
  --paths "/*"
```

**CloudFront Configuration:**
```json
{
  "Origins": [{
    "DomainName": "tms-frontend-bucket.s3.amazonaws.com",
    "S3OriginConfig": {
      "OriginAccessIdentity": "origin-access-identity/cloudfront/ABCDEFG"
    }
  }],
  "DefaultCacheBehavior": {
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "DefaultTTL": 86400
  },
  "CustomErrorResponses": [{
    "ErrorCode": 404,
    "ResponseCode": 200,
    "ResponsePagePath": "/index.html"
  }]
}
```

#### 2. Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.tms.example.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

#### 3. Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://api.tms.example.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Environment Configuration

### Backend .env

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Database
DB_HOST=tms-db.example.com
DB_PORT=5432
DB_NAME=tms_db
DB_USER=tms_user
DB_PASSWORD=secure_db_password_here

# Keycloak
KEYCLOAK_URL=https://keycloak.example.com/auth
KEYCLOAK_REALM=tms
KEYCLOAK_CLIENT_ID=tms-backend
KEYCLOAK_CLIENT_SECRET=your_client_secret_here

# Session
SESSION_SECRET=your_session_secret_here

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=tms-files
AWS_REGION=us-east-1

# Email Service
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=noreply@tms.example.com

# Application URLs
APP_URL=https://tms.example.com
API_URL=https://api.tms.example.com

# Redis (optional)
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_here
```

### Frontend .env

```bash
VITE_API_URL=https://api.tms.example.com/v1
VITE_KEYCLOAK_URL=https://keycloak.example.com/auth
VITE_KEYCLOAK_REALM=tms
VITE_KEYCLOAK_CLIENT_ID=tms-frontend
```

---

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d tms.example.com -d api.tms.example.com -d keycloak.example.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Maintenance

### Health Check Endpoints

**healthcheck.js:**
```javascript
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000
};

const healthCheck = http.request(options, (res) => {
  console.log(`HEALTH CHECK STATUS: ${res.statusCode}`);
  if (res.statusCode == 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.error('ERROR', err);
  process.exit(1);
});

healthCheck.end();
```

### Logging with Winston

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Backup Strategy

**Automated Database Backup:**
```bash
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
DB_NAME="tms_db"
DB_USER="tms_user"

# Create backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/tms_db_$TIMESTAMP.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/tms_db_$TIMESTAMP.sql.gz s3://tms-backups/

# Delete local backups older than 7 days
find $BACKUP_DIR -name "tms_db_*.sql.gz" -mtime +7 -delete

# Delete S3 backups older than 30 days
aws s3 ls s3://tms-backups/ | while read -r line; do
  createDate=$(echo $line | awk {'print $1" "$2'})
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    fileName=$(echo $line | awk {'print $4'})
    aws s3 rm s3://tms-backups/$fileName
  fi
done
```

**Cron Job:**
```bash
# Run backup daily at 2 AM
0 2 * * * /path/to/backup.sh
```

### Monitoring with Prometheus

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'tms-backend'
    static_configs:
      - targets: ['backend:3000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
  
  - job_name: 'keycloak'
    static_configs:
      - targets: ['keycloak:8080']
```

### Alerting

**Alert Rules:**
```yaml
groups:
  - name: tms_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
      
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        annotations:
          summary: "PostgreSQL database is down"
      
      - alert: HighMemoryUsage
        expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.1
        for: 5m
        annotations:
          summary: "High memory usage detected"
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Backend API**: Use load balancer with multiple instances
2. **Database**: Implement read replicas for read-heavy operations
3. **File Storage**: Use distributed storage (S3, Azure Blob)
4. **Cache**: Implement Redis for session management and caching

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **CDN**: Use CDN for static assets and frontend
3. **Caching**: Implement caching strategies (Redis, in-memory)
4. **Connection Pooling**: Use connection pooling for database
5. **Compression**: Enable gzip compression for API responses

---

## Security Checklist

- [ ] SSL/TLS certificates installed and configured
- [ ] Firewall rules configured (only necessary ports open)
- [ ] Database access restricted to backend servers
- [ ] Environment variables secured (use secrets management)
- [ ] Regular security updates applied
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] SQL injection prevention
- [ ] XSS protection headers
- [ ] Regular backups automated and tested
- [ ] Monitoring and alerting configured
- [ ] Access logs enabled and monitored
