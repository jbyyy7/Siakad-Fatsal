import React, { useState, useEffect } from 'react';
import { createSchedule, updateSchedule } from '../../services/dataService';
import type { Class, Subject, Profile } from '../../types';

interface ScheduleFormData {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
}

interface ScheduleFormProps {
  schedule?: any;
  onSuccess: () => void;
  onCancel: () => void;
  classes: Class[];
  subjects: Subject[];
  teachers: Profile[];
}

const DAYS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: "Jum'at" },
  { value: 6, label: 'Sabtu' },
  { value: 7, label: 'Minggu' },
];

export default function ScheduleForm({ schedule, onSuccess, onCancel, classes, subjects, teachers }: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    class_id: schedule?.class_id || '',
    subject_id: schedule?.subject_id || '',
    teacher_id: schedule?.teacher_id || '',
    day_of_week: schedule?.day_of_week || 1,
    start_time: schedule?.start_time || '07:00',
    end_time: schedule?.end_time || '08:00',
    room: schedule?.room || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validasi waktu
      if (formData.start_time >= formData.end_time) {
        setError('Waktu mulai harus lebih awal dari waktu selesai');
        setLoading(false);
        return;
      }

      if (schedule?.id) {
        await updateSchedule(schedule.id, formData);
      } else {
        await createSchedule(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan jadwal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {schedule ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kelas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Guru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guru Pengajar <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Guru</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hari */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hari <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Waktu */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Ruangan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruangan (Opsional)
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Contoh: Ruang 101, Lab Komputer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : schedule ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
