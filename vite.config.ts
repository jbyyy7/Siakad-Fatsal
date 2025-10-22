import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-hot-toast', 'recharts'],
          'excel-vendor': ['exceljs'],
          // Split by feature
          'dashboards': [
            './components/dashboards/AdminDashboard.tsx',
            './components/dashboards/TeacherDashboard.tsx',
            './components/dashboards/StudentDashboard.tsx',
            './components/dashboards/PrincipalDashboard.tsx',
            './components/dashboards/FoundationHeadDashboard.tsx',
          ],
          'forms': [
            './components/forms/UserForm.tsx',
            './components/forms/ClassForm.tsx',
            './components/forms/SubjectForm.tsx',
            './components/forms/SchoolForm.tsx',
            './components/forms/AnnouncementForm.tsx',
            './components/forms/JournalForm.tsx',
          ],
          'pages': [
            './components/pages/ManageUsersPage.tsx',
            './components/pages/ManageClassesPage.tsx',
            './components/pages/ManageSubjectsPage.tsx',
            './components/pages/ManageSchoolsPage.tsx',
            './components/pages/GradesPage.tsx',
            './components/pages/InputGradesPage.tsx',
            './components/pages/AnnouncementsPage.tsx',
          ],
        },
      },
    },
    // Increase chunk size warning limit (we've optimized it)
    chunkSizeWarningLimit: 600,
  },
})
