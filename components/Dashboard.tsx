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
import ManageHomeroomTeachersPage from './pages/ManageHomeroomTeachersPage';
import ManageSchedulesPage from './pages/ManageSchedulesPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import AcademicReportPage from './pages/AcademicReportPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import TeacherDataPage from './pages/TeacherDataPage';
import StudentDataPage from './pages/StudentDataPage';
import SchoolReportPage from './pages/SchoolReportPage';
import InputGradesPage from './pages/InputGradesPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import SelfAttendancePage from './pages/SelfAttendancePage';
import MyClassPage from './pages/MyClassPage';
import TeachingJournalPage from './pages/TeachingJournalPage';
import GradesPage from './pages/GradesPage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import MyAttendancePage from './pages/MyAttendancePage';
import MateriPelajaranPage from './pages/MateriPelajaranPage';
import TugasSayaPage from './pages/TugasSayaPage';
import AbsensiSayaPage from './pages/AbsensiSayaPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
// Monitoring Pages
import MonitoringAkademikPage from './pages/MonitoringAkademikPage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import AdminGradesPage from './pages/AdminGradesPage';
import GateAttendancePage from './pages/GateAttendancePage';
import StudentGateQRPage from './pages/StudentGateQRPage';
import GateAnalyticsPage from './pages/GateAnalyticsPage';
// New Features - Student Cards & Report Cards
import StudentCardPage from './pages/StudentCardPage';
import ReportCardManagementPage from './pages/ReportCardManagementPage';
import ReportCardViewPage from './pages/ReportCardViewPage';
import AcademicYearManagementPage from './pages/AcademicYearManagementPage';
// New Features - RFID Gate Attendance System
import { RFIDCardManagementPage } from './pages/RFIDCardManagementPage';
import { NFCTapPage } from './pages/NFCTapPage';


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
      case UserRole.STAFF:
        return <StaffDashboard user={user} />;
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

  const renderRoutesByRole = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return (
          <>
            <Route path="/kelola-pengguna" element={<ManageUsersPage />} />
            <Route path="/kelola-sekolah" element={<ManageSchoolsPage />} />
            <Route path="/kelola-mapel" element={<ManageSubjectsPage />} />
            <Route path="/kelola-kelas" element={<ManageClassesPage />} />
            <Route path="/kelola-wali-kelas" element={<ManageHomeroomTeachersPage currentUser={user} />} />
            <Route path="/kelola-jadwal" element={<ManageSchedulesPage />} />
            <Route path="/monitoring-akademik" element={<MonitoringAkademikPage />} />
            <Route path="/absensi-gerbang" element={<GateAttendancePage />} />
            <Route path="/analytics-gerbang" element={<GateAnalyticsPage />} />
            <Route path="/kelola-kartu-rfid" element={<RFIDCardManagementPage user={user} />} />
            <Route path="/nfc-tap" element={<NFCTapPage user={user} />} />
            <Route path="/kartu-pelajar" element={<StudentCardPage user={user} />} />
            <Route path="/tahun-ajaran" element={<AcademicYearManagementPage />} />
            <Route path="/kelola-rapor" element={<ReportCardManagementPage />} />
            <Route path="/lihat-rapor" element={<ReportCardViewPage />} />
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
            <Route path="/kelola-jadwal" element={<ManageSchedulesPage />} />
            <Route path="/student-attendance" element={<AdminAttendancePage user={user} />} />
            <Route path="/teacher-attendance" element={<TeacherAttendancePage currentUser={user} />} />
            <Route path="/absensi-saya" element={<SelfAttendancePage user={user} />} />
            <Route path="/grades" element={<AdminGradesPage user={user} />} />
            <Route path="/absensi-gerbang" element={<GateAttendancePage />} />
            <Route path="/analytics-gerbang" element={<GateAnalyticsPage />} />
            <Route path="/kelola-kartu-rfid" element={<RFIDCardManagementPage user={user} />} />
            <Route path="/nfc-tap" element={<NFCTapPage user={user} />} />
            <Route path="/kartu-pelajar" element={<StudentCardPage user={user} />} />
            <Route path="/tahun-ajaran" element={<AcademicYearManagementPage />} />
            <Route path="/kelola-rapor" element={<ReportCardManagementPage />} />
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
            <Route path="/kelola-wali-kelas" element={<ManageHomeroomTeachersPage currentUser={user} />} />
            <Route path="/laporan-sekolah" element={<SchoolReportPage user={user} />} />
            <Route path="/teacher-attendance" element={<TeacherAttendancePage currentUser={user} />} />
            <Route path="/absensi-saya" element={<SelfAttendancePage user={user} />} />
            <Route path="/pengumuman" element={<AnnouncementsPage user={user} />} />
          </>
        );
      case UserRole.TEACHER:
        return (
          <>
            <Route path="/input-nilai" element={<InputGradesPage user={user} />} />
            <Route path="/absensi-siswa" element={<StudentAttendancePage user={user} />} />
            <Route path="/absensi-saya" element={<SelfAttendancePage user={user} />} />
            <Route path="/kelas-saya" element={<MyClassPage user={user} />} />
            <Route path="/jurnal-mengajar" element={<TeachingJournalPage user={user} />} />
            <Route path="/kelola-rapor" element={<ReportCardManagementPage />} />
            <Route path="/kartu-pelajar" element={<StudentCardPage user={user} />} />
          </>
        );
      case UserRole.STUDENT:
        return (
          <>
            <Route path="/lihat-nilai" element={<GradesPage user={user} />} />
            <Route path="/jadwal-pelajaran" element={<ClassSchedulePage user={user} />} />
            <Route path="/materi" element={<MateriPelajaranPage user={user} />} />
            <Route path="/tugas" element={<TugasSayaPage user={user} />} />
            <Route path="/absensi" element={<AbsensiSayaPage user={user} />} />
            <Route path="/qr-gerbang" element={<StudentGateQRPage />} />
            <Route path="/rapor-saya" element={<ReportCardViewPage />} />
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
            <Route path="/pengaturan-akun" element={<AccountSettingsPage user={user} onUpdate={() => {}} />} />
            {renderRoutesByRole()}
            {/* Fallback route can be added here for 404 */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
