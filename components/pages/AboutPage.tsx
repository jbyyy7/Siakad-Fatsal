import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { BellIcon } from '../icons/BellIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header/Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">FS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SIAKAD Fathus Salafi</h1>
                <p className="text-xs text-gray-500">Sistem Informasi Akademik</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
            >
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-block w-20 h-20 sm:w-24 sm:h-24 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <span className="text-white font-bold text-4xl sm:text-5xl">FS</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            SIAKAD Fathus Salafi
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Solusi Digital untuk Manajemen Sekolah Modern
          </p>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-12">
            Aplikasi berbasis website yang memudahkan pengelolaan sekolah secara digital. 
            Akses kapan saja, dimana saja dari HP, Tablet, atau Komputer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg text-lg"
            >
              Mulai Sekarang →
            </button>
            <a
              href="#features"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-lg border-2 border-indigo-600 text-lg"
            >
              Lihat Fitur
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
            Keuntungan Menggunakan SIAKAD
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <BenefitCard
              icon="🌐"
              title="Akses Kapan Saja"
              description="24/7 online, bisa diakses dari HP, tablet, atau komputer. Tidak perlu install aplikasi."
            />
            <BenefitCard
              icon="🔒"
              title="Data Aman"
              description="Tersimpan di cloud dengan backup otomatis dan keamanan berlapis."
            />
            <BenefitCard
              icon="⚡"
              title="Real-time Update"
              description="Data langsung tersinkronisasi. Tidak perlu menunggu lama."
            />
            <BenefitCard
              icon="📱"
              title="Mobile Friendly"
              description="Tampilan otomatis menyesuaikan layar. Nyaman digunakan di HP."
            />
            <BenefitCard
              icon="💰"
              title="Hemat Waktu & Biaya"
              description="Paperless, tidak perlu cetak laporan. Efisien dan ramah lingkungan."
            />
            <BenefitCard
              icon="👥"
              title="Mudah Digunakan"
              description="Tampilan sederhana dan intuitif. Tidak perlu training lama."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
            Fitur untuk Setiap Pengguna
          </h2>
          
          {/* Admin */}
          <FeatureSection
            icon={<UserCircleIcon className="w-12 h-12 text-indigo-600" />}
            title="Untuk Admin"
            description="Kelola seluruh sistem dengan mudah"
            features={[
              "Dashboard dengan statistik lengkap",
              "Manajemen pengguna (tambah, edit, hapus)",
              "Monitoring akademik real-time",
              "Generate laporan"
            ]}
            color="indigo"
          />

          {/* Siswa */}
          <FeatureSection
            icon={<AcademicCapIcon className="w-12 h-12 text-green-600" />}
            title="Untuk Siswa"
            description="Semua info akademik dalam satu tempat"
            features={[
              "Cek nilai dengan grafik visual",
              "Lihat jadwal pelajaran",
              "Akses materi belajar (PDF, Video, Link)",
              "Submit tugas online",
              "Cek absensi dan kehadiran"
            ]}
            color="green"
          />

          {/* Guru */}
          <FeatureSection
            icon={<ClipboardDocumentListIcon className="w-12 h-12 text-purple-600" />}
            title="Untuk Guru"
            description="Input nilai dan kelola kelas lebih efisien"
            features={[
              "Input nilai siswa dengan validasi",
              "Lihat daftar kelas yang diajar",
              "Upload materi pelajaran",
              "Buat dan kelola tugas",
              "Absensi siswa (segera hadir)"
            ]}
            color="purple"
          />

          {/* Leadership */}
          <FeatureSection
            icon={<BuildingLibraryIcon className="w-12 h-12 text-amber-600" />}
            title="Untuk Kepala Sekolah & Yayasan"
            description="Monitor performa sekolah secara keseluruhan"
            features={[
              "Dashboard dengan KPI sekolah",
              "Perbandingan antar sekolah",
              "Ranking dan statistik",
              "Laporan kehadiran guru & siswa",
              "Buat pengumuman"
            ]}
            color="amber"
          />
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-12 sm:py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
            Fitur Tambahan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <AdditionalFeatureCard
              icon={<BellIcon className="w-10 h-10 text-indigo-600" />}
              title="Notifikasi Real-time"
              description="Terima notifikasi pengumuman, nilai baru, tugas, dan deadline secara instant."
              status="Tersedia"
            />
            <AdditionalFeatureCard
              icon="🎮"
              title="Gamification"
              description="Sistem poin, badge achievement, dan leaderboard untuk motivasi siswa."
              status="Segera Hadir"
            />
            <AdditionalFeatureCard
              icon="👨‍👩‍👧"
              title="Portal Orang Tua"
              description="Orang tua bisa melihat progress anak, download rapor, dan komunikasi dengan guru."
              status="Dalam Pengembangan"
            />
            <AdditionalFeatureCard
              icon="🤖"
              title="AI Chat Assistant"
              description="Asisten virtual untuk bantuan penggunaan aplikasi dan tanya jawab akademik."
              status="Prototype"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-indigo-600 text-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Status Aplikasi
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <StatCard number="75-80%" label="Complete" />
            <StatCard number="18" label="Halaman" />
            <StatCard number="6" label="User Roles" />
            <StatCard number="100%" label="Mobile Ready" />
          </div>
          <div className="text-center mt-8 sm:mt-12">
            <p className="text-lg sm:text-xl mb-4">✅ Production Ready - Siap Digunakan!</p>
            <p className="text-indigo-200 max-w-2xl mx-auto text-sm sm:text-base">
              Fitur utama sudah lengkap dan siap untuk kegiatan sehari-hari. 
              Beberapa fitur advanced masih dalam pengembangan.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">
            Siap Memulai Digitalisasi?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Mari bergabung dengan SIAKAD Fathus Salafi dan rasakan kemudahan manajemen sekolah digital.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-10 py-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-xl text-lg"
          >
            Login Sekarang →
          </button>
          <p className="text-sm text-gray-500 mt-6">
            Belum punya akun? Hubungi admin sekolah Anda
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">SIAKAD Fathus Salafi</h3>
              <p className="text-gray-400 text-sm">
                Sistem Informasi Akademik untuk manajemen sekolah modern.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Navigasi</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fitur</a></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Login</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Kontak</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Jember, Jawa Timur</li>
                <li>admin@fathussalafi.sch.id</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Bantuan</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Hubungi admin sekolah</li>
                <li>Training & onboarding</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Yayasan Fathus Salafi. Dikembangkan dengan ❤️ untuk pendidikan yang lebih baik.</p>
            <p className="mt-2">Versi 1.0 - Production Ready</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper Components
const BenefitCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const FeatureSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
}> = ({ icon, title, description, features, color }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 border-indigo-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    amber: 'bg-amber-50 border-amber-200',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border-2 rounded-xl p-6 sm:p-8 mb-6 sm:mb-8`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm sm:text-base">{description}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const AdditionalFeatureCard: React.FC<{
  icon: React.ReactNode | string;
  title: string;
  description: string;
  status: string;
}> = ({ icon, title, description, status }) => {
  const statusColors = {
    'Tersedia': 'bg-green-100 text-green-800',
    'Segera Hadir': 'bg-blue-100 text-blue-800',
    'Dalam Pengembangan': 'bg-amber-100 text-amber-800',
    'Prototype': 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-start gap-4 mb-4">
        {typeof icon === 'string' ? (
          <div className="text-4xl">{icon}</div>
        ) : (
          <div className="flex-shrink-0">{icon}</div>
        )}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${statusColors[status as keyof typeof statusColors]}`}>
            {status}
          </span>
        </div>
      </div>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

const StatCard: React.FC<{ number: string; label: string }> = ({ number, label }) => (
  <div className="text-center">
    <div className="text-3xl sm:text-4xl font-bold mb-2">{number}</div>
    <div className="text-indigo-200 text-sm sm:text-base">{label}</div>
  </div>
);

export default AboutPage;
