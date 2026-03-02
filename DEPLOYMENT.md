# Deployment Guide - Hostinger

## ⚠️ IMPORTANT: Protect Uploads Folder

The `uploads/` folder contains user-uploaded images (ID documents, profile pictures, etc.). 
**DO NOT delete or overwrite this folder during deployment!**

## Safe Deployment Steps

### Method 1: Manual Deployment (Recommended)

```bash
# 1. SSH into Hostinger server
ssh your-username@your-server.com

# 2. Navigate to your app directory
cd /path/to/your/app

# 3. Backup uploads folder (IMPORTANT!)
cp -r backend/uploads backend/uploads_backup_$(date +%Y%m%d_%H%M%S)

# 4. Pull latest code
git pull origin main

# 5. Verify uploads folder still exists
ls -la backend/uploads/

# 6. If uploads folder is empty, restore from backup
# (This should NOT happen if .gitignore is set correctly)
# cp -r backend/uploads_backup_YYYYMMDD_HHMMSS/* backend/uploads/

# 7. Install dependencies (if needed)
cd backend
npm install

# 8. Restart the application
pm2 restart your-app-name
# OR
systemctl restart your-service-name
```

### Method 2: Automated Deployment Script

Create a file `deploy.sh` on your server:

```bash
#!/bin/bash

APP_DIR="/path/to/your/app"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment..."

# Navigate to app directory
cd $APP_DIR

# Backup uploads
echo "📦 Backing up uploads folder..."
mkdir -p $BACKUP_DIR
cp -r backend/uploads $BACKUP_DIR/uploads_$DATE

# Pull latest code
echo "⬇️ Pulling latest code..."
git pull origin main

# Verify uploads folder
if [ ! -d "backend/uploads" ]; then
    echo "⚠️ Uploads folder missing! Restoring from backup..."
    cp -r $BACKUP_DIR/uploads_$DATE backend/uploads
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install --production

# Restart application
echo "🔄 Restarting application..."
pm2 restart backend

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
./deploy.sh
```

## Verification Checklist

After deployment, verify:

- [ ] Application is running: `pm2 status` or `systemctl status your-service`
- [ ] Uploads folder exists: `ls -la backend/uploads/`
- [ ] Old images are accessible: Check a few image URLs in browser
- [ ] New uploads work: Try uploading a new document
- [ ] Database connections work: Check logs for errors

## Rollback Plan

If something goes wrong:

```bash
# Stop the application
pm2 stop backend

# Restore from backup
cp -r /path/to/backups/uploads_YYYYMMDD_HHMMSS backend/uploads

# Revert code (if needed)
git reset --hard HEAD~1

# Restart
pm2 start backend
```

## Environment Variables

Make sure these are set on Hostinger:

```env
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
PORT=5000
NODE_ENV=production
```

## Common Issues

### Issue: Images not loading after deployment
**Solution:** Check if uploads folder path is correct in your code and .env file

### Issue: New uploads failing
**Solution:** Check folder permissions
```bash
chmod 755 backend/uploads
chown -R www-data:www-data backend/uploads  # or your server user
```

### Issue: Old images missing
**Solution:** Restore from backup
```bash
cp -r /path/to/backups/uploads_LATEST/* backend/uploads/
```

## Best Practices

1. **Always backup before deployment**
2. **Test in staging environment first** (if available)
3. **Keep multiple backups** (at least last 5 deployments)
4. **Monitor logs after deployment**: `pm2 logs backend`
5. **Have a rollback plan ready**

## Future Improvement: Cloud Storage

For better scalability and safety, consider moving uploads to:
- AWS S3
- Cloudinary
- DigitalOcean Spaces
- Backblaze B2

This eliminates the risk of losing files during deployment.
