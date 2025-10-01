import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY || '')
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('date-fns')) {
              return 'ui-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            return 'vendor';
          }
          
          // Feature chunks - be more specific to avoid conflicts
          if (id.includes('src/pages/doctor/')) {
            return 'doctor-pages';
          }
          if (id.includes('src/pages/patient/')) {
            return 'patient-pages';
          }
          if (id.includes('src/components/')) {
            return 'components';
          }
          
          // Default chunk for other files
          return undefined;
        }
      }
    },
    // Enable source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    // Target modern browsers for better optimization
    target: 'esnext',
    // Ensure consistent chunk naming
    chunkFileNames: 'assets/[name]-[hash].js',
    entryFileNames: 'assets/[name]-[hash].js',
    assetFileNames: 'assets/[name]-[hash].[ext]',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'date-fns',
      '@supabase/supabase-js'
    ],
    exclude: [
      // Exclude heavy dependencies that are loaded on demand
    ]
  }
});
