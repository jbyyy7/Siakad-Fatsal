import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
// FIX: Import User and UserRole types
import { User, UserRole } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';

// Dashboards
import AdminDashboard from './dashboards/AdminDashboard';
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
import MyClassPage from './pages/MyClassPage';
import TeachingJournalPage from './pages/TeachingJournalPage';
import GradesPage from './pages/GradesPage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import MyAttendancePage from './pages/MyAttendancePage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import AdminGradesPage from './pages/AdminGradesPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';


interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderDashboardByRole = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard user={user} />;
      case UserRole.FOUNDATION_HEAD:
        return <FoundationHeadDashboard user={user} />;
      case UserRole.PRINCIPAL:
        return <PrincipalDashboard user={user} />;
      case UserRole.TEACHER:
        return <TeacherDashboard user={user} />;
      case UserRole.STUDENT:
        return <StudentDashboard user={user} />;
      default:
        return <WelcomePlaceholder user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <Routes>
            <Route path="/" element={renderDashboardByRole()} />
            
            {/* Universal Routes */}
            <Route path="/pengaturan-akun" element={<ProfileSettingsPage user={user} />} />
            
            {/* Admin Routes */}
            <Route path="/kelola-pengguna" element={<ManageUsersPage />} />
            <Route path="/kelola-sekolah" element={<ManageSchoolsPage />} />
            <Route path="/kelola-mapel" element={<ManageSubjectsPage />} />
            <Route path="/kelola-kelas" element={<ManageClassesPage />} />
            <Route path="/pengaturan-sistem" element={<SystemSettingsPage />} />
            <Route path="/pantau-absensi" element={<AdminAttendancePage />} />
            <Route path="/pantau-nilai" element={<AdminGradesPage />} />
            
            {/* Foundation Head Routes */}
            <Route path="/laporan-akademik" element={<AcademicReportPage />} />
            <Route path="/data-sekolah" element={<ManageSchoolsPage />} />
            <Route path="/pengumuman" element={<AnnouncementsPage user={user}/>} />

            {/* Principal Routes */}
            <Route path="/data-guru" element={<TeacherDataPage user={user}/>} />
            <Route path="/data-siswa" element={<StudentDataPage user={user}/>} />
            <Route path="/laporan-sekolah" element={<SchoolReportPage user={user}/>} />

            {/* Teacher Routes */}
            <Route path="/input-nilai" element={<InputGradesPage user={user}/>} />
            <Route path="/absensi-siswa" element={<StudentAttendancePage user={user}/>} />
            <Route path="/kelas-saya" element={<MyClassPage user={user}/>} />
            <Route path="/jurnal-mengajar" element={<TeachingJournalPage user={user}/>} />

            {/* Student Routes */}
            <Route path="/lihat-nilai" element={<GradesPage user={user} />} />
            <Route path="/jadwal-pelajaran" element={<ClassSchedulePage />} />
            <Route path="/absensi" element={<MyAttendancePage user={user} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;