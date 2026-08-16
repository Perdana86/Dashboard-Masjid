#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

const webDir = path.join(__dirname, "..", "apps", "web");

console.log("Building web application...");

try {
  // Run generate-llms.js (ignore errors)
  console.log("Generating LLMs...");
  try {
    execSync("node tools/generate-llms.js", {
      cwd: webDir,
      stdio: "ignore",
      shell: true,
    });
  } catch (e) {
    // Ignore errors from generate-llms.js
  }

  // Run vite build with output
  console.log("Running Vite build...");
  execSync("npx vite build --outDir ../../dist/apps/web", {
    cwd: webDir,
    stdio: "inherit",
    shell: true,
  });

  console.log("\n✓ Build completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("\n✗ Build failed!");
  process.exit(1);
}
