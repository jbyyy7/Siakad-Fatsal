import React, { useState } from 'react';
import { User, UserRole } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import AdminDashboard from './dashboards/AdminDashboard';
import FoundationHeadDashboard from './dashboards/FoundationHeadDashboard';
import PrincipalDashboard from './dashboards/PrincipalDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import WelcomePlaceholder from './dashboards/WelcomePlaceholder';

// Page components
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


interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderDashboard = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard user={user} onNavigate={setActivePage} />;
      case UserRole.FOUNDATION_HEAD:
        return <FoundationHeadDashboard user={user} onNavigate={setActivePage} />;
      case UserRole.PRINCIPAL:
        return <PrincipalDashboard user={user} onNavigate={setActivePage} />;
      case UserRole.TEACHER:
        return <TeacherDashboard user={user} onNavigate={setActivePage} />;
      case UserRole.STUDENT:
        return <StudentDashboard user={user} onNavigate={setActivePage} />;
      default:
        return <WelcomePlaceholder user={user} />;
    }
  };

  const renderPage = () => {
    if (activePage === 'Dashboard') {
      return renderDashboard();
    }

    switch (activePage) {
      // Admin
      case 'Kelola Pengguna': return <ManageUsersPage />;
      case 'Kelola Sekolah': return <ManageSchoolsPage />;
      case 'Pengaturan Sistem': return <SystemSettingsPage />;
      
      // Foundation Head
      case 'Laporan Akademik': return <AcademicReportPage />;
      case 'Data Sekolah': return <ManageSchoolsPage />;
      case 'Pengumuman': return <AnnouncementsPage user={user}/>;
      
      // Principal
      case 'Data Guru': return <TeacherDataPage user={user}/>;
      case 'Data Siswa': return <StudentDataPage user={user}/>;
      case 'Jadwal Pelajaran': return <ClassSchedulePage />;
      case 'Laporan Sekolah': return <SchoolReportPage user={user}/>;
      
      // Teacher
      case 'Kelas Saya': return <MyClassPage user={user} />;
      case 'Input Nilai': return <InputGradesPage user={user}/>;
      case 'Absensi Siswa': return <StudentAttendancePage user={user} />;
      
      // Student
      case 'Lihat Nilai': return <GradesPage user={user} />;
      case 'Absensi': return <MyAttendancePage user={user} />;
      // 'Jadwal Pelajaran' is shared with Principal

      default:
        return renderDashboard();
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} activePage={activePage} onNavigate={setActivePage} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} pageTitle={activePage} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <div className="container mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
