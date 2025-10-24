import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { dataService } from '../../services/dataService';
import { CalendarIcon } from '../icons/CalendarIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ExclamationTriangleIcon } from '../icons/ExclamationTriangleIcon';

interface AbsensiSayaPageProps {
  user: User;
}

type AttendanceStatus = 'present' | 'sick' | 'permission' | 'absent';

interface DailyAttendance {
  date: string;
  status: AttendanceStatus;
  subject?: string;
  note?: string;
}

interface SubjectAttendance {
  subject: string;
  present: number;
  sick: number;
  permission: number;
  absent: number;
  total: number;
  percentage: number;
}

const AbsensiSayaPage: React.FC<AbsensiSayaPageProps> = ({ user }) => {
  const [attendanceData, setAttendanceData] = useState<DailyAttendance[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Demo data
  useEffect(() => {
    const loadAttendance = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        // Generate demo attendance for the month
        const demoAttendance: DailyAttendance[] = [];
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(selectedYear, selectedMonth, day);
          const dayOfWeek = date.getDay();
          
          // Skip weekends
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;
          
          // Only add attendance for past dates
          if (date <= new Date()) {
            const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'sick', 'permission', 'absent'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            demoAttendance.push({
              date: date.toISOString().split('T')[0],
              status: randomStatus,
              subject: randomStatus === 'absent' ? 'Matematika' : undefined,
              note: randomStatus === 'sick' ? 'Sakit demam' : randomStatus === 'permission' ? 'Keperluan keluarga' : undefined
            });
          }
        }

        setAttendanceData(demoAttendance);

        // Calculate subject-wise stats
        const demoSubjectStats: SubjectAttendance[] = [
          { subject: 'Matematika', present: 15, sick: 1, permission: 0, absent: 1, total: 17, percentage: 88.2 },
          { subject: 'Bahasa Indonesia', present: 16, sick: 0, permission: 1, absent: 0, total: 17, percentage: 94.1 },
          { subject: 'Bahasa Inggris', present: 17, sick: 0, permission: 0, absent: 0, total: 17, percentage: 100 },
          { subject: 'Fisika', present: 14, sick: 2, permission: 0, absent: 1, total: 17, percentage: 82.4 },
          { subject: 'Kimia', present: 16, sick: 1, permission: 0, absent: 0, total: 17, percentage: 94.1 },
          { subject: 'Biologi', present: 15, sick: 1, permission: 1, absent: 0, total: 17, percentage: 88.2 },
          { subject: 'Sejarah', present: 17, sick: 0, permission: 0, absent: 0, total: 17, percentage: 100 },
          { subject: 'Geografi', present: 16, sick: 0, permission: 1, absent: 0, total: 17, percentage: 94.1 },
        ];

        setSubjectStats(demoSubjectStats);
      } catch (error) {
        console.error('Failed to load attendance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendance();
  }, [user, selectedMonth, selectedYear]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'sick':
        return 'bg-yellow-500';
      case 'permission':
        return 'bg-blue-500';
      case 'absent':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'sick':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'permission':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'Hadir';
      case 'sick':
        return 'Sakit';
      case 'permission':
        return 'Izin';
      case 'absent':
        return 'Alpha';
      default:
        return '-';
    }
  };

  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceData.find(a => a.date === dateStr);
  };

  const renderCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const attendance = getAttendanceForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isFuture = date > new Date();

      days.push(
        <div
          key={day}
          className={`aspect-square border border-gray-200 p-1 ${
            isWeekend ? 'bg-gray-50' : 'bg-white'
          } ${isToday ? 'ring-2 ring-brand-500' : ''} ${
            isFuture ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'
          }`}
          onClick={() => !isFuture && setSelectedDate(date.toISOString().split('T')[0])}
        >
          <div className="text-xs text-gray-600 mb-1">{day}</div>
          {attendance && !isWeekend && (
            <div className={`w-full h-2 rounded ${getStatusColor(attendance.status)}`} title={getStatusLabel(attendance.status)}></div>
          )}
        </div>
      );
    }

    return days;
  };

  const totalPresent = attendanceData.filter(a => a.status === 'present').length;
  const totalSick = attendanceData.filter(a => a.status === 'sick').length;
  const totalPermission = attendanceData.filter(a => a.status === 'permission').length;
  const totalAbsent = attendanceData.filter(a => a.status === 'absent').length;
  const totalDays = attendanceData.length;
  const attendancePercentage = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : '0';

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const selectedDateData = selectedDate ? attendanceData.find(a => a.date === selectedDate) : null;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-brand-600" />
            Absensi Saya
          </h1>
          <p className="text-gray-600 mt-1">Riwayat kehadiran dan statistik</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-800">{totalDays}</div>
          <div className="text-sm text-gray-600">Total Hari</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{totalPresent}</div>
          <div className="text-sm text-gray-600">Hadir</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{totalSick}</div>
          <div className="text-sm text-gray-600">Sakit</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{totalPermission}</div>
          <div className="text-sm text-gray-600">Izin</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{totalAbsent}</div>
          <div className="text-sm text-gray-600">Alpha</div>
        </div>
      </div>

      {/* Attendance Percentage */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">Persentase Kehadiran</div>
            <div className="text-4xl font-bold mt-2">{attendancePercentage}%</div>
          </div>
          <CheckCircleIcon className="h-16 w-16 opacity-50" />
        </div>
        <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
          <div className="bg-white rounded-full h-2" style={{ width: `${attendancePercentage}%` }}></div>
        </div>
      </div>

      {/* Month Selector & Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="px-3 py-1 text-brand-600 hover:bg-brand-50 rounded transition-colors"
          >
            ← Sebelumnya
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {monthNames[selectedMonth]} {selectedYear}
          </h2>
          <button
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="px-3 py-1 text-brand-600 hover:bg-brand-50 rounded transition-colors"
            disabled={selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()}
          >
            Selanjutnya →
          </button>
        </div>

        {/* Desktop Calendar */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>

        {/* Mobile Day List */}
        <div className="md:hidden space-y-2">
          {attendanceData.map(attendance => (
            <div
              key={attendance.date}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              onClick={() => setSelectedDate(attendance.date)}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(attendance.status)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {new Date(attendance.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="text-sm text-gray-600">{getStatusLabel(attendance.status)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Keterangan:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">Hadir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Sakit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-gray-600">Izin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-gray-600">Alpha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Attendance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Absensi Per Mata Pelajaran</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hadir
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sakit
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Izin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alpha
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persentase
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjectStats.map(stat => (
                <tr key={stat.subject} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{stat.subject}</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">{stat.present}</td>
                  <td className="px-6 py-4 text-center text-yellow-600">{stat.sick}</td>
                  <td className="px-6 py-4 text-center text-blue-600">{stat.permission}</td>
                  <td className="px-6 py-4 text-center text-red-600 font-semibold">{stat.absent}</td>
                  <td className="px-6 py-4 text-center text-gray-900">{stat.total}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${stat.percentage >= 90 ? 'text-green-600' : stat.percentage >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stat.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {subjectStats.map(stat => (
            <div key={stat.subject} className="p-4">
              <div className="font-semibold text-gray-900 mb-3">{stat.subject}</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Hadir</div>
                  <div className="text-lg font-semibold text-green-600">{stat.present}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Sakit</div>
                  <div className="text-lg font-semibold text-yellow-600">{stat.sick}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Izin</div>
                  <div className="text-lg font-semibold text-blue-600">{stat.permission}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Alpha</div>
                  <div className="text-lg font-semibold text-red-600">{stat.absent}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">Persentase Kehadiran</span>
                <span className={`text-lg font-bold ${stat.percentage >= 90 ? 'text-green-600' : stat.percentage >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stat.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Detail Modal */}
      {selectedDate && selectedDateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDate(null)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedDateData.status)}
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-semibold text-gray-900">{getStatusLabel(selectedDateData.status)}</div>
                </div>
              </div>
              {selectedDateData.subject && (
                <div>
                  <div className="text-sm text-gray-500">Mata Pelajaran</div>
                  <div className="font-semibold text-gray-900">{selectedDateData.subject}</div>
                </div>
              )}
              {selectedDateData.note && (
                <div>
                  <div className="text-sm text-gray-500">Catatan</div>
                  <div className="text-gray-700">{selectedDateData.note}</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-6 w-full px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsensiSayaPage;
