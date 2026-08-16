# 🌐 Domain Setup Guide for Production

## 📍 Where to Place Your Domain

### 1. **Nginx Configuration** (`/etc/nginx/sites-available/`)

File: `/etc/nginx/sites-available/masjid.yourdomain.com`

```nginx
server_name masjid.yourdomain.com www.masjid.yourdomain.com;
```

**Steps:**

```bash
# Copy config
sudo cp nginx.conf.example /etc/nginx/sites-available/masjid.yourdomain.com

# Edit domain
sudo nano /etc/nginx/sites-available/masjid.yourdomain.com
# Replace all occurrences of:
# - masjid.yourdomain.com
# - api.masjid.yourdomain.com
# - admin.masjid.yourdomain.com

# Enable site
sudo ln -s /etc/nginx/sites-available/masjid.yourdomain.com /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

### 2. **Environment Files** (`.env`)

#### API Server (`apps/api/.env`)

```bash
CORS_ORIGIN=https://masjid.yourdomain.com
```

#### Web Frontend (`apps/web/.env`)

```bash
VITE_API_SERVER_URL=https://api.masjid.yourdomain.com
VITE_POCKETBASE_URL=https://admin.masjid.yourdomain.com
```

#### PocketBase (`apps/pocketbase/.env`)

```bash
PB_ENCRYPTION_KEY=your-secret-key
PB_ADMIN_EMAIL=admin@masjid.yourdomain.com
```

---

### 3. **SSL Certificate** (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate for main domain
sudo certbot --nginx -d masjid.yourdomain.com -d www.masjid.yourdomain.com

# Get certificate for API subdomain (if using)
sudo certbot --nginx -d api.masjid.yourdomain.com

# Get certificate for PocketBase admin (if using separate subdomain)
sudo certbot --nginx -d admin.masjid.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## 📋 Complete Domain Checklist

### DNS Configuration (at your domain registrar)

```
Type    Name                    Value                   TTL
A       masjid                  YOUR_SERVER_IP          3600
A       www.masjid              YOUR_SERVER_IP          3600
A       api.masjid              YOUR_SERVER_IP          3600
A       admin.masjid            YOUR_SERVER_IP          3600
```

Or use CNAME for subdomains:

```
Type    Name                    Value                   TTL
A       @                       YOUR_SERVER_IP          3600
CNAME   www                     masjid.yourdomain.com   3600
CNAME   api                     masjid.yourdomain.com   3600
CNAME   admin                   masjid.yourdomain.com   3600
```

---

## 🔧 Quick Setup Script

Create `setup-domain.sh`:

```bash
#!/bin/bash

DOMAIN="masjid.yourdomain.com"
EMAIL="admin@yourdomain.com"

echo "🔧 Setting up domain: $DOMAIN"

# 1. Update Nginx config
echo "📝 Updating Nginx configuration..."
sudo sed -i "s/masjid.yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/$DOMAIN

# 2. Get SSL certificate
echo "🔒 Getting SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# 3. Test and reload
echo "🔄 Testing and reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Domain setup complete!"
echo "   Visit: https://$DOMAIN"
```

---

## 🎯 Domain Placement Summary

| Component        | File                   | Location              | Example Value                       |
| ---------------- | ---------------------- | --------------------- | ----------------------------------- |
| **Nginx Server** | `nginx.conf`           | `server_name`         | `masjid.yourdomain.com`             |
| **API CORS**     | `apps/api/.env`        | `CORS_ORIGIN`         | `https://masjid.yourdomain.com`     |
| **Web API URL**  | `apps/web/.env`        | `VITE_API_SERVER_URL` | `https://api.masjid.yourdomain.com` |
| **PocketBase**   | `apps/pocketbase/.env` | `PB_ADMIN_EMAIL`      | `admin@masjid.yourdomain.com`       |
| **SSL Cert**     | Certbot                | `-d` flag             | `masjid.yourdomain.com`             |
| **DNS**          | Domain Registrar       | A/CNAME records       | `YOUR_SERVER_IP`                    |

---

## 🧪 Testing

After setup, test:

```bash
# Test main domain
curl -I https://masjid.yourdomain.com

# Test API
curl -I https://api.masjid.yourdomain.com/api/health

# Test PocketBase
curl -I https://admin.masjid.yourdomain.com/api/health

# Test SSL
curl -vI https://masjid.yourdomain.com

# Check SSL certificate
openssl s_client -connect masjid.yourdomain.com:443
```

---

## 🔒 Security Checklist

- [ ] Update all `.env` files with production domain
- [ ] Change default PocketBase admin password
- [ ] Set strong encryption keys
- [ ] Enable HTTPS redirect
- [ ] Configure CORS for production domain only
- [ ] Set up SSL auto-renewal
- [ ] Enable firewall (ufw)
- [ ] Restrict database access
- [ ] Use environment variables for secrets

---

## 🆘 Troubleshooting

### Domain not resolving

```bash
# Check DNS propagation
nslookup masjid.yourdomain.com
dig masjid.yourdomain.com

# Wait 24-48 hours for DNS propagation
```

### SSL certificate issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Nginx not loading config

```bash
# Check syntax
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### CORS errors

```bash
# Verify CORS_ORIGIN in apps/api/.env
# Must match your domain exactly (including https://)
CORS_ORIGIN=https://masjid.yourdomain.com
```

---

## 📚 Additional Resources

- [Nginx Configuration](nginx.conf.example)
- [Production Environment Template](../apps/.env.production)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
