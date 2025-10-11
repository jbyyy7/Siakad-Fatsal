
import React, { useState } from 'react';
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
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const onNavigate = (page: string) => {
    setCurrentPage(page);
    if(isSidebarOpen) setSidebarOpen(false); // Close sidebar on navigation on mobile
  };

  const renderContent = () => {
    switch (currentPage) {
      // Common
      case 'Dashboard':
        switch (user.role) {
          case UserRole.STUDENT:
            return <StudentDashboard user={user} onNavigate={onNavigate} />;
          case UserRole.TEACHER:
            return <TeacherDashboard user={user} onNavigate={onNavigate} />;
          case UserRole.PRINCIPAL:
            return <PrincipalDashboard user={user} onNavigate={onNavigate} />;
          case UserRole.FOUNDATION_HEAD:
            return <FoundationHeadDashboard user={user} onNavigate={onNavigate} />;
          case UserRole.ADMIN:
              return <AdminDashboard user={user} onNavigate={onNavigate} />;
          default:
            return <WelcomePlaceholder user={user} />;
        }
      // Admin Pages
      case 'Kelola Pengguna':
        return <ManageUsersPage />;
      case 'Kelola Sekolah':
        return <ManageSchoolsPage />;
      case 'Kelola Mata Pelajaran':
        return <ManageSubjectsPage />;
       case 'Kelola Kelas':
        return <ManageClassesPage />;
      case 'Pengaturan Sistem':
        return <SystemSettingsPage />;
      
      // Foundation Head Pages
      case 'Laporan Akademik':
        return <AcademicReportPage />;
      case 'Data Sekolah': // Re-use manage schools page, maybe with read-only view in future
        return <ManageSchoolsPage />;
      case 'Pengumuman':
        return <AnnouncementsPage user={user} />;

      // Principal Pages
      case 'Data Guru':
        return <TeacherDataPage user={user} />;
      case 'Data Siswa':
        return <StudentDataPage user={user} />;
      case 'Laporan Sekolah':
        return <SchoolReportPage user={user} />;

      // Teacher Pages
      case 'Input Nilai':
        return <InputGradesPage user={user}/>;
      case 'Absensi Siswa':
        return <StudentAttendancePage user={user} />;
      case 'Kelas Saya':
        return <MyClassPage user={user} />;
      case 'Jurnal Mengajar':
        return <TeachingJournalPage user={user} />;
      
      // Student Pages
      case 'Jadwal Pelajaran':
        return <ClassSchedulePage />;
      case 'Lihat Nilai':
        return <GradesPage user={user} />;
      case 'Absensi':
        return <MyAttendancePage user={user} />;

      default:
        return <WelcomePlaceholder user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} currentPage={currentPage} onNavigate={onNavigate} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} pageTitle={currentPage} onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
