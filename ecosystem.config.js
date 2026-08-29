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
