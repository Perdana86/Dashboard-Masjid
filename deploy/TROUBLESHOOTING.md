# Troubleshooting Guide - Masjid Dashboard

## 🔴 Permission Denied Error

### Error Message:

```
/bin/sh: 1: /var/www/html/masjid/apps/pocketbase/pocketbase: Permission denied
```

### Cause:

PocketBase binary doesn't have execute permissions on Linux servers.

### Solution:

#### Option 1: Quick Fix (Recommended)

```bash
# Navigate to your app directory
cd /path/to/masjid-dashboard

# Make PocketBase binary executable
chmod +x apps/pocketbase/pocketbase

# Run post-deploy setup script
bash deploy/post-deploy-setup.sh

# Start the application
npm run start
```

#### Option 2: During Deployment

Add this to your deployment script:

```bash
# After cloning/deploying code
chmod +x apps/pocketbase/pocketbase
chmod +x deploy/*.sh
```

#### Option 3: Automated in CI/CD

In your deployment pipeline:

```yaml
- name: Set permissions
  run: |
    chmod +x apps/pocketbase/pocketbase
    chmod +x deploy/*.sh
```

---

## 🟠 Other Common Issues

### 1. Node.js Version Mismatch

**Error**: `SyntaxError: Unexpected token 'import'`

**Solution**:

```bash
# Check Node.js version
node --version

# Should be 18 or higher
# If not, update Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:

```bash
# Find process using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in .env file
PORT=3002
```

### 3. SSL Certificate Issues

**Error**: `Failed to authorize SSL certificate`

**Solution**:

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Renew certificate
sudo certbot certonly --standalone -d your-domain.com

# Start Nginx
sudo systemctl start nginx
```

### 4. PM2 Services Not Starting

**Error**: `Process always online`

**Solution**:

```bash
# Check PM2 logs
pm2 logs masjid-api --lines 50
pm2 logs masjid-pocketbase --lines 50

# Restart services
pm2 restart all

# If still failing, delete and recreate
pm2 delete all
pm2 start apps/api/src/main.js --name masjid-api
pm2 start "apps/pocketbase/pocketbase serve --http=127.0.0.1:8090" --name masjid-pocketbase
pm2 save
```

### 5. Nginx 502 Bad Gateway

**Error**: `502 Bad Gateway`

**Solution**:

```bash
# Check if backend services are running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/masjid-dashboard.error.log

# Restart services
pm2 restart all
sudo systemctl reload nginx

# Test backend directly
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:8090/
```

### 6. Build Fails on Server

**Error**: `npm run build` fails

**Solution**:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --production

# Check Node.js version
node --version  # Should be 18+

# Check available memory
free -h  # Should have at least 512MB free

# Build with more memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 7. Static Files Not Loading

**Error**: `404 Not Found` for JS/CSS files

**Solution**:

```bash
# Check if files exist
ls -la /var/www/masjid-dashboard/dist/apps/web/assets/

# Check Nginx configuration
sudo nginx -t

# Check file permissions
sudo chown -R www-data:www-data /var/www/masjid-dashboard
sudo chmod -R 755 /var/www/masjid-dashboard

# Reload Nginx
sudo systemctl reload nginx
```

### 8. Database Migration Errors

**Error**: PocketBase migration fails

**Solution**:

```bash
# Check pb_data directory permissions
ls -la apps/pocketbase/pb_data/

# Fix permissions
chmod -R 755 apps/pocketbase/pb_data/
chown -R $USER:$USER apps/pocketbase/pb_data/

# Backup and reset (if needed)
cp apps/pocketbase/pb_data/data.db apps/pocketbase/pb_data/data.db.backup
# Then restart PocketBase
```

### 9. CORS Errors in Browser

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution**:

```bash
# Update API .env file
CORS_ORIGIN=https://your-domain.com

# Restart API
pm2 restart masjid-api

# Verify in browser console
# Network tab should show correct CORS headers
```

### 10. WebSocket Connection Fails

**Error**: WebSocket connection failed

**Solution**:

```nginx
# In Nginx config, ensure WebSocket support:
location /ws {
    proxy_pass http://127.0.0.1:3001/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

---

## 📞 Getting Help

If you're still experiencing issues:

1. **Check Logs**:

   ```bash
   pm2 logs --lines 100
   sudo tail -f /var/log/nginx/masjid-dashboard.error.log
   ```

2. **System Info**:

   ```bash
   node --version
   npm --version
   nginx -v
   uname -a
   ```

3. **Service Status**:

   ```bash
   pm2 status
   systemctl status nginx
   ```

4. **Open an Issue**:
   - Include error messages
   - Include logs
   - Include system info
   - Describe steps to reproduce

---

## 🔐 Security Checklist

- [ ] SSL certificate is valid and auto-renewing
- [ ] Firewall only allows ports 22, 80, 443
- [ ] .env files are not committed to git
- [ ] PocketBase encryption key is secure
- [ ] Superuser password is strong
- [ ] Regular system updates
- [ ] Regular database backups

---

## 📈 Performance Tips

1. **Enable Gzip**: Already configured in Nginx
2. **Browser Caching**: Static assets cached for 1 year
3. **Database Optimization**: Enable WAL mode in PocketBase
4. **PM2 Cluster Mode**: For high-traffic APIs
5. **CDN**: Consider Cloudflare for static assets
6. **Monitoring**: Setup PM2 + Nginx monitoring

---

## 🔄 Backup & Restore

### Backup Database:

```bash
# Stop PocketBase
pm2 stop masjid-pocketbase

# Backup database
cp apps/pocketbase/pb_data/data.db data.db.backup.$(date +%Y%m%d)

# Restart PocketBase
pm2 start masjid-pocketbase
```

### Restore Database:

```bash
# Stop PocketBase
pm2 stop masjid-pocketbase

# Restore database
cp data.db.backup.20260817 apps/pocketbase/pb_data/data.db

# Restart PocketBase
pm2 start masjid-pocketbase
```

### Full Backup:

```bash
# Create backup directory
mkdir -p /backups/masjid-dashboard/$(date +%Y%m%d)

# Backup everything
cp -r apps/pocketbase/pb_data /backups/masjid-dashboard/$(date +%Y%m%d)/
cp -r .env* /backups/masjid-dashboard/$(date +%Y%m%d)/

# Compress
tar -czf /backups/masjid-dashboard/backup-$(date +%Y%m%d).tar.gz /backups/masjid-dashboard/$(date +%Y%m%d)/
```
