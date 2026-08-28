# 🚀 Development Server Scripts

Scripts untuk menjalankan semua development servers dengan mudah dari direktori utama.

## 📋 Prerequisites

- PowerShell 5.1 atau lebih baru
- Node.js 18+
- PocketBase executable di `apps/pocketbase/pocketbase.exe`

## 🎯 Cara Menggunakan

### Opsi 1: PowerShell Scripts (RECOMMENDED)

Dari direktori utama `Dashboard-Masjid`:

```powershell
# Start semua servers (3 terminal terpisah)
.\scripts\start-all.ps1

# Stop semua servers
.\scripts\stop-all.ps1

# Restart semua servers
.\scripts\restart-all.ps1
```

**Keuntungan:**

- ✅ Setiap server di terminal terpisah
- ✅ Bisa melihat logs masing-masing server
- ✅ Bisa stop/restart individual
- ✅ Auto-detect jika port sudah digunakan

### Opsi 2: NPM Scripts (Single Terminal)

Dari direktori utama:

```powershell
# Start semua servers dalam 1 terminal
npm run dev

# Stop dengan Ctrl+C
```

**Keuntungan:**

- ✅ Simpel, satu command
- ✅ Auto-kill semua servers saat stop

**Kekurangan:**

- ❌ Semua logs tercampur di satu terminal
- ❌ Sulit debug individual server

## 🌐 Access Points

Setelah servers running:

| Service        | URL                   | Description               |
| -------------- | --------------------- | ------------------------- |
| **Web App**    | http://localhost:5000 | Dashboard frontend (Vite) |
| **API Server** | http://localhost:3001 | Express.js API            |
| **PocketBase** | http://localhost:8090 | Database & Admin UI       |

## 🔧 Configuration

### PocketBase Environment Variables

Edit `apps/pocketbase/.env`:

```dotenv
# Encryption key (must be exactly 32 characters)
PB_ENCRYPTION_KEY=ThisIsA32CharacterSecretKey12345

# Superuser credentials
PB_SUPERUSER_EMAIL=admin@admin.com
PB_SUPERUSER_PASSWORD=password123
```

### API Server Environment Variables

Edit `apps/api/.env`:

```dotenv
PORT=3001
CORS_ORIGIN=http://localhost:5000,http://localhost:8090
```

### Web Environment Variables

Edit `apps/web/.env`:

```dotenv
VITE_API_SERVER_URL=/api-server
VITE_POCKETBASE_URL=/pb
```

## 🛠️ Troubleshooting

### Port sudah digunakan

```powershell
# Check port usage
Get-NetTCPConnection -LocalPort 5000
Get-NetTCPConnection -LocalPort 3001
Get-NetTCPConnection -LocalPort 8090

# Kill process by port
Get-NetTCPConnection -LocalPort 5000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### PocketBase tidak start

```powershell
# Manual start dengan env vars
cd apps/pocketbase
$env:PB_ENCRYPTION_KEY="ThisIsA32CharacterSecretKey12345"
./pocketbase.exe serve --http=127.0.0.1:8090
```

### Vite cache corrupt

```powershell
cd apps/web
Remove-Item node_modules\.vite -Recurse -Force
npm run dev
```

## 📝 Development Workflow

1. **Start development:**

   ```powershell
   .\scripts\start-all.ps1
   ```

2. **Open browser:** http://localhost:5000

3. **Make changes** to your code - servers will auto-reload

4. **Stop development:**
   ```powershell
   .\scripts\stop-all.ps1
   ```

## 🎯 Quick Commands

```powershell
# Start all servers
.\scripts\start-all.ps1

# Stop all servers
.\scripts\stop-all.ps1

# Restart all servers
.\scripts\restart-all.ps1

# Or use npm
npm run dev      # Start (single terminal)
npm run start    # Start production
npm run build    # Build web
npm run clean    # Clean all builds
```
