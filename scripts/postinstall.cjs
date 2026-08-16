#!/usr/bin/env node

/**
 * Post-install script
 * Sets execute permissions for binaries (Linux/Mac only)
 */

const { execSync } = require("child_process");
const { existsSync, chmodSync } = require("fs");
const path = require("path");
const platform = process.platform;

console.log("🔧 Running post-install setup...");

// Only set permissions on Linux/Mac
if (platform === "win32") {
  console.log("ℹ️  Windows detected. Permission setup skipped.");
  process.exit(0);
}

const files = [
  "apps/pocketbase/pocketbase",
  "deploy/setup-nginx.sh",
  "deploy/deploy.sh",
  "deploy/quick-deploy.sh",
  "deploy/post-deploy-setup.sh",
];

let hasErrors = false;

files.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);

  if (existsSync(filePath)) {
    try {
      chmodSync(filePath, 0o755);
      console.log(`✅ ${file}`);
    } catch (err) {
      console.error(`❌ Failed to set permissions for ${file}`);
      console.error(`   Error: ${err.message}`);
      hasErrors = true;
    }
  } else {
    console.log(`⚠️  ${file} (not found)`);
  }
});

if (hasErrors) {
  console.log("");
  console.log("⚠️  Some permissions could not be set.");
  console.log("   You may need to run: chmod +x <file>");
  console.log("");
  process.exit(1);
} else {
  console.log("");
  console.log("✅ Post-install setup completed!");
  console.log("");
  process.exit(0);
}
