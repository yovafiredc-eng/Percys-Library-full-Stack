import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      input: {
        main: "./index.html",
        sw: "./src/service-worker.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "sw") return "service-worker.js";
          return "[name].[hash].js";
        },
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react/")) return "react-vendor";
            if (id.includes("react-router")) return "router-vendor";
            if (id.includes("zustand")) return "zustand-vendor";
            if (id.includes("clsx") || id.includes("tailwind")) return "utils-vendor";
            if (id.includes("date-fns")) return "date-vendor";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "zustand", "clsx"],
  },
});

