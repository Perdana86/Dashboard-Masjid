import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import { parse } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Load .env file
const envPath = join(rootDir, ".env");
let envVars = { ...process.env };
try {
  const envContent = readFileSync(envPath, "utf-8");
  const parsed = parse(envContent);
  envVars = { ...process.env, ...parsed };
} catch (err) {
  // .env file not found, use process.env
}

const args = process.argv.slice(2);
const pocketbasePath = join(rootDir, "pocketbase");

// Check if pocketbase binary exists
import { existsSync, accessSync, constants } from "fs";

if (!existsSync(pocketbasePath)) {
  console.error("❌ PocketBase binary not found!");
  console.error("Please download PocketBase from https://pocketbase.io/docs/");
  console.error("and place it in the apps/pocketbase directory");
  process.exit(1);
}

// Check if binary is executable (Linux/Mac)
if (process.platform !== "win32") {
  try {
    accessSync(pocketbasePath, constants.X_OK);
  } catch (err) {
    console.error("❌ PocketBase binary is not executable!");
    console.error("Run this command to fix:");
    console.error(`  chmod +x ${pocketbasePath}`);
    console.error("");
    console.error("Or run the post-deploy setup script:");
    console.error("  bash deploy/post-deploy-setup.sh");
    process.exit(1);
  }
}

const child = spawn(pocketbasePath, args, {
  stdio: "inherit",
  shell: false, // Don't use shell to avoid path issues with spaces
  env: envVars,
});

child.on("error", (err) => {
  console.error("Failed to start PocketBase:", err.message);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code);
});
