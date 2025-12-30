import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
          sw: path.resolve(__dirname, "sw.js"),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === "sw"
              ? "[name].js"
              : "assets/[name]-[hash].js";
          },
        },
      },
    },
    define: {
      // GEMINI_API_KEY removed - now handled by Vercel serverless function
      // VITE_ADMIN_PASSWORD removed - now handled by serverless auth endpoint
      "import.meta.env.VITE_APPWRITE_ENDPOINT": JSON.stringify(
        env.VITE_APPWRITE_ENDPOINT
      ),
      "import.meta.env.VITE_APPWRITE_PROJECT_ID": JSON.stringify(
        env.VITE_APPWRITE_PROJECT_ID
      ),
      "import.meta.env.VITE_APPWRITE_DATABASE_ID": JSON.stringify(
        env.VITE_APPWRITE_DATABASE_ID
      ),
      "import.meta.env.VITE_APPWRITE_COLLECTION_ID": JSON.stringify(
        env.VITE_APPWRITE_COLLECTION_ID
      ),
      "import.meta.env.VITE_APPWRITE_BUCKET_ID": JSON.stringify(
        env.VITE_APPWRITE_BUCKET_ID
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
