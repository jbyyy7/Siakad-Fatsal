import React from 'react';
import Card from '../Card';
import { MOCK_GAMIFICATION } from '../../constants';
import ProgressBar from '../ui/ProgressBar';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
// FIX: Corrected import for Badge component to use the default export.
import BadgeUI from '../ui/Badge';

interface GamificationSectionProps {
  studentId: string;
}

const GamificationSection: React.FC<GamificationSectionProps> = ({ studentId }) => {
  const profile = MOCK_GAMIFICATION[studentId];

  if (!profile) {
    return null; // or a default state
  }

  return (
    <Card title="Perjalanan Belajarku" icon={AcademicCapIcon}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Section */}
        <div className="md:col-span-2">
          <h4 className="font-semibold text-gray-700 mb-3">Penguasaan Materi</h4>
          <div className="space-y-4">
            {Object.entries(profile.progress).map(([subject, value]) => (
              <div key={subject}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">{subject}</span>
                  <span className="text-sm font-bold text-brand-700">{value}%</span>
                </div>
                <ProgressBar value={value} />
              </div>
            ))}
          </div>
        </div>

        {/* Badges Section */}
        <div className="md:col-span-1">
          <h4 className="font-semibold text-gray-700 mb-3">Lencana Prestasi</h4>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map(badge => (
                <div key={badge.id} className="group relative" title={badge.description}>
                     <BadgeUI color="green" className="text-2xl p-2 cursor-pointer transition-transform group-hover:scale-110">
                        {badge.icon}
                    </BadgeUI>
                </div>
            ))}
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