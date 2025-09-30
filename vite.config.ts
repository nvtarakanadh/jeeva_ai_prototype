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
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'date-fns'],
          'supabase-vendor': ['@supabase/supabase-js'],
          // Feature chunks
          'doctor-pages': [
            './src/pages/doctor/Dashboard',
            './src/pages/doctor/Prescriptions',
            './src/pages/doctor/ConsultationNotes',
            './src/pages/doctor/PatientRecords',
            './src/pages/doctor/Consultations',
            './src/pages/doctor/Patients',
            './src/pages/doctor/Consents'
          ],
          'patient-pages': [
            './src/pages/patient/Dashboard',
            './src/pages/patient/ConsultationNotes',
            './src/pages/patient/Prescriptions',
            './src/pages/patient/Consultations',
            './src/pages/patient/PatientAccess',
            './src/pages/patient/ConsentManagement',
            './src/pages/patient/AIInsights'
          ],
          'components': [
            './src/components/prescription/CreatePrescription',
            './src/components/consultation/CreateConsultationNote',
            './src/components/consultation/ConsultationBooking'
          ]
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
