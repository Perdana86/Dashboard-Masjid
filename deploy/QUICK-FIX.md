# 🚨 Quick Fix: Permission Denied Error

## Error:

```
/bin/sh: 1: /var/www/html/masjid/apps/pocketbase/pocketbase: Permission denied
```

## ✅ Solution (1 Command):

```bash
chmod +x apps/pocketbase/pocketbase && npm run start
```

## 📝 Full Fix:

```bash
# Navigate to your app directory
cd /path/to/masjid-dashboard

# Fix PocketBase permissions
chmod +x apps/pocketbase/pocketbase

# Fix all shell scripts
chmod +x deploy/*.sh

# Start the application
npm run start
```

## 🔄 Preventive (During Deployment):

Add this to your deployment script:

```bash
# After cloning/pulling code
npm install --production

# Set permissions
chmod +x apps/pocketbase/pocketbase
chmod +x deploy/*.sh

# Build
npm run build

# Start
npm run start
```

## 🤖 Automated (CI/CD):

In your GitHub Actions / GitLab CI:

```yaml
- name: Set permissions
  run: |
    chmod +x apps/pocketbase/pocketbase
    chmod +x deploy/*.sh
```

## ✅ Verify:

```bash
# Check if PocketBase is executable
ls -la apps/pocketbase/pocketbase

# Should show: -rwxr-xr-x
```

## 🆘 Still Not Working?

Run the post-deploy setup script:

```bash
bash deploy/post-deploy-setup.sh
```

Or check the full troubleshooting guide:

```bash
cat deploy/TROUBLESHOOTING.md
```
