# 📚 Dokumentasi Deployment Dashboard-Masjid

Panduan lengkap untuk men-deploy aplikasi Dashboard-Masjid di lingkungan lokal dan server production.

## 📋 Daftar Isi

- [Arsitektur Aplikasi](#arsitektur-aplikasi)
- [Prasyarat](#prasyarat)
- [Deployment Lokal (Development)](#deployment-lokal-development)
- [Deployment Production Server](#deployment-production-server)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Arsitektur Aplikasi

Aplikasi ini menggunakan arsitektur monorepo dengan 3 komponen utama:

```
┌─────────────────┐
│   Web Frontend  │  Port: 5000
│   (React+Vite)  │
└────────┬────────┘
         │
┌────────▼────────┐
│   API Server    │  Port: 3001
│   (Express.js)  │
└────────┬────────┘
         │
┌────────▼────────┐
│   PocketBase    │  Port: 8090
│   (Database)    │
└─────────────────┘
```

### Struktur Folder

```
Dashboard-Masjid/
├── apps/
│   ├── api/          # Backend API (Express.js)
│   ├── web/          # Frontend (React + Vite)
│   └── pocketbase/   # Database & Backend-as-a-Service
├── scripts/          # Script automation (PowerShell)
├── vault/            # Data sensitif & logs
└── dist/             # Build output (production)
```

---

## ✅ Prasyarat

### Software yang Harus Diinstall

1. **Node.js** (versi 18.0.0 atau lebih baru)
   - Download: https://nodejs.org/
   - Verifikasi: `node --version`

2. **Git** (opsional, untuk version control)
   - Download: https://git-scm.com/

3. **PowerShell** (Windows) atau **Bash** (Linux/Mac)
   - Windows: Sudah terinstall default
   - Linux/Mac: Biasanya sudah tersedia

4. **PocketBase Binary** (untuk production)
   - Download: https://pocketbase.io/docs/
   - Pilih versi yang sesuai dengan OS server

### Port yang Digunakan

| Aplikasi   | Port | Protokol |
| ---------- | ---- | -------- |
| Web        | 5000 | HTTP     |
| API        | 3001 | HTTP     |
| PocketBase | 8090 | HTTP     |

---

## 🖥️ Deployment Lokal (Development)

### Langkah 1: Clone/Download Project

```bash
# Jika menggunakan Git
git clone <repository-url>
cd "Dashboard-Masjid"

# Atau extract folder Dashboard-Masjid jika download manual
```

### Langkah 2: Install Dependencies

```bash
# Install semua dependencies sekaligus
npm run setup

# Atau install manual satu per satu
npm install
cd apps/web && npm install
cd ../api && npm install
cd ../pocketbase && npm install
```

### Langkah 3: Setup Environment Variables

Buat file `.env` di setiap folder yang diperlukan:

#### A. File `apps/pocketbase/.env`

```env
PB_ENCRYPTION_KEY=ThisIsA32CharacterSecretKey12345
PB_SUPERUSER_EMAIL=admin@admin.com
PB_SUPERUSER_PASSWORD=password123
```

**Catatan:**

- `PB_ENCRYPTION_KEY` harus tepat 32 karakter
- Ganti password dengan yang lebih aman untuk production

#### B. File `apps/api/.env`

```env
PORT=3001
NODE_ENV=development
POCKETBASE_URL=http://127.0.0.1:8090
```

#### C. File `apps/web/.env`

```env
VITE_API_URL=http://127.0.0.1:3001
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### Langkah 4: Download PocketBase Binary (Development)

1. Download PocketBase dari https://pocketbase.io/docs/
2. Extract file `pocketbase.exe` (Windows) atau `pocketbase` (Linux/Mac)
3. Letakkan di folder `apps/pocketbase/`
4. Pastikan file executable (Linux/Mac):
   ```bash
   chmod +x apps/pocketbase/pocketbase
   ```

### Langkah 5: Jalankan Development Servers

**Opsi A: Menggunakan Script PowerShell (Windows)**

```powershell
.\scripts\start-all.ps1
```

**Opsi B: Menggunakan NPM Scripts**

```bash
# Jalankan semua server sekaligus
npm run dev

# Atau jalankan satu per satu di terminal terpisah
npm run dev --prefix apps/web
npm run dev --prefix apps/api
npm run dev --prefix apps/pocketbase
```

### Langkah 6: Akses Aplikasi

Buka browser dan akses:

- **Frontend Web**: http://localhost:5000
- **API Server**: http://localhost:3001
- **PocketBase Admin**: http://localhost:8090/\_/

### Langkah 7: Setup Initial Database

Setelah PocketBase berjalan:

1. Buka http://localhost:8090/\_/
2. Login dengan kredensial dari `.env`:
   - Email: `admin@admin.com`
   - Password: `password`
3. Migrations akan otomatis dijalankan
4. Verifikasi collections sudah terbuat

---

## 🚀 Deployment Production Server

### Persiapan Server

#### Spesifikasi Minimum Server

- **CPU**: 2 Core
- **RAM**: 2 GB
- **Storage**: 10 GB
- **OS**: Ubuntu 20.04+ / Windows Server 2019+

#### Setup Firewall

Buka port yang diperlukan:

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH

# Windows Firewall (PowerShell)
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

---

### Metode 1: Deployment Manual (Recommended)

#### Langkah 1: Upload Files ke Server

```bash
# Upload menggunakan SCP
scp -r "Dashboard-Masjid" user@server:/var/www/

# Atau upload menggunakan FTP/SFTP client seperti FileZilla
```

#### Langkah 2: Install Node.js di Server

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi
node --version
npm --version
```

#### Langkah 3: Install Dependencies

```bash
cd /var/www/Dashboard-Masjid

# Install semua dependencies
npm run setup
```

#### Langkah 4: Setup Production Environment

Buat file `.env` untuk production:

**A. `apps/pocketbase/.env`**

```env
PB_ENCRYPTION_KEY=GantiDenganKunciRahasia32Karakter
PB_SUPERUSER_EMAIL=admin@masjid-anda.com
PB_SUPERUSER_PASSWORD=PasswordSangatRahasia123!
```

**B. `apps/api/.env`**

```env
PORT=3001
NODE_ENV=production
POCKETBASE_URL=http://127.0.0.1:8090
CORS_ORIGIN=https://dashboard.masjid-anda.com
```

**C. `apps/web/.env`**

```env
VITE_API_URL=https://api.masjid-anda.com
VITE_POCKETBASE_URL=https://db.masjid-anda.com
```

#### Langkah 5: Download PocketBase Binary

```bash
cd /var/www/Dashboard-Masjid/apps/pocketbase

# Download PocketBase (ganti dengan versi terbaru)
wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.0/pocketbase_0.23.0_linux_amd64.zip

# Extract
unzip pocketbase_0.23.0_linux_amd64.zip

# Beri permission executable
chmod +x pocketbase

# Cleanup
rm pocketbase_0.23.0_linux_amd64.zip
```

#### Langkah 6: Build Frontend

```bash
cd /var/www/Dashboard-Masjid

# Build untuk production
npm run build:web
```

#### Langkah 7: Setup Reverse Proxy (Nginx)

Install Nginx:

```bash
sudo apt update
sudo apt install nginx -y
```

Buat konfigurasi Nginx:

```bash
sudo nano /etc/nginx/sites-available/dashboard-masjid
```

Isi dengan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name dashboard.masjid-anda.com;

    # Redirect ke HTTPS (opsional, setelah setup SSL)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Server
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # PocketBase Admin
    location /pb {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan konfigurasi:

```bash
sudo ln -s /etc/nginx/sites-available/dashboard-masjid /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Langkah 8: Setup SSL dengan Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Dapatkan sertifikat SSL
sudo certbot --nginx -d dashboard.masjid-anda.com

# Auto-renewal sudah otomatis terkonfigurasi
```

#### Langkah 9: Setup Process Manager (PM2)

Install PM2:

```bash
sudo npm install -g pm2
```

Buat file konfigurasi PM2:

```bash
nano /var/www/Dashboard-Masjid/ecosystem.config.js
```

Isi dengan:

```javascript
module.exports = {
  apps: [
    {
      name: "pocketbase",
      cwd: "./apps/pocketbase",
      script: "./pocketbase",
      args: "serve --http=127.0.0.1:8090 --encryptionEnv=PB_ENCRYPTION_KEY --dir=./pb_data --migrationsDir=./pb_migrations --hooksDir=./pb_hooks",
      env: {
        PB_ENCRYPTION_KEY: "GantiDenganKunciRahasia32Karakter",
        PB_SUPERUSER_EMAIL: "admin@masjid-anda.com",
        PB_SUPERUSER_PASSWORD: "PasswordSangatRahasia123!",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      instances: 1,
      exec_mode: "fork",
    },
    {
      name: "api-server",
      cwd: "./apps/api",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        POCKETBASE_URL: "http://127.0.0.1:8090",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
    },
    {
      name: "web-frontend",
      cwd: "./apps/web",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        VITE_API_URL: "https://api.masjid-anda.com",
        VITE_POCKETBASE_URL: "https://db.masjid-anda.com",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
```

Start semua services:

```bash
cd /var/www/Dashboard-Masjid
pm2 start ecosystem.config.js

# Simpan konfigurasi PM2
pm2 save

# Setup PM2 untuk startup otomatis
pm2 startup
```

#### Langkah 10: Verifikasi Deployment

```bash
# Cek status PM2
pm2 status

# Lihat logs
pm2 logs

# Test koneksi
curl http://localhost:5000
curl http://localhost:3001/health
curl http://localhost:8090/api/health
```

---

### Metode 2: Deployment dengan Docker (Coming Soon)

> Dokumentasi Docker deployment akan ditambahkan kemudian.

---

### Metode 3: Deployment dengan Script Otomatis

#### Windows Server

Gunakan script yang tersedia:

```powershell
# Restart semua services
.\scripts\restart-all.ps1

# Stop semua services
.\scripts\stop-all.ps1

# Start semua services
.\scripts\start-all.ps1
```

#### Linux Server

Buat script bash:

```bash
nano /var/www/Dashboard-Masjid/deploy/start.sh
```

Isi dengan:

```bash
#!/bin/bash

cd /var/www/Dashboard-Masjid

echo "🚀 Starting all services..."

# Start PocketBase
cd apps/pocketbase
./pocketbase serve --http=127.0.0.1:8090 &
POCKETBASE_PID=$!

# Wait for PocketBase to start
sleep 3

# Start API
cd ../api
npm start &
API_PID=$!

# Wait for API to start
sleep 2

# Start Web
cd ../web
npm start &
WEB_PID=$!

echo "✅ All services started"
echo "PocketBase PID: $POCKETBASE_PID"
echo "API PID: $API_PID"
echo "Web PID: $WEB_PID"

# Wait for all processes
wait
```

Beri permission:

```bash
chmod +x /var/www/Dashboard-Masjid/deploy/start.sh
```

---

## ⚙️ Konfigurasi Environment

### Environment Variables Lengkap

#### PocketBase (`apps/pocketbase/.env`)

| Variable                | Required | Default | Description                |
| ----------------------- | -------- | ------- | -------------------------- |
| `PB_ENCRYPTION_KEY`     | ✅       | -       | Kunci enkripsi 32 karakter |
| `PB_SUPERUSER_EMAIL`    | ✅       | -       | Email admin superuser      |
| `PB_SUPERUSER_PASSWORD` | ✅       | -       | Password admin superuser   |

#### API Server (`apps/api/.env`)

| Variable         | Required | Default               | Description                          |
| ---------------- | -------- | --------------------- | ------------------------------------ |
| `PORT`           | ✅       | 3001                  | Port API server                      |
| `NODE_ENV`       | ✅       | development           | Environment (development/production) |
| `POCKETBASE_URL` | ✅       | http://127.0.0.1:8090 | URL PocketBase                       |
| `CORS_ORIGIN`    | ❌       | \*                    | Allowed CORS origins                 |

#### Web Frontend (`apps/web/.env`)

| Variable              | Required | Default               | Description    |
| --------------------- | -------- | --------------------- | -------------- |
| `VITE_API_URL`        | ✅       | http://127.0.0.1:3001 | URL API server |
| `VITE_POCKETBASE_URL` | ✅       | http://127.0.0.1:8090 | URL PocketBase |

### Security Best Practices

1. **Ganti semua default credentials**

   ```env
   # JANGAN gunakan ini di production!
   PB_SUPERUSER_PASSWORD=password123

   # GUNAKAN password yang kuat
   PB_SUPERUSER_PASSWORD=K0mPl3xP@ssw0rd!2024#Secure
   ```

2. **Gunakan environment variables untuk secrets**

   ```bash
   # Jangan commit .env ke Git
   echo ".env" >> .gitignore
   ```

3. **Gunakan HTTPS di production**
   - Setup SSL certificate
   - Redirect HTTP ke HTTPS

4. **Backup data secara berkala**
   ```bash
   # Backup PocketBase
   cd apps/pocketbase
   npm run backup
   ```

---

## 🔧 Troubleshooting

### Error: PocketBase Binary Not Found

**Solusi:**

```bash
# Download PocketBase
cd apps/pocketbase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.0/pocketbase_0.23.0_linux_amd64.zip
unzip pocketbase_0.23.0_linux_amd64.zip
chmod +x pocketbase
```

### Error: Port Already in Use

**Solusi:**

```bash
# Cek port yang digunakan
# Windows
netstat -ano | findstr :8090

# Linux
lsof -i :8090

# Kill process
# Windows
taskkill /PID <PID> /F

# Linux
kill -9 <PID>
```

### Error: Permission Denied (Linux)

**Solusi:**

```bash
# Beri permission executable
chmod +x apps/pocketbase/pocketbase

# Atau jalankan dengan sudo (tidak recommended)
sudo ./apps/pocketbase/pocketbase
```

### Error: CORS Issues

**Solusi:**

1. Pastikan `CORS_ORIGIN` di API server sudah benar
2. Pastikan URL di frontend sesuai dengan backend

```env
# apps/api/.env
CORS_ORIGIN=https://dashboard.masjid-anda.com

# apps/web/.env
VITE_API_URL=https://api.masjid-anda.com
```

### Error: Database Migration Failed

**Solusi:**

```bash
cd apps/pocketbase

# Revert migrations
npm run migrations:revert

# Jalankan ulang migrations
npm run migrations:up
```

### Services Tidak Start Otomatis (Linux)

**Solusi:**

```bash
# Setup PM2 startup
pm2 startup

# Jalankan command yang ditampilkan
# Contoh: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u user --hp /home/user
```

### Nginx 502 Bad Gateway

**Solusi:**

```bash
# Cek apakah services berjalan
pm2 status

# Restart services
pm2 restart all

# Cek Nginx error log
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Frontend Build Gagal

**Solusi:**

```bash
cd apps/web

# Clean cache
npm run clean

# Install ulang dependencies
npm install

# Build ulang
npm run build
```

---

## 📞 Support & Maintenance

### Backup Data

```bash
# Backup PocketBase database
cd apps/pocketbase
npm run backup

# Backup manual
cp -r pb_data /backup/location/pb_data_$(date +%Y%m%d)
```

### Restore Data

```bash
# Stop services
pm2 stop all

# Restore data
cp -r /backup/location/pb_data_latest ./pb_data

# Start services
pm2 start all
```

### Update Aplikasi

```bash
# Pull update dari Git
git pull origin main

# Install dependencies baru
npm run setup

# Build frontend
npm run build:web

# Restart services
pm2 restart all
```

### Monitoring Logs

```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

---

## 📝 Checklist Deployment

### Pre-Deployment

- [ ] Backup data existing (jika ada)
- [ ] Siapkan server dengan spesifikasi memadai
- [ ] Install Node.js 18+
- [ ] Download PocketBase binary
- [ ] Siapkan domain & SSL certificate
- [ ] Setup firewall rules

### Deployment

- [ ] Upload files ke server
- [ ] Install dependencies
- [ ] Setup environment variables (.env)
- [ ] Build frontend
- [ ] Setup Nginx reverse proxy
- [ ] Setup SSL certificate
- [ ] Setup PM2 process manager
- [ ] Start semua services

### Post-Deployment

- [ ] Test akses frontend
- [ ] Test API endpoints
- [ ] Test PocketBase admin panel
- [ ] Verifikasi database migrations
- [ ] Setup monitoring & logging
- [ ] Setup backup otomatis
- [ ] Dokumentasi credentials & akses

---

## 🔗 Referensi

- [PocketBase Documentation](https://pocketbase.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Last Updated:** 2026-08-29  
**Version:** 1.0.0  
**Maintained by:** Perdana AI
**Developmen by** Perdana Tech
**Powered by** **ALLAH SWT**
