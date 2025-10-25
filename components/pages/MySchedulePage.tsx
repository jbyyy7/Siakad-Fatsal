import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { IdentificationIcon } from '../icons/IdentificationIcon';
import { User } from '../../types';

const DAYS = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Minggu'];

interface Schedule {
  id: string;
  class_id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  class?: { name: string };
  subject?: { name: string };
}

interface MySchedulePageProps {
  user: User;
}

export default function MySchedulePage({ user }: MySchedulePageProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 7); // 0 = Minggu, convert to 7

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          class:classes(name),
          subject:subjects(name)
        `)
        .eq('teacher_id', user.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      alert('Gagal memuat jadwal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Group schedules by day
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day_of_week]) {
      acc[schedule.day_of_week] = [];
    }
    acc[schedule.day_of_week].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);

  // Filter schedules for selected day
  const todaySchedules = groupedSchedules[selectedDay] || [];

  // Stats
  const totalClasses = new Set(schedules.map(s => s.class_id)).size;
  const totalSubjects = new Set(schedules.map(s => s.subject_id)).size;
  const totalHours = schedules.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Memuat jadwal...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" />
          Jadwal Mengajar Saya
        </h1>
        <p className="text-gray-600 mt-1">
          Jadwal mengajar Anda untuk minggu ini
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <IdentificationIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Kelas</div>
              <div className="text-2xl font-bold text-gray-900">{totalClasses}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Mata Pelajaran</div>
              <div className="text-2xl font-bold text-gray-900">{totalSubjects}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Jam Mengajar/Minggu</div>
              <div className="text-2xl font-bold text-gray-900">{totalHours}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          {DAYS.slice(1).map((day, index) => {
            const dayNumber = index + 1;
            const isSelected = selectedDay === dayNumber;
            const hasSchedule = groupedSchedules[dayNumber]?.length > 0;
            
            return (
              <button
                key={dayNumber}
                onClick={() => setSelectedDay(dayNumber)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : hasSchedule
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {day}
                {hasSchedule && (
                  <span className="ml-2 text-xs">
                    ({groupedSchedules[dayNumber].length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Jadwal {DAYS[selectedDay]}
          </h2>
        </div>

        {todaySchedules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CalendarIcon className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p>Tidak ada jadwal mengajar di hari ini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {todaySchedules.map((schedule) => (
              <div key={schedule.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span className="font-medium">
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      </div>
                      {schedule.room && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {schedule.room}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {schedule.subject?.name || 'Mata Pelajaran'}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <IdentificationIcon className="w-4 h-4" />
                      <span>{schedule.class?.name || 'Kelas'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedDay === new Date().getDay() || (selectedDay === 7 && new Date().getDay() === 0)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedDay === new Date().getDay() || (selectedDay === 7 && new Date().getDay() === 0)
                        ? 'Hari Ini'
                        : DAYS[selectedDay]}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Overview */}
      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Ringkasan Mingguan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Jam Mengajar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {DAYS.slice(1).map((day, index) => {
                const dayNumber = index + 1;
                const daySchedules = groupedSchedules[dayNumber] || [];
                
                return (
                  <tr key={dayNumber} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{day}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{daySchedules.length} jam</span>
                    </td>
                    <td className="px-6 py-4">
                      {daySchedules.length > 0 ? (
                        <div className="text-sm text-gray-600">
                          {daySchedules.slice(0, 2).map((s, i) => (
                            <div key={i}>
                              {s.start_time} - {s.subject?.name}
                            </div>
                          ))}
                          {daySchedules.length > 2 && (
                            <div className="text-blue-600">
                              +{daySchedules.length - 2} lainnya
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Tidak ada jadwal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
