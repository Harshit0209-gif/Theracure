# Deployment Guide

## PM2 Process Management

This application uses PM2 to manage two separate processes:

1. **dashboard** - The Next.js application (port 3001)
2. **sms-worker** - Background worker for SMS notifications

## Configuration

### Ecosystem Config (`ecosystem.config.js`)

The PM2 configuration defines both processes with:
- Automatic restart on failure
- Memory limits (1GB for dashboard, 500MB for worker)
- Separate log files in `/var/log/pm2/`
- 5-second restart delay for the worker

### GitHub Secrets Required

Make sure the following secrets are configured in your GitHub repository:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - NextAuth base URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `JWT_SECRET` - JWT signing secret
- `UTHO_ACCESS_KEY` - Utho cloud access key
- `UTHO_SECRET_KEY` - Utho cloud secret key
- `UTHO_REGION` - Utho cloud region
- `UTHO_S3_BUCKET_NAME` - S3 bucket name
- `UTHO_ENDPOINT` - S3 endpoint URL
- `UTHO_CDN` - CDN URL
- `MSG91_AUTH_KEY` - MSG91 SMS API key
- `URL_EXPIRY_SECONDS` - Short URL expiry time (optional, for SMS links)
- `UTHO_INSTANCE_PRIVAT_KEY` - SSH private key for deployment
- `DEPLOY_KEY` - GitHub deploy key for repository access

## Manual Commands

### View Process Status
```bash
pm2 status
```

### View Logs
```bash
# Dashboard logs
pm2 logs dashboard

# SMS Worker logs
pm2 logs sms-worker

# All logs
pm2 logs
```

### Restart Processes
```bash
# Restart dashboard only
pm2 restart dashboard

# Restart SMS worker only
pm2 restart sms-worker

# Restart all
pm2 restart all
```

### Stop Processes
```bash
# Stop dashboard
pm2 stop dashboard

# Stop SMS worker
pm2 stop sms-worker

# Stop all
pm2 stop all
```

## Deployment Process

The deployment pipeline automatically:

1. Pulls latest code from GitHub
2. Installs dependencies with pnpm
3. Generates Prisma client and TypeScript enums
4. Builds the Next.js application
5. Runs database migrations
6. Installs Puppeteer Chrome
7. Copies ecosystem config to `/var/www/html/`
8. Restarts both dashboard and SMS worker processes
9. Saves PM2 process list

## Troubleshooting

### SMS Worker Not Processing
```bash
# Check worker logs
pm2 logs sms-worker --lines 100

# Check if worker is running
pm2 status | grep sms-worker

# Restart the worker
pm2 restart sms-worker
```

### Check Database Connection
```bash
# From the application directory
cd /var/www/html/Theracure-Dashboard
pnpm prisma studio
```

### View SMS Queue
```sql
SELECT * FROM sms_queue ORDER BY created_at DESC LIMIT 10;
```
