# Production Deployment Guide

## IV RELIFE Nexus - Enterprise Authentication System

This guide provides comprehensive instructions for deploying the production-ready authentication system with enterprise security features, monitoring, and compliance capabilities.

## 🏗️ Architecture Overview

The IV RELIFE Nexus authentication system consists of:

- **Frontend**: React/TypeScript application with enterprise security components
- **Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Multi-factor authentication with TOTP, SMS, email
- **Security**: Advanced threat detection, device fingerprinting, risk assessment
- **Monitoring**: Real-time security monitoring and audit logging
- **Compliance**: GDPR, CCPA, SOX, HIPAA audit trails

## 📋 Prerequisites

### Required Software
- Node.js 18+ and npm/yarn
- PostgreSQL 14+ (or Supabase Cloud)
- SSL certificates for HTTPS
- Email service (SendGrid, AWS SES, etc.)
- SMS service (Twilio, AWS SNS, etc.)

### Required Accounts
- Supabase account with project
- Domain with SSL certificate
- Email service provider
- SMS service provider (optional)
- Monitoring service (optional)

## 🔧 Environment Configuration

### 1. Environment Variables

Create `.env.production` file with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
APP_NAME="IV RELIFE Nexus"
APP_URL=https://your-domain.com
NODE_ENV=production

# Security Configuration
SESSION_SECRET=generate-strong-secret-key
ENCRYPTION_KEY=generate-32-byte-encryption-key
JWT_SECRET=generate-jwt-secret

# Email Configuration
EMAIL_PROVIDER=sendgrid  # or aws-ses, mailgun
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM_ADDRESS=noreply@your-domain.com
EMAIL_FROM_NAME="IV RELIFE Nexus"

# SMS Configuration (Optional)
SMS_PROVIDER=twilio  # or aws-sns
SMS_ACCOUNT_SID=your-twilio-sid
SMS_AUTH_TOKEN=your-twilio-token
SMS_FROM_NUMBER=+1234567890

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_ENDPOINT=https://your-metrics-endpoint.com
ALERT_WEBHOOK_URL=https://your-alerts-webhook.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX_REQUESTS=100

# Security Headers
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000
CSP_ENABLED=true
```

### 2. Security Key Generation

Generate secure keys for production:

```bash
# Generate session secret (64 characters)
openssl rand -hex 32

# Generate encryption key (32 bytes)
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64
```

## 🗄️ Database Setup

### 1. Run Database Migrations

Execute the SQL migrations in order:

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
\i sql/migrations/001_init_schema.sql
\i sql/migrations/002_rls_and_policies.sql
```

### 2. Verify Database Setup

Run the verification script:

```bash
npm run verify-supabase
```

### 3. Configure RLS Policies

Ensure Row Level Security is enabled for all tables:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Should return no rows - all tables should have RLS enabled
```

## 🚀 Application Deployment

### 1. Build Application

```bash
# Install dependencies
npm install --production

# Build for production
npm run build

# Run tests
npm run test:ci

# Run security audit
npm run test:security-audit
```

### 2. Deploy to Production

#### Option A: Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
# ... add all other environment variables
```

#### Option B: Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

#### Option C: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

```bash
# Build and run Docker container
docker build -t ivrelife-nexus .
docker run -p 3000:3000 --env-file .env.production ivrelife-nexus
```

### 3. Configure Reverse Proxy

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CSP header
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://your-project.supabase.co;" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
    
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://localhost:3000;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🔐 Security Configuration

### 1. Configure Content Security Policy

Update your CSP header based on your domain:

```javascript
// In your main application file
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://unpkg.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://${VITE_SUPABASE_URL};
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;
```

### 2. Enable Security Headers

Configure security headers in your deployment:

```javascript
// Security headers middleware
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### 3. Configure Rate Limiting

Set up rate limiting for authentication endpoints:

```javascript
// Rate limiting configuration
const rateLimits = {
  '/api/auth/signin': '5 requests per minute',
  '/api/auth/signup': '3 requests per minute',
  '/api/auth/password-reset': '2 requests per minute',
  '/api/mfa/challenge': '10 requests per minute',
};
```

## 📊 Monitoring Setup

### 1. Configure Health Checks

Set up health check endpoints:

```bash
# Add to your monitoring service
GET https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "authentication": "healthy",
    "storage": "healthy"
  },
  "uptime": 99.9
}
```

### 2. Configure Alerting

Set up alerts for critical events:

```yaml
# Example alerting rules
alerts:
  - name: "High Authentication Failures"
    condition: "auth_failures > 10 in 5m"
    severity: "high"
    
  - name: "Database Connection Issues"
    condition: "db_connection_errors > 0"
    severity: "critical"
    
  - name: "Suspicious Login Activity"
    condition: "risk_score > 75"
    severity: "medium"
```

### 3. Log Aggregation

Configure log shipping to your monitoring service:

```javascript
// Example log configuration
const logConfig = {
  level: 'info',
  format: 'json',
  transports: [
    {
      type: 'file',
      filename: '/var/log/ivrelife-nexus/app.log'
    },
    {
      type: 'http',
      endpoint: 'https://your-log-aggregator.com/logs'
    }
  ]
};
```

## 🔧 Post-Deployment Configuration

### 1. Create Initial Admin User

```sql
-- Create the first admin user
INSERT INTO app_users (
    user_id,
    email,
    name,
    role,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    'admin@your-domain.com',
    'System Administrator',
    'owner',
    'active',
    now()
);

-- Create invite token for admin user
INSERT INTO invite_tokens (
    token_id,
    email,
    invited_by,
    role,
    expires_at,
    created_at
) VALUES (
    gen_random_uuid(),
    'admin@your-domain.com',
    (SELECT user_id FROM app_users WHERE email = 'admin@your-domain.com'),
    'owner',
    now() + interval '1 day',
    now()
);
```

### 2. Configure MFA for Admin Users

1. Log in with admin account
2. Navigate to Security Settings
3. Enable TOTP MFA
4. Save backup codes securely
5. Test MFA login flow

### 3. Set Up Backup Procedures

```bash
#!/bin/bash
# backup-script.sh

# Database backup
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  --clean --create --verbose \
  > backup-$(date +%Y%m%d-%H%M%S).sql

# Encrypt backup
gpg --encrypt --recipient admin@your-domain.com backup-*.sql

# Upload to secure storage
aws s3 cp backup-*.sql.gpg s3://your-backup-bucket/
```

## 🧪 Testing & Validation

### 1. Security Testing

Run comprehensive security tests:

```bash
# Run all security tests
npm run test:security

# Run penetration testing
npm run test:pentest

# Run compliance validation
npm run test:compliance
```

### 2. Load Testing

Test authentication system under load:

```javascript
// Load test configuration
const loadTest = {
  scenarios: {
    login_load: {
      executor: 'constant-arrival-rate',
      rate: 100, // 100 requests per second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
    }
  }
};
```

### 3. Disaster Recovery Testing

Test backup and recovery procedures:

```bash
# Test database restore
pg_restore --clean --verbose backup-latest.sql

# Test application recovery
docker-compose down
docker-compose up -d

# Verify all services are healthy
curl https://your-domain.com/api/health
```

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_auth_sessions_expires 
ON auth_sessions(expires_at) 
WHERE status = 'active';

-- Analyze tables for query optimization
ANALYZE audit_logs;
ANALYZE auth_sessions;
ANALYZE app_users;
```

### 2. Application Optimization

```javascript
// Enable compression
app.use(compression());

// Enable caching for static assets
app.use('/assets', express.static('dist/assets', {
  maxAge: '1y',
  etag: true
}));

// Connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. CDN Configuration

Configure CDN for static assets:

```javascript
// CDN configuration
const cdnConfig = {
  origin: 'https://your-domain.com',
  caching: {
    'static/*': '1y',
    'assets/*': '1y',
    'api/*': 'no-cache'
  },
  compression: true,
  minify: true
};
```

## 🔒 Compliance & Audit

### 1. GDPR Compliance

```javascript
// Data protection settings
const gdprConfig = {
  dataRetention: {
    auditLogs: '7 years',
    userSessions: '30 days',
    personalData: 'user-controlled'
  },
  consentManagement: true,
  rightToErasure: true,
  dataPortability: true
};
```

### 2. Audit Trail Configuration

```sql
-- Ensure all actions are logged
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_logs (
        event_type,
        user_id,
        action,
        old_values,
        new_values,
        created_at
    ) VALUES (
        TG_OP,
        current_setting('app.current_user_id', true),
        TG_TABLE_NAME,
        to_jsonb(OLD),
        to_jsonb(NEW),
        now()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### 3. Regular Security Audits

Schedule regular security assessments:

```yaml
# Security audit schedule
audits:
  vulnerability_scan:
    frequency: weekly
    tools: [nmap, nikto, owasp-zap]
    
  code_review:
    frequency: monthly
    scope: [authentication, authorization, data-access]
    
  penetration_test:
    frequency: quarterly
    scope: [external, internal, social-engineering]
    
  compliance_review:
    frequency: annually
    standards: [gdpr, ccpa, sox, hipaa]
```

## 🚨 Incident Response

### 1. Security Incident Playbook

```markdown
# Security Incident Response Plan

## Phase 1: Detection & Analysis
1. Monitor security alerts
2. Validate incident severity
3. Document initial findings
4. Notify security team

## Phase 2: Containment
1. Isolate affected systems
2. Preserve evidence
3. Implement temporary fixes
4. Communicate with stakeholders

## Phase 3: Recovery
1. Remove threats
2. Restore systems
3. Update security measures
4. Monitor for reoccurrence

## Phase 4: Post-Incident
1. Document lessons learned
2. Update procedures
3. Conduct training
4. Report to authorities if required
```

### 2. Emergency Contacts

```yaml
# Emergency contact list
contacts:
  security_team: security@your-domain.com
  database_admin: dba@your-domain.com
  system_admin: sysadmin@your-domain.com
  legal_team: legal@your-domain.com
  
external:
  cert_team: cert@cert.org
  law_enforcement: +1-xxx-xxx-xxxx
  cyber_insurance: claims@cyber-insurance.com
```

## 📞 Support & Maintenance

### 1. Regular Maintenance Tasks

```bash
#!/bin/bash
# maintenance-script.sh

# Update dependencies
npm audit fix

# Database maintenance
psql -c "VACUUM ANALYZE;"
psql -c "REINDEX DATABASE postgres;"

# Log rotation
logrotate /etc/logrotate.d/ivrelife-nexus

# Certificate renewal
certbot renew --quiet

# Security updates
apt update && apt upgrade -y

# Restart services
systemctl restart nginx
systemctl restart ivrelife-nexus
```

### 2. Monitoring Checklist

Daily:
- [ ] Check system health dashboard
- [ ] Review security alerts
- [ ] Verify backup completion
- [ ] Monitor performance metrics

Weekly:
- [ ] Review audit logs
- [ ] Check certificate expiration
- [ ] Update security signatures
- [ ] Test disaster recovery

Monthly:
- [ ] Security patch updates
- [ ] Performance optimization
- [ ] Capacity planning review
- [ ] Compliance audit preparation

### 3. Documentation Updates

Keep documentation current:
- Security procedures
- API documentation
- Deployment guides
- Troubleshooting guides
- User manuals

## 🎯 Success Metrics

Track these KPIs to measure success:

### Security Metrics
- Authentication success rate: >99.5%
- Mean time to detect threats: <5 minutes
- Mean time to respond: <15 minutes
- False positive rate: <5%

### Performance Metrics
- Login response time: <500ms
- System uptime: >99.9%
- Database query time: <100ms
- API response time: <200ms

### Compliance Metrics
- Audit log completeness: 100%
- Data breach incidents: 0
- Compliance violations: 0
- Security training completion: 100%

---

## 📝 Conclusion

This deployment guide provides a comprehensive framework for deploying the IV RELIFE Nexus authentication system in production. Follow each section carefully and adapt the configurations to your specific environment and requirements.

For additional support or questions, refer to the technical documentation or contact the development team.

**Remember**: Security is an ongoing process. Regularly review and update your security posture to protect against evolving threats.