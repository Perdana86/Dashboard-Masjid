import Pocketbase from "pocketbase";

// Use environment variable for production, fallback to /pb for Nginx proxy
// Support both VITE_POCKETBASE_URL and POCKETBASE_PUBLIC_URL for compatibility
const POCKETBASE_API_URL =
  import.meta.env.VITE_POCKETBASE_URL ||
  import.meta.env.POCKETBASE_PUBLIC_URL ||
  "/pb";

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;

export { pocketbaseClient };
