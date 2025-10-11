import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { User, NotificationSettings } from '../../types';
import { dataService } from '../../services/dataService';
import { WhatsappIcon } from '../icons/WhatsappIcon';

interface ParentPortalViewProps {
    user: User;
    onBack: () => void;
}

const ParentPortalView: React.FC<ParentPortalViewProps> = ({ user, onBack }) => {
    const [settings, setSettings] = useState<NotificationSettings>({
        whatsappNumber: '6281234567890',
        attendance: true,
        newAssignment: true,
        dailyReport: true,
    });
    const [isSaved, setIsSaved] = useState(false);
    const [academicStats, setAcademicStats] = useState({ averageScore: 'N/A', attendancePercentage: 'N/A' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [gradesData, attendanceData] = await Promise.all([
                    dataService.getGradesForStudent(user.id),
                    dataService.getAttendanceForStudent(user.id)
                ]);

                const avgScore = gradesData.length > 0 
                    ? (gradesData.reduce((acc, curr) => acc + curr.score, 0) / gradesData.length).toFixed(1) 
                    : 'N/A';

                const attendancePct = attendanceData.length > 0 
                    ? Math.round((attendanceData.filter(a => a.status === 'Hadir').length / attendanceData.length) * 100).toString() + '%' 
                    : '100%';

                setAcademicStats({ averageScore: avgScore, attendancePercentage: attendancePct });
            } catch (error) {
                console.error("Failed to fetch parent portal stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [user.id]);

    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: checked }));
        setIsSaved(false);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({...prev, whatsappNumber: e.target.value }));
        setIsSaved(false);
    }
    
    const handleSave = () => {
        console.log("Saving settings:", settings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-gray-800">Portal Orang Tua</h2>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Kembali ke Dasbor Siswa
                </button>
            </div>
            <p className="text-gray-600 mb-8">Pantau perkembangan akademik ananda {user.name}.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                 <Card className="bg-blue-50">
                    <p className="text-lg font-medium text-blue-800">Rata-rata Nilai</p>
                    <p className="text-4xl font-bold text-blue-900">{isLoading ? '...' : academicStats.averageScore}</p>
                 </Card>
                 <Card className="bg-green-50">
                    <p className="text-lg font-medium text-green-800">Tingkat Kehadiran</p>
                    <p className="text-4xl font-bold text-green-900">{isLoading ? '...' : academicStats.attendancePercentage}</p>
                 </Card>
                 <Card className="bg-yellow-50">
                    <p className="text-lg font-medium text-yellow-800">Tugas Belum Selesai</p>
                    <p className="text-4xl font-bold text-yellow-900">1</p>
                 </Card>
            </div>
            
            <Card title="Pengaturan Notifikasi WhatsApp" icon={WhatsappIcon}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700">Nomor WhatsApp Orang Tua</label>
                        <input
                            type="tel"
                            id="whatsappNumber"
                            name="whatsappNumber"
                            value={settings.whatsappNumber}
                            onChange={handleNumberChange}
                            className="mt-1 block w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                            placeholder="Contoh: 62812xxxx"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Aktifkan Notifikasi Untuk:</label>
                        <div className="flex items-center">
                            <input id="attendance" name="attendance" type="checkbox" checked={settings.attendance} onChange={handleSettingChange} className="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500" />
                            <label htmlFor="attendance" className="ml-3 block text-sm text-gray-900">Info Kehadiran (saat anak tidak masuk)</label>
                        </div>
                        <div className="flex items-center">
                            <input id="newAssignment" name="newAssignment" type="checkbox" checked={settings.newAssignment} onChange={handleSettingChange} className="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500" />
                            <label htmlFor="newAssignment" className="ml-3 block text-sm text-gray-900">Tugas Baru</label>
                        </div>
                        <div className="flex items-center">
                            <input id="dailyReport" name="dailyReport" type="checkbox" checked={settings.dailyReport} onChange={handleSettingChange} className="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500" />
                            <label htmlFor="dailyReport" className="ml-3 block text-sm text-gray-900">Laporan Harian Pulang Sekolah</label>
                        </div>
                    </div>
                </div>
                 <div className="mt-6 flex items-center">
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        Simpan Pengaturan
                    </button>
                    {isSaved && <span className="ml-4 text-sm text-green-600">Pengaturan berhasil disimpan!</span>}
                </div>
            </Card>
        </div>
    );
};

export default ParentPortalView;