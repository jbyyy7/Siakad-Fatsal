import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User, UserRole } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';

// Dashboards
import AdminDashboard from './dashboards/AdminDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import FoundationHeadDashboard from './dashboards/FoundationHeadDashboard';
import PrincipalDashboard from './dashboards/PrincipalDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import WelcomePlaceholder from './dashboards/WelcomePlaceholder';

// Pages
import ManageUsersPage from './pages/ManageUsersPage';
import ManageSchoolsPage from './pages/ManageSchoolsPage';
import ManageSubjectsPage from './pages/ManageSubjectsPage';
import ManageClassesPage from './pages/ManageClassesPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import AcademicReportPage from './pages/AcademicReportPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import TeacherDataPage from './pages/TeacherDataPage';
import StudentDataPage from './pages/StudentDataPage';
import SchoolReportPage from './pages/SchoolReportPage';
import InputGradesPage from './pages/InputGradesPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import MyClassPage from './pages/MyClassPage';
import TeachingJournalPage from './pages/TeachingJournalPage';
import GradesPage from './pages/GradesPage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import MyAttendancePage from './pages/MyAttendancePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
// FIX: Import AdminAttendancePage and AdminGradesPage, which were previously missing files.
import AdminAttendancePage from './pages/AdminAttendancePage';
import AdminGradesPage from './pages/AdminGradesPage';


interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // DEBUG: SUPER DETAILED DASHBOARD LOG
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 DASHBOARD ROUTING DEBUG:');
  console.log('  👤 User:', user.name);
  console.log('  🎭 User Role:', user.role, `(type: ${typeof user.role})`);
  console.log('  ✅ UserRole.ADMIN:', UserRole.ADMIN);
  console.log('  ✅ UserRole.STUDENT:', UserRole.STUDENT);
  console.log('  ❓ user.role === UserRole.ADMIN?:', user.role === UserRole.ADMIN);
  console.log('  ❓ user.role === UserRole.STUDENT?:', user.role === UserRole.STUDENT);
  console.log('  📋 All UserRole values:', Object.values(UserRole));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const renderDashboardByRole = () => {
    console.log('🔀 Switching on role:', user.role);
    switch (user.role) {
      case UserRole.ADMIN:
        console.log('✅ MATCHED: AdminDashboard');
        return <AdminDashboard user={user} />;
      case UserRole.STAFF:
        console.log('✅ MATCHED: StaffDashboard');
        return <AdminDashboard user={user} />;
      case UserRole.STAFF:
        console.log('✅ MATCHED: StaffDashboard');
        return <StaffDashboard user={user} />;
      case UserRole.FOUNDATION_HEAD:
        console.log('✅ MATCHED: FoundationHeadDashboard');
        return <FoundationHeadDashboard user={user} />;
      case UserRole.PRINCIPAL:
        console.log('✅ MATCHED: PrincipalDashboard');
        return <PrincipalDashboard user={user} />;
      case UserRole.TEACHER:
        console.log('✅ MATCHED: TeacherDashboard');
        return <TeacherDashboard user={user} />;
      case UserRole.STUDENT:
        console.log('✅ MATCHED: StudentDashboard');
        return <StudentDashboard user={user} />;
      default:
        console.log('⚠️  NO MATCH - Using WelcomePlaceholder');
        return <WelcomePlaceholder user={user} />;
    }
  };

  const renderRoutesByRole = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return (
          <>
            <Route path="/kelola-pengguna" element={<ManageUsersPage />} />
            <Route path="/kelola-sekolah" element={<ManageSchoolsPage />} />
            <Route path="/kelola-mapel" element={<ManageSubjectsPage />} />
            <Route path="/kelola-kelas" element={<ManageClassesPage />} />
            <Route path="/pantau-absensi" element={<AdminAttendancePage user={user} />} />
            <Route path="/pantau-nilai" element={<AdminGradesPage user={user} />} />
            <Route path="/pengaturan-sistem" element={<SystemSettingsPage />} />
            <Route path="/teacher-attendance" element={<TeacherAttendancePage currentUser={user} />} />
          </>
        );
      case UserRole.STAFF:
        return (
          <>
            <Route path="/manage-users" element={<ManageUsersPage />} />
            <Route path="/manage-classes" element={<ManageClassesPage />} />
            <Route path="/manage-subjects" element={<ManageSubjectsPage />} />
            <Route path="/student-attendance" element={<AdminAttendancePage user={user} />} />
            <Route path="/teacher-attendance" element={<TeacherAttendancePage currentUser={user} />} />
            <Route path="/grades" element={<AdminGradesPage user={user} />} />
            <Route path="/announcements" element={<AnnouncementsPage user={user} />} />
          </>
        );
      case UserRole.FOUNDATION_HEAD:
        return (
          <>
            <Route path="/laporan-akademik" element={<AcademicReportPage />} />
            <Route path="/data-sekolah" element={<ManageSchoolsPage />} />
            <Route path="/pengumuman" element={<AnnouncementsPage user={user} />} />
          </>
        );
      case UserRole.PRINCIPAL:
        return (
          <>
            <Route path="/data-guru" element={<TeacherDataPage user={user} />} />
            <Route path="/data-siswa" element={<StudentDataPage user={user} />} />
            <Route path="/laporan-sekolah" element={<SchoolReportPage user={user} />} />
            <Route path="/teacher-attendance" element={<TeacherAttendancePage currentUser={user} />} />
            <Route path="/pengumuman" element={<AnnouncementsPage user={user} />} />
          </>
        );
      case UserRole.TEACHER:
        return (
          <>
            <Route path="/input-nilai" element={<InputGradesPage user={user} />} />
            <Route path="/absensi-siswa" element={<StudentAttendancePage user={user} />} />
            <Route path="/kelas-saya" element={<MyClassPage user={user} />} />
            <Route path="/jurnal-mengajar" element={<TeachingJournalPage user={user} />} />
          </>
        );
      case UserRole.STUDENT:
        return (
          <>
            <Route path="/lihat-nilai" element={<GradesPage user={user} />} />
            <Route path="/jadwal-pelajaran" element={<ClassSchedulePage user={user} />} />
            <Route path="/absensi" element={<MyAttendancePage user={user} />} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Routes>
            <Route path="/" element={renderDashboardByRole()} />
            <Route path="/pengaturan-akun" element={<ProfileSettingsPage user={user} />} />
            {renderRoutesByRole()}
            {/* Fallback route can be added here for 404 */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
