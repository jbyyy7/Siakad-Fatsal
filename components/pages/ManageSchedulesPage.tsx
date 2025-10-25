import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
import ScheduleForm from '../forms/ScheduleForm';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { Class, Subject, User, UserRole } from '../../types';

const DAYS = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Minggu'];

interface Schedule {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  class?: { name: string };
  subject?: { name: string };
  teacher?: { full_name: string };
}

export default function ManageSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [filterClass, setFilterClass] = useState('');
  const [filterDay, setFilterDay] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch schedules with related data
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('class_schedules')
        .select(`
          *,
          class:classes(name),
          subject:subjects(name),
          teacher:profiles(full_name)
        `)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (schedulesError) throw schedulesError;
      setSchedules(schedulesData || []);

      // Fetch classes
      const classesData = await dataService.getClasses();
      setClasses(classesData);

      // Fetch subjects
      const subjectsData = await dataService.getSubjects();
      setSubjects(subjectsData);

      // Fetch teachers (Guru only)
      const usersData = await dataService.getUsers({ role: UserRole.TEACHER });
      setTeachers(usersData);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedSchedule(null);
    setShowForm(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;

    try {
      await dataService.deleteSchedule(id);
      alert('Jadwal berhasil dihapus');
      fetchData();
    } catch (error: any) {
      alert('Gagal menghapus jadwal: ' + error.message);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedSchedule(null);
    fetchData();
    alert(selectedSchedule ? 'Jadwal berhasil diupdate' : 'Jadwal berhasil ditambahkan');
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule) => {
    if (filterClass && schedule.class_id !== filterClass) return false;
    if (filterDay && schedule.day_of_week.toString() !== filterDay) return false;
    return true;
  });

  // Group schedules by day and time for table view
  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const key = `${schedule.day_of_week}-${schedule.start_time}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Kelola Jadwal Pelajaran
          </h1>
          <p className="text-gray-600 mt-1">
            Atur jadwal pelajaran untuk setiap kelas
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Jadwal
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Kelas
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Hari
            </label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Hari</option>
              {DAYS.slice(1).map((day, index) => (
                <option key={index + 1} value={index + 1}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruangan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Tidak ada jadwal. Klik "Tambah Jadwal" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {DAYS[schedule.day_of_week]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.start_time} - {schedule.end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {schedule.class?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {schedule.subject?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.teacher?.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.room || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Jadwal</div>
          <div className="text-2xl font-bold text-gray-900">{schedules.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Kelas Terdaftar</div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(schedules.map(s => s.class_id)).size}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Guru Mengajar</div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(schedules.map(s => s.teacher_id)).size}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ScheduleForm
          schedule={selectedSchedule}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setSelectedSchedule(null);
          }}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
        />
      )}
    </div>
  );
}
