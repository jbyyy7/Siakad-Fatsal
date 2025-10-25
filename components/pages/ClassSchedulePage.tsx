import React, { useState, useEffect } from 'react';
import { CalendarIcon } from '../icons/CalendarIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { dataService } from '../../services/dataService';
import { User } from '../../types';

interface ClassSchedulePageProps {
    user: User;
}

interface ScheduleItem {
    time: string;
    subject: string;
    teacher?: string;
    room?: string;
}

type WeekSchedule = {
    [key: string]: ScheduleItem[];
};

const ClassSchedulePage: React.FC<ClassSchedulePageProps> = ({ user }) => {
    const [scheduleData, setScheduleData] = useState<WeekSchedule>({});
    const [isLoading, setIsLoading] = useState(true);
    const [className, setClassName] = useState<string>('');
    const [selectedDay, setSelectedDay] = useState<string>('Senin');

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    useEffect(() => {
        fetchSchedule();
    }, [user.id, user.schoolId]);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const studentClass = await dataService.getClassForStudent(user.id);
            if (!studentClass) {
                console.warn("Student not assigned to any class");
                setIsLoading(false);
                return;
            }
            
            setClassName(studentClass);
            
            // Fetch actual schedule from database
            const scheduleData = await dataService.getScheduleForStudent(user.id);
            
            // Group schedule by day
            const groupedSchedule: WeekSchedule = {
                'Senin': [],
                'Selasa': [],
                'Rabu': [],
                'Kamis': [],
                'Jumat': [],
            };
            
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            
            scheduleData.forEach((schedule: any) => {
                const dayName = dayNames[schedule.dayOfWeek];
                if (groupedSchedule[dayName]) {
                    groupedSchedule[dayName].push({
                        time: schedule.time,
                        subject: schedule.subjectName,
                        teacher: schedule.teacherName,
                        room: schedule.room || '-',
                    });
                }
            });

            setScheduleData(groupedSchedule);
        } catch (error) {
            console.error("Failed to fetch class schedule:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Jadwal Pelajaran</h1>
                    <p className="text-sm text-gray-600 mt-1">{className} - Semester Ganjil 2024/2025</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                >
                    <PrinterIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Cetak Jadwal</span>
                </button>
            </div>

            {/* Day Selector - Mobile */}
            <div className="lg:hidden bg-white rounded-lg shadow-sm p-2">
                <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                    {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>

            {/* Desktop: Full Week View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                            <p className="mt-2 text-gray-500">Memuat jadwal...</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Waktu</th>
                                    {days.map(day => (
                                        <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {[...new Set(Object.values(scheduleData).flatMap(d => d.map(i => i.time)))].map(timeSlot => (
                                    <tr key={timeSlot} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{timeSlot}</td>
                                        {days.map(day => {
                                            const item = scheduleData[day]?.find(i => i.time === timeSlot);
                                            const isBreak = item?.subject?.toLowerCase().includes('istirahat');
                                            
                                            return (
                                                <td key={day} className="px-4 py-3">
                                                    {item ? (
                                                        <div className={`text-sm ${isBreak ? 'text-gray-400 italic' : ''}`}>
                                                            <div className={`font-semibold ${isBreak ? 'text-gray-500' : 'text-gray-900'}`}>
                                                                {item.subject}
                                                            </div>
                                                            {!isBreak && item.teacher && (
                                                                <>
                                                                    <div className="text-gray-600 text-xs mt-1">{item.teacher}</div>
                                                                    {item.room && <div className="text-gray-500 text-xs">{item.room}</div>}
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-400 text-sm">-</div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Mobile: Single Day View */}
            <div className="lg:hidden bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">{selectedDay}</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                        <p className="mt-2 text-gray-500">Memuat jadwal...</p>
                    </div>
                ) : !scheduleData[selectedDay] || scheduleData[selectedDay].length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p>Tidak ada jadwal untuk hari ini</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {scheduleData[selectedDay].map((item, index) => {
                            const isBreak = item.subject.toLowerCase().includes('istirahat');
                            
                            return (
                                <div
                                    key={index}
                                    className={`rounded-lg p-4 ${isBreak ? 'bg-gray-50 border border-gray-200' : 'bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`flex-shrink-0 ${isBreak ? 'text-gray-400' : 'text-brand-600'}`}>
                                            {isBreak ? <ClockIcon className="h-6 w-6" /> : <BookOpenIcon className="h-6 w-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-semibold ${isBreak ? 'text-gray-600 italic' : 'text-gray-900'}`}>{item.subject}</h3>
                                            <p className={`text-sm mt-1 ${isBreak ? 'text-gray-500' : 'text-gray-600'}`}>{item.time}</p>
                                            {!isBreak && (
                                                <>
                                                    {item.teacher && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Guru:</span> {item.teacher}</p>}
                                                    {item.room && <p className="text-sm text-gray-600"><span className="font-medium">Ruang:</span> {item.room}</p>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info Footer */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Informasi Jadwal</p>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                            <li>Setiap pelajaran berlangsung 45 menit</li>
                            <li>Jadwal dapat berubah sewaktu-waktu</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassSchedulePage;
