import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User, UserRole } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import StudentDashboard from './dashboards/StudentDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import PrincipalDashboard from './dashboards/PrincipalDashboard';
import FoundationHeadDashboard from './dashboards/FoundationHeadDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import WelcomePlaceholder from './dashboards/WelcomePlaceholder';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageSchoolsPage from './pages/ManageSchoolsPage';
import InputGradesPage from './pages/InputGradesPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import MyClassPage from './pages/MyClassPage';
import GradesPage from './pages/GradesPage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import MyAttendancePage from './pages/MyAttendancePage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import AcademicReportPage from './pages/AcademicReportPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import TeacherDataPage from './pages/TeacherDataPage';
import StudentDataPage from './pages/StudentDataPage';
import SchoolReportPage from './pages/SchoolReportPage';
import ManageSubjectsPage from './pages/ManageSubjectsPage';
import ManageClassesPage from './pages/ManageClassesPage';
import TeachingJournalPage from './pages/TeachingJournalPage';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderDashboardByRole = () => {
    switch (user.role) {
      case UserRole.STUDENT:
        return <StudentDashboard user={user} />;
      case UserRole.TEACHER:
        return <TeacherDashboard user={user} />;
      case UserRole.PRINCIPAL:
        return <PrincipalDashboard user={user} />;
      case UserRole.FOUNDATION_HEAD:
        return <FoundationHeadDashboard user={user} />;
      case UserRole.ADMIN:
        return <AdminDashboard user={user} />;
      default:
        return <WelcomePlaceholder user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <Routes>
            <Route path="/" element={renderDashboardByRole()} />
            
            {/* Admin Pages */}
            <Route path="/kelola-pengguna" element={<ManageUsersPage />} />
            <Route path="/kelola-sekolah" element={<ManageSchoolsPage />} />
            <Route path="/kelola-mata-pelajaran" element={<ManageSubjectsPage />} />
            <Route path="/kelola-kelas" element={<ManageClassesPage />} />
            <Route path="/pengaturan-sistem" element={<SystemSettingsPage />} />

            {/* Foundation Head Pages */}
            <Route path="/laporan-akademik" element={<AcademicReportPage />} />
            <Route path="/data-sekolah" element={<ManageSchoolsPage />} />
            <Route path="/pengumuman" element={<AnnouncementsPage user={user} />} />

            {/* Principal Pages */}
            <Route path="/data-guru" element={<TeacherDataPage user={user} />} />
            <Route path="/data-siswa" element={<StudentDataPage user={user} />} />
            <Route path="/laporan-sekolah" element={<SchoolReportPage user={user} />} />

            {/* Teacher Pages */}
            <Route path="/input-nilai" element={<InputGradesPage user={user} />} />
            <Route path="/absensi-siswa" element={<StudentAttendancePage user={user} />} />
            <Route path="/kelas-saya" element={<MyClassPage user={user} />} />
            <Route path="/jurnal-mengajar" element={<TeachingJournalPage user={user} />} />

            {/* Student Pages */}
            <Route path="/jadwal-pelajaran" element={<ClassSchedulePage />} />
            <Route path="/lihat-nilai" element={<GradesPage user={user} />} />
            <Route path="/absensi" element={<MyAttendancePage user={user} />} />

            <Route path="*" element={<WelcomePlaceholder user={user} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;