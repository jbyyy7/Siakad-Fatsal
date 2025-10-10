// FIX: Implemented the StudentDashboard component which was a placeholder.
import React, { useState } from 'react';
import { User } from '../../types';
import Card from '../Card';
import { MOCK_GRADES } from '../../constants';
import GamificationSection from '../features/GamificationSection';
import ParentPortalView from '../features/ParentPortalView';
import AIChatAssistant from '../features/AIChatAssistant';
import { SparklesIcon } from '../icons/SparklesIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
    const [isParentView, setIsParentView] = useState(false);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

    const myGrades = MOCK_GRADES[user.id] || [];
    const averageScore = myGrades.length > 0 ? (myGrades.reduce((acc, curr) => acc + curr.score, 0) / myGrades.length).toFixed(1) : 'N/A';

    if (isParentView) {
        return <ParentPortalView user={user} onBack={() => setIsParentView(false)} />
    }
  
    return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Hai, {user.name.split(' ')[0]}!</h2>
          <p className="text-gray-600">Semangat belajar hari ini!</p>
        </div>
        <button
            onClick={() => setIsParentView(true)}
            className="flex items-center px-4 py-2 bg-yellow-400 text-yellow-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors shadow"
        >
            <UserCircleIcon className="h-5 w-5 mr-2" />
            Portal Orang Tua
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-blue-50">
            <p className="text-lg font-medium text-blue-800">Rata-rata Nilai</p>
            <p className="text-4xl font-bold text-blue-900">{averageScore}</p>
        </Card>
        <Card className="bg-green-50">
            <p className="text-lg font-medium text-green-800">Kehadiran Bulan Ini</p>
            <p className="text-4xl font-bold text-green-900">98%</p>
        </Card>
        <Card className="bg-yellow-50">
            <p className="text-lg font-medium text-yellow-800">Pelajaran Berikutnya</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">Fisika - 10:00</p>
        </Card>
      </div>

      <div className="mb-8">
        <GamificationSection studentId={user.id} />
      </div>

       <div
        className="fixed bottom-6 right-6 z-40"
       >
        <button
            onClick={() => setIsAiAssistantOpen(true)}
            className="flex items-center px-5 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-transform hover:scale-105 shadow-lg"
        >
            <SparklesIcon className="h-6 w-6 mr-2" />
            Tanya AI
        </button>
      </div>
      
      {isAiAssistantOpen && <AIChatAssistant onClose={() => setIsAiAssistantOpen(false)} />}
    </div>
  );
};

export default StudentDashboard;
