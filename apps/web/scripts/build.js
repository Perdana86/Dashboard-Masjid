#!/usr/bin/env node

/**
 * Build script untuk menjalankan generate-llms.js dan vite build
 * Cross-platform compatible (Windows, Linux, macOS)
 */

import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { join } from "path";

const OUT_DIR = "../../dist/apps/web";

console.log("🔨 Starting build process...\n");

// Step 1: Jalankan generate-llms.js (optional, ignore errors)
try {
  console.log("📝 Running generate-llms.js...");
  execSync("node tools/generate-llms.js", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("✅ generate-llms.js completed\n");
} catch (error) {
  console.warn("⚠️  generate-llms.js failed (continuing anyway)...");
  console.warn(`   Error: ${error.message}\n`);
}

// Step 2: Jalankan Vite build
try {
  console.log("📦 Running Vite build...");
  console.log(`   Output directory: ${OUT_DIR}\n`);

  execSync("vite build", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });

  console.log("\n✅ Build completed successfully!");
  console.log(`📁 Build output: ${join(process.cwd(), OUT_DIR)}\n`);
} catch (error) {
  console.error("\n❌ Build failed!");
  console.error(`   Error: ${error.message}`);
  console.error("\n💡 Tips:");
  console.error("   - Check if all dependencies are installed: npm install");
  console.error("   - Check for TypeScript/ESLint errors");
  console.error('   - Run "npm run clean" and try again\n');
  process.exit(1);
}
