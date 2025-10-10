// FIX: Implemented the Dashboard component which was a placeholder.
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import AdminDashboard from './dashboards/AdminDashboard';
import FoundationHeadDashboard from './dashboards/FoundationHeadDashboard';
import PrincipalDashboard from './dashboards/PrincipalDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageSchoolsPage from './pages/ManageSchoolsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import MyClassPage from './pages/MyClassPage';
import InputGradesPage from './pages/InputGradesPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import GradesPage from './pages/GradesPage';
import MyAttendancePage from './pages/MyAttendancePage';
import AcademicReportPage from './pages/AcademicReportPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import TeacherDataPage from './pages/TeacherDataPage';
import StudentDataPage from './pages/StudentDataPage';
import SchoolReportPage from './pages/SchoolReportPage';
import SystemSettingsPage from './pages/SystemSettingsPage';


interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('Dashboard');

  const onNavigate = (page: string) => {
    setActivePage(page);
  };

  const renderContent = () => {
    if (activePage === 'Dashboard') {
      switch (user.role) {
        case UserRole.ADMIN:
          return <AdminDashboard user={user} onNavigate={onNavigate} />;
        case UserRole.FOUNDATION_HEAD:
          return <FoundationHeadDashboard user={user} />;
        case UserRole.PRINCIPAL:
          return <PrincipalDashboard user={user} />;
        case UserRole.TEACHER:
          return <TeacherDashboard user={user} onNavigate={onNavigate} />;
        case UserRole.STUDENT:
          return <StudentDashboard user={user} />;
        default:
          return <PlaceholderPage title="Dashboard" />;
      }
    }

    // Admin pages
    if (user.role === UserRole.ADMIN) {
        switch(activePage) {
            case 'Kelola Pengguna':
                return <ManageUsersPage />;
            case 'Kelola Sekolah':
                return <ManageSchoolsPage />;
            case 'Pengaturan Sistem':
                return <SystemSettingsPage />;
            default:
                return <PlaceholderPage title={activePage} />;
        }
    }
    
    // Foundation Head pages
    if (user.role === UserRole.FOUNDATION_HEAD) {
        switch(activePage) {
            case 'Laporan Akademik':
                return <AcademicReportPage />;
            case 'Data Sekolah':
                return <ManageSchoolsPage />; // Re-use
            case 'Pengumuman':
                return <AnnouncementsPage />;
            default:
                return <PlaceholderPage title={activePage} />;
        }
    }

    // Principal pages
    if (user.role === UserRole.PRINCIPAL) {
        switch(activePage) {
            case 'Data Guru':
                return <TeacherDataPage />;
            case 'Data Siswa':
                return <StudentDataPage />;
            case 'Jadwal Pelajaran':
                return <ClassSchedulePage />;
            case 'Laporan Sekolah':
                return <SchoolReportPage />;
            default:
                return <PlaceholderPage title={activePage} />;
        }
    }

    // Teacher pages
    if (user.role === UserRole.TEACHER) {
        switch(activePage) {
            case 'Kelas Saya':
                return <MyClassPage />;
            case 'Input Nilai':
                return <InputGradesPage />;
            case 'Absensi Siswa':
                return <StudentAttendancePage />;
            default:
                return <PlaceholderPage title={activePage} />;
        }
    }

    // Student pages
    if (user.role === UserRole.STUDENT) {
        switch(activePage) {
            case 'Jadwal Pelajaran':
                return <ClassSchedulePage />;
            case 'Lihat Nilai':
                return <GradesPage />;
            case 'Absensi':
                return <MyAttendancePage />;
            default:
                return <PlaceholderPage title={activePage} />;
        }
    }

    return <PlaceholderPage title={activePage} />;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} activePage={activePage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} pageTitle={activePage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
