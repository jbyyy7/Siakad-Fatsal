import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Announcement, User } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { EnvelopeIcon } from '../icons/EnvelopeIcon';

interface FoundationHeadDashboardProps {
  user: User;
}

const FoundationHeadDashboard: React.FC<FoundationHeadDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<{ schoolCount: number; latestAnnouncement: Announcement | null }>({ schoolCount: 0, latestAnnouncement: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [schoolCount, announcements] = await Promise.all([
          dataService.getSchoolCount(),
          dataService.getAnnouncements()
        ]);
        setStats({ schoolCount, latestAnnouncement: announcements[0] || null });
      } catch (error) {
        console.error("Failed to fetch foundation head dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, {user.name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <ChartBarIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Analitik Yayasan</p>
              <p className="text-xl font-bold text-gray-800">Lihat Laporan</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <BuildingLibraryIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Jumlah Sekolah</p>
              <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.schoolCount}</p>
            </div>
          </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <EnvelopeIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Pengumuman Terakhir</p>
              <p className="text-lg font-semibold text-gray-800 truncate">
                {isLoading ? '...' : (stats.latestAnnouncement?.title || 'Tidak ada')}
              </p>
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-8">
        <Card title="Akses Cepat">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/laporan-akademik" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Laporan Akademik</h4>
              <p className="text-sm text-gray-600">Lihat laporan performa akademik.</p>
            </Link>
            <Link to="/data-sekolah" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Data Sekolah</h4>
              <p className="text-sm text-gray-600">Kelola informasi sekolah di bawah yayasan.</p>
            </Link>
            <Link to="/pengumuman" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Pengumuman</h4>
              <p className="text-sm text-gray-600">Buat dan lihat pengumuman yayasan.</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FoundationHeadDashboard;