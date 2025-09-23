import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Ensure no restrictive CSP in development
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      // Only set CSP in development, undefined for production to avoid header issues
      ...(mode === "development" && {
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* ws://localhost:* https://qeiyxwuyhetnrnundpep.supabase.co; connect-src 'self' https://qeiyxwuyhetnrnundpep.supabase.co http://localhost:* ws://localhost:*"
      })
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress dynamic import warnings for server-actions
        if (warning.code === 'DYNAMIC_IMPORT' && warning.message.includes('server-actions')) {
          return;
        }
        warn(warning);
      }
    }
  },
  esbuild: {
    target: 'es2020'
  },
  optimizeDeps: {
    entries: ['src/bootstrap.tsx'],
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js'
    ]
  },
  // Use relative base for better compatibility
  base: './'
}));
