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
const pocketbasePath = `"${join(rootDir, "pocketbase")}"`;

const child = spawn(pocketbasePath, args, {
  stdio: "inherit",
  shell: true,
  env: envVars,
});

child.on("error", (err) => {
  console.error("Failed to start PocketBase:", err.message);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code);
});
