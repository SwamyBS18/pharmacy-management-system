import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: "./client",
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: [
        path.resolve(__dirname, "client"),
        path.resolve(__dirname, "shared"),
        path.resolve(__dirname, "node_modules"),
      ],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Mount Express app only for /api routes
      // This ensures Vite handles all other routes (including the SPA)
      // When Vite middleware mounts at "/api", the Express app receives requests
      // with the "/api" prefix already stripped
      server.middlewares.use("/api", (req, res, next) => {
        console.log(`🔌 API Request: ${req.method} ${req.url}`);
        app(req, res, next);
      });
    },
  };
}
