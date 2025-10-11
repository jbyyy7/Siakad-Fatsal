
import React, { useState, useEffect } from 'react';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { GamificationProfile } from '../../types';
import ProgressBar from '../ui/ProgressBar';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import BadgeUI from '../ui/Badge';

interface GamificationSectionProps {
  studentId: string;
}

const GamificationSection: React.FC<GamificationSectionProps> = ({ studentId }) => {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const gamificationProfile = await dataService.getGamificationProfile(studentId);
        setProfile(gamificationProfile);
      } catch (error) {
        console.error("Failed to fetch gamification profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [studentId]);

  if (isLoading) {
    return (
      <Card title="Perjalanan Belajarku" icon={AcademicCapIcon}>
        <p className="text-gray-500">Memuat data...</p>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Card title="Perjalanan Belajarku" icon={AcademicCapIcon}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h4 className="font-semibold text-gray-700 mb-3">Penguasaan Materi</h4>
          <div className="space-y-4">
            {Object.keys(profile.progress).length > 0 ? Object.entries(profile.progress).map(([subject, value]) => (
              <div key={subject}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">{subject}</span>
                  <span className="text-sm font-bold text-brand-700">{value}%</span>
                </div>
                <ProgressBar value={value} />
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada progres materi.</p>}
          </div>
        </div>

        <div className="md:col-span-1">
          <h4 className="font-semibold text-gray-700 mb-3">Lencana Prestasi</h4>
          <div className="flex flex-wrap gap-2">
            {profile.badges.length > 0 ? profile.badges.map(badge => (
                <div key={badge.id} className="group relative" title={badge.description}>
                     <BadgeUI color="green" className="text-2xl p-2 cursor-pointer transition-transform group-hover:scale-110">
                        {badge.icon}
                    </BadgeUI>
                </div>
            )) : <p className="text-sm text-gray-500">Belum ada lencana.</p>}
             <div className="group relative" title="Lencana Terkunci">
                 <BadgeUI color="gray" className="text-2xl p-2 cursor-pointer">
                    ?
                </BadgeUI>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GamificationSection;
