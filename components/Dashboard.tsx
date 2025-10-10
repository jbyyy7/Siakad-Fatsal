// FIX: Implemented the Dashboard component which was a placeholder.
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import AdminDashboard from './dashboards/AdminDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import PrincipalDashboard from './dashboards/PrincipalDashboard';
import FoundationHeadDashboard from './dashboards/FoundationHeadDashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageSchoolsPage from './pages/ManageSchoolsPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import AcademicReportPage from './pages/AcademicReportPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import TeacherDataPage from './pages/TeacherDataPage';
import StudentDataPage from './pages/StudentDataPage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import SchoolReportPage from './pages/SchoolReportPage';
import MyClassPage from './pages/MyClassPage';
import InputGradesPage from './pages/InputGradesPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import GradesPage from './pages/GradesPage';
import MyAttendancePage from './pages/MyAttendancePage';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [activePage, setActivePage] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const renderContent = () => {
        switch (activePage) {
            case 'Dashboard':
                switch (user.role) {
                    case UserRole.ADMIN:
                        return <AdminDashboard user={user} onNavigate={setActivePage} />;
                    case UserRole.STUDENT:
                        return <StudentDashboard user={user} onNavigate={setActivePage} />;
                    case UserRole.TEACHER:
                        return <TeacherDashboard user={user} onNavigate={setActivePage} />;
                    case UserRole.PRINCIPAL:
                        return <PrincipalDashboard user={user} onNavigate={setActivePage} />;
                    case UserRole.FOUNDATION_HEAD:
                        return <FoundationHeadDashboard user={user} onNavigate={setActivePage} />;
                    default:
                        return <PlaceholderPage title="Dashboard" />;
                }
            // Admin Pages
            case 'Kelola Sekolah':
                return <ManageSchoolsPage />;
            case 'Kelola Pengguna':
                return <ManageUsersPage />;
            case 'Pengaturan Sistem':
                return <SystemSettingsPage />;

            // Foundation Head Pages
            case 'Laporan Akademik':
                return <AcademicReportPage />;
            case 'Data Sekolah':
                return <ManageSchoolsPage />; // Re-use
            case 'Pengumuman':
                return <AnnouncementsPage />;

            // Principal Pages
            case 'Data Guru':
                return <TeacherDataPage />;
            case 'Data Siswa':
                return <StudentDataPage />;
            // 'Jadwal Pelajaran' is shared
            case 'Laporan Sekolah':
                return <SchoolReportPage />;

            // Teacher Pages
            case 'Kelas Saya':
                return <MyClassPage />;
            case 'Input Nilai':
                return <InputGradesPage />;
            case 'Absensi Siswa':
                return <StudentAttendancePage />;
            
            // Student Pages
            case 'Jadwal Pelajaran':
                 return <ClassSchedulePage />;
            case 'Lihat Nilai':
                return <GradesPage user={user} />;
            case 'Absensi':
                return <MyAttendancePage user={user} />;

            default:
                return <PlaceholderPage title={activePage} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar 
                user={user} 
                activePage={activePage} 
                onNavigate={setActivePage} 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    user={user} 
                    onLogout={onLogout} 
                    pageTitle={activePage} 
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
