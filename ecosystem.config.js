module.exports = {
  apps: [
    {
      /**
       * PocketBase Database
       * Port: 8090
       *
       * IMPORTANT: Pastikan binary pocketbase sudah di-download dan executable
       * Download: https://pocketbase.io/docs/
       * Linux: chmod +x apps/pocketbase/pocketbase
       */
      name: "pocketbase",
      cwd: "./apps/pocketbase",
      script: "./pocketbase", // Binary langsung (bukan node scripts/serve.js)
      args: "serve --http=127.0.0.1:8090 --encryptionEnv=PB_ENCRYPTION_KEY --dir=./pb_data --migrationsDir=./pb_migrations --hooksDir=./pb_hooks",
      env: {
        PB_ENCRYPTION_KEY: "ThisIsA32CharacterSecretKey12345",
        PB_SUPERUSER_EMAIL: "admin@admin.com",
        PB_SUPERUSER_PASSWORD: "password123",
      },
      env_production: {
        PB_ENCRYPTION_KEY: "ThisIsA32CharacterSecretKey12345",
        PB_SUPERUSER_EMAIL: "admin@admin.com",
        PB_SUPERUSER_PASSWORD: "password123",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      instances: 1,
      exec_mode: "fork",
      error_file: "./logs/pocketbase-error.log",
      out_file: "./logs/pocketbase-out.log",
      log_file: "./logs/pocketbase-combined.log",
      time: true,
    },
    {
      name: "api-server",
      cwd: "./apps/api",
      script: "node",
      args: "src/main.js",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        HOST: "0.0.0.0", // Listen on all network interfaces for production
        POCKETBASE_PUBLIC_URL: "http://127.0.0.1:8090",
        CORS_ORIGIN:
          "http://127.0.0.1:3000,https://alamanahkeu.site,https://www.alamanahkeu.site",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
    },
    {
      name: "web-frontend",
      cwd: "./apps/web",
      script: "node",
      args: "node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3000", // Production port 3000
      env: {
        NODE_ENV: "production",
        VITE_API_SERVER_URL: "http://127.0.0.1:3001", // Match .env variable name
        POCKETBASE_PUBLIC_URL: "http://127.0.0.1:8090", // Match .env variable name
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
