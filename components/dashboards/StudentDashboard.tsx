// FIX: Implemented the StudentDashboard component which was a placeholder.
import React, { useState } from 'react';
import { User } from '../../types';
import Card from '../Card';
import { MOCK_GRADES } from '../../constants';
import AIChatAssistant from '../features/AIChatAssistant';
import { SparklesIcon } from '../icons/SparklesIcon';
import ParentPortalView from '../features/ParentPortalView';
import GamificationSection from '../features/GamificationSection';

interface StudentDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onNavigate }) => {
    const [showAIChat, setShowAIChat] = useState(false);
    const [showParentPortal, setShowParentPortal] = useState(false);
    const myGrades = MOCK_GRADES[user.id] || [];
    const recentGrades = myGrades.slice(0, 3);

    if (showParentPortal) {
        return <ParentPortalView user={user} onBack={() => setShowParentPortal(false)} />;
    }

    return (
        <div className="relative">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Halo, {user.name}!</h2>
            <p className="text-gray-600 mb-8">Selamat datang kembali di dasbor belajarmu. Terus semangat!</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Nilai Terbaru">
                         {recentGrades.length > 0 ? (
                            <ul className="space-y-3">
                                {recentGrades.map((grade) => (
                                    <li key={grade.subject} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-semibold text-gray-800">{grade.subject}</span>
                                        <span className={`font-bold text-xl ${grade.score >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>{grade.grade} ({grade.score})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">Belum ada nilai yang diinput.</p>
                        )}
                    </Card>
                    
                    <GamificationSection studentId={user.id} />

                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <Card title="Akses Cepat">
                        <div className="flex flex-col space-y-3">
                            <button onClick={() => onNavigate('Jadwal Pelajaran')} className="w-full text-left p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Jadwal Pelajaran</button>
                            <button onClick={() => onNavigate('Lihat Nilai')} className="w-full text-left p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Lihat Semua Nilai</button>
                            <button onClick={() => onNavigate('Absensi')} className="w-full text-left p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Absensi Saya</button>
                            <button onClick={() => setShowParentPortal(true)} className="w-full text-left p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-800 font-semibold transition-colors">Portal Orang Tua</button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* AI Assistant FAB */}
            <button
                onClick={() => setShowAIChat(true)}
                className="fixed bottom-6 right-6 bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 z-40"
                aria-label="Buka Asisten AI"
            >
                <SparklesIcon className="h-7 w-7" />
            </button>

            {showAIChat && <AIChatAssistant onClose={() => setShowAIChat(false)} />}
        </div>
    );
};

export default StudentDashboard;
