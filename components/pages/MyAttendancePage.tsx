
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { User, AttendanceStatus } from '../../types';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { PrinterIcon } from '../icons/PrinterIcon';

interface MyAttendancePageProps {
    user: User;
}

const MyAttendancePage: React.FC<MyAttendancePageProps> = ({ user }) => {
    const [attendanceData, setAttendanceData] = useState<{ date: string; status: AttendanceStatus }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            setIsLoading(true);
            try {
                const data = await dataService.getAttendanceForStudent(user.id);
                setAttendanceData(data);
            } catch (error) {
                console.error("Failed to fetch attendance data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAttendance();
    }, [user.id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hadir': return 'bg-green-500';
            case 'Sakit': return 'bg-yellow-500';
            case 'Izin': return 'bg-blue-500';
            case 'Alpha': return 'bg-red-500';
            default: return 'bg-gray-200';
        }
    };
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleString('id-ID', { month: 'long' });

    const attendanceMap = new Map(attendanceData.map(item => [item.date, item.status]));
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return { date, status: attendanceMap.get(date) || 'Belum Tercatat' };
    });
    
    const emptySlots = Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null);

    const summary = attendanceData.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalSchoolDays = attendanceData.length;
    const presencePercentage = totalSchoolDays > 0 ? (((summary['Hadir'] || 0) / totalSchoolDays) * 100).toFixed(0) : 100;


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Rekap Absensi Saya</h2>
                <button
                    onClick={() => window.print()}
                    className="no-print flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Cetak Rekap
                </button>
            </div>

            <div id="printable-attendance" className="printable-area">
                <div className="hidden print-header">
                    <h1>Rekapitulasi Kehadiran Siswa</h1>
                    <p>Nama: {user.name} | Bulan: {monthName} {year}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="text-center bg-green-50"><p className="text-sm">Hadir</p><p className="text-2xl font-bold text-green-800">{summary['Hadir'] || 0}</p></Card>
                    <Card className="text-center bg-yellow-50"><p className="text-sm">Sakit</p><p className="text-2xl font-bold text-yellow-800">{summary['Sakit'] || 0}</p></Card>
                    <Card className="text-center bg-blue-50"><p className="text-sm">Izin</p><p className="text-2xl font-bold text-blue-800">{summary['Izin'] || 0}</p></Card>
                    <Card className="text-center bg-red-50"><p className="text-sm">Alpha</p><p className="text-2xl font-bold text-red-800">{summary['Alpha'] || 0}</p></Card>
                </div>

                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Kalender Kehadiran - {monthName} {year}</h3>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-gray-500">Tingkat Kehadiran</p>
                             <p className="text-2xl font-bold text-brand-700">{isLoading ? '...' : presencePercentage}%</p>
                        </div>
                    </div>

                    {isLoading ? <p className="text-center p-8">Memuat kalender...</p> :
                    <>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-600 mb-2">
                        <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {emptySlots.map((_, index) => <div key={`empty-${index}`}></div>)}
                        {calendarDays.map(({ date, status }) => {
                             const dayDate = new Date(date + 'T00:00:00'); // Ensure local timezone
                             const dayOfMonth = dayDate.getDate();
                             const dayOfWeek = dayDate.getDay();
                             const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
                             const color = isWeekend ? 'bg-gray-100' : getStatusColor(status as string);
                             
                             return (
                                <div key={date} className="group relative aspect-square">
                                    <div className={`w-full h-full rounded-md flex items-center justify-center ${color} ${isWeekend ? 'text-gray-400' : 'text-white'} text-sm font-bold`}>
                                        {dayOfMonth}
                                    </div>
                                    <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {date}: {isWeekend ? "Libur" : status}
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                    </>
                    }
                </Card>
            </div>
        </div>
    );
};

export default MyAttendancePage;
