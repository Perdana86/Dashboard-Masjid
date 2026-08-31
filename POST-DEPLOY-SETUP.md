# 🔧 Fix: PocketBase Binary Not Executable

## ❌ Error Message

```
❌ PocketBase binary is not executable!
Run this command to fix:
  chmod +x /var/www/html/masjid/apps/pocketbase/pocketbase

Or run the post-deploy setup script:
  bash deploy/post-deploy-setup.sh
```

## 🔍 Penyebab

Error ini terjadi karena:

1. PocketBase binary belum memiliki permission executable di Linux/Mac
2. File binary baru saja di-download atau di-upload ke server
3. Permission file tidak terbawa saat upload (FTP/SCP)

---

## ✅ Solusi Quick Fix

### Linux/Mac (VPS/Server)

```bash
# Navigate ke folder project
cd /var/www/html/masjid

# Set permission executable
chmod +x apps/pocketbase/pocketbase

# Verify
ls -la apps/pocketbase/pocketbase
# Harus muncul: -rwxr-xr-x
```

### Windows

Di Windows, permission executable tidak diperlukan. Error ini seharusnya tidak muncul. Jika muncul, pastikan:

1. File `pocketbase.exe` ada di folder `apps/pocketbase/`
2. File tidak corrupt (download ulang jika perlu)

---

## 🚀 Solusi Lengkap (Recommended)

### Menggunakan Post-Deploy Setup Script

Script ini akan melakukan setup lengkap secara otomatis:

#### Linux/Mac

```bash
cd /var/www/html/masjid

# Set permission script
chmod +x deploy/post-deploy-setup.sh

# Jalankan script
./deploy/post-deploy-setup.sh
```

#### Windows (PowerShell)

```powershell
cd "D:\PROJECT\NEW PROJECT\Dashboard-Masjid"

# Jalankan script
.\deploy\post-deploy-setup.ps1
```

---

## 📋 Apa yang Dilakukan Script?

Script `post-deploy-setup.sh` akan:

1. ✅ **Set PocketBase permissions** - Membuat binary executable
2. ✅ **Check dependencies** - Install jika belum
3. ✅ **Check build** - Build frontend jika belum ada
4. ✅ **Check .env files** - Verifikasi environment variables
5. ✅ **Setup PM2** (optional) - Process management

---

## 🔧 Manual Setup Steps

Jika ingin setup manual:

### Step 1: Set PocketBase Permission

```bash
cd /var/www/html/masjid/apps/pocketbase
chmod +x pocketbase
```

### Step 2: Install Dependencies

```bash
cd /var/www/html/masjid

# Install semua dependencies
npm run setup

# Atau manual
npm install
cd apps/web && npm install
cd ../api && npm install
cd ../pocketbase && npm install
```

### Step 3: Build Frontend

```bash
cd /var/www/html/masjid
npm run build
```

### Step 4: Setup Environment Variables

Buat file `.env` di setiap folder:

**apps/pocketbase/.env**

```env
PB_ENCRYPTION_KEY=GantiDenganKunciRahasia32Karakter
PB_SUPERUSER_EMAIL=admin@masjid-anda.com
PB_SUPERUSER_PASSWORD=PasswordSangatRahasia123!
```

**apps/api/.env**

```env
PORT=3001
NODE_ENV=production
POCKETBASE_URL=http://127.0.0.1:8090
```

**apps/web/.env**

```env
VITE_API_URL=https://api.masjid-anda.com
VITE_POCKETBASE_URL=https://db.masjid-anda.com
```

### Step 5: Start Application

```bash
# Menggunakan PM2 (recommended)
pm2 start ecosystem.config.js

# Atau manual
npm run start
```

---

## 🎯 Deployment Checklist

Saat deploy ke VPS, pastikan:

- [ ] PocketBase binary downloaded dan executable
- [ ] Dependencies terinstall
- [ ] Frontend sudah di-build
- [ ] Environment variables sudah di-set
- [ ] PM2 terinstall dan terkonfigurasi
- [ ] Nginx reverse proxy sudah setup
- [ ] SSL certificate sudah terpasang

---

## 📖 Dokumentasi Terkait

- **Post-Deploy Setup Script**: [`deploy/post-deploy-setup.sh`](./deploy/post-deploy-setup.sh)
- **PM2 Guide**: [`PM2-GUIDE.md`](./PM2-GUIDE.md)
- **Deployment Guide**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- **Quick Deploy**: [`DEPLOY.md`](./DEPLOY.md)

---

## 🆘 Troubleshooting

### Error: "Permission denied" saat chmod

```bash
# Pastikan punya permission
sudo chmod +x apps/pocketbase/pocketbase

# Atau gunakan user yang tepat
sudo chown $USER:$USER apps/pocketbase/pocketbase
chmod +x apps/pocketbase/pocketbase
```

### Error: "binary not found"

```bash
# Download PocketBase
cd apps/pocketbase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.0/pocketbase_0.23.0_linux_amd64.zip

# Extract
unzip pocketbase_0.23.0_linux_amd64.zip

# Set permission
chmod +x pocketbase

# Cleanup
rm pocketbase_0.23.0_linux_amd64.zip
```

### Error masih muncul setelah chmod

```bash
# Verify permission
ls -la apps/pocketbase/pocketbase

# Harus muncul: -rwxr-xr-x
# Jika tidak, ulang chmod
chmod 755 apps/pocketbase/pocketbase
```

### SELinux blocking (CentOS/RHEL)

```bash
# Check SELinux status
getenforce

# Jika Enforcing, set context yang tepat
chcon -t bin_t apps/pocketbase/pocketbase

# Atau disable SELinux (tidak recommended)
setenforce 0
```

---

**Updated:** 2026-08-31  
**Status:** ✅ Fixed with post-deploy-setup.sh
