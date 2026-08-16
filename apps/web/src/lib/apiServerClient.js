// Use environment variable if available (for production), otherwise default to localhost
export const API_SERVER_URL =
  import.meta.env.VITE_API_SERVER_URL || "http://localhost:3001";

const apiServerClient = {
  fetch: async (url, options = {}) => {
    return await window.fetch(API_SERVER_URL + url, options);
  },
};

export default apiServerClient;

export { apiServerClient };
