import React, { useState, useEffect } from 'react';
import { User, TeacherAttendanceRecord, AttendanceStatus } from '../../types';
import { supabase } from '../../services/dataService';
import { logger } from '../../utils/logger';
import toast from 'react-hot-toast';
import Card from '../Card';

interface TeacherAttendancePageProps {
  currentUser: User;
}

export default function TeacherAttendancePage({ currentUser }: TeacherAttendancePageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TeacherAttendanceRecord | null>(null);

  const isStaffOrAdmin = ['Admin', 'Staff'].includes(currentUser.role);
  const canEdit = isStaffOrAdmin;

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAttendance();
    }
  }, [selectedDate]);

  async function loadTeachers() {
    try {
      // Build query with conditional school_id filter
      let query = supabase
        .from('profiles')
        .select('*')
        .in('role', ['Guru', 'Kepala Sekolah', 'Staff']);
      
      // Only add school_id filter if it exists (avoid school_id=eq.null error)
      if (currentUser.schoolId) {
        query = query.eq('school_id', currentUser.schoolId);
      }
      
      const { data, error } = await query.order('full_name');

      if (error) throw error;

      const formattedTeachers: User[] = data.map((p: any) => ({
        id: p.id,
        email: p.email || '',
        identityNumber: p.identity_number || '',
        name: p.full_name || '',
        role: p.role || '',
        avatarUrl: p.avatar_url || '',
        schoolId: p.school_id,
        schoolName: p.school_name,
        placeOfBirth: p.place_of_birth,
        dateOfBirth: p.date_of_birth,
        gender: p.gender,
        religion: p.religion,
        address: p.address,
        phoneNumber: p.phone_number,
      }));

      setTeachers(formattedTeachers);
    } catch (error) {
      logger.error('Failed to load teachers', error);
      toast.error('Gagal memuat data guru');
    }
  }

  async function loadAttendance() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_attendance')
        .select('*, profiles!teacher_id(name)')
        .eq('school_id', currentUser.schoolId)
        .eq('date', selectedDate);

      if (error) throw error;

      const records: TeacherAttendanceRecord[] = data.map((r: any) => ({
        id: r.id,
        date: r.date,
        teacher_id: r.teacher_id,
        teacherName: r.profiles?.name || 'Unknown',
        school_id: r.school_id,
        check_in_time: r.check_in_time,
        check_out_time: r.check_out_time,
        status: r.status,
        notes: r.notes,
      }));

      setAttendanceRecords(records);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to load attendance', error);
      toast.error('Gagal memuat data absensi');
      setLoading(false);
    }
  }

  async function saveAttendance(teacherId: string, status: AttendanceStatus, checkInTime?: string, notes?: string) {
    try {
      const existing = attendanceRecords.find(r => r.teacher_id === teacherId);

      if (existing) {
        // Update
        const { error } = await supabase
          .from('teacher_attendance')
          .update({
            status,
            check_in_time: checkInTime || existing.check_in_time,
            notes: notes || existing.notes,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('teacher_attendance')
          .insert({
            date: selectedDate,
            teacher_id: teacherId,
            school_id: currentUser.schoolId,
            status,
            check_in_time: checkInTime || null,
            notes: notes || null,
          });

        if (error) throw error;
      }

      toast.success('Absensi berhasil disimpan');
      loadAttendance();
    } catch (error) {
      logger.error('Failed to save attendance', error);
      toast.error('Gagal menyimpan absensi');
    }
  }

  async function quickCheckIn(teacherId: string) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
    await saveAttendance(teacherId, 'Hadir', time);
  }

  const statuses: AttendanceStatus[] = ['Hadir', 'Sakit', 'Izin', 'Alpha'];

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Absensi Guru & Staff</h2>

        <div className="mb-6 flex gap-4 items-center">
          <div>
            <label className="block text-sm mb-2">Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {canEdit && (
            <button
              onClick={() => loadAttendance()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded self-end"
            >
              Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left p-3">Nama</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Check In</th>
                  <th className="text-left p-3">Check Out</th>
                  <th className="text-left p-3">Catatan</th>
                  {canEdit && <th className="text-left p-3">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-400">
                      Tidak ada data guru/staff
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => {
                    const record = attendanceRecords.find(r => r.teacher_id === teacher.id);
                    const isToday = selectedDate === new Date().toISOString().split('T')[0];

                    return (
                      <tr key={teacher.id} className="border-b border-gray-700 hover:bg-gray-800">
                        <td className="p-3">{teacher.name}</td>
                        <td className="p-3">{teacher.role}</td>
                        <td className="p-3">
                          {canEdit ? (
                            <select
                              value={record?.status || ''}
                              onChange={(e) => saveAttendance(teacher.id, e.target.value as AttendanceStatus)}
                              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                            >
                              <option value="">-- Pilih --</option>
                              {statuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs ${
                              record?.status === 'Hadir' ? 'bg-green-600' :
                              record?.status === 'Sakit' ? 'bg-blue-600' :
                              record?.status === 'Izin' ? 'bg-yellow-600' :
                              record?.status === 'Alpha' ? 'bg-red-600' :
                              'bg-gray-600'
                            }`}>
                              {record?.status || '-'}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {record?.check_in_time ? (
                            <span className="text-green-400">{record.check_in_time}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {record?.check_out_time ? (
                            <span className="text-blue-400">{record.check_out_time}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-gray-400 text-xs">{record?.notes || '-'}</span>
                        </td>
                        {canEdit && (
                          <td className="p-3">
                            {isToday && !record && (
                              <button
                                onClick={() => quickCheckIn(teacher.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                              >
                                Check In
                              </button>
                            )}
                            {isToday && record && record.status === 'Hadir' && !record.check_out_time && (
                              <button
                                onClick={async () => {
                                  const now = new Date().toTimeString().split(' ')[0];
                                  const { error } = await supabase
                                    .from('teacher_attendance')
                                    .update({ check_out_time: now })
                                    .eq('id', record.id);
                                  
                                  if (error) {
                                    logger.error('Failed to check out', error);
                                    toast.error('Gagal check out');
                                  } else {
                                    toast.success('Check out berhasil');
                                    loadAttendance();
                                  }
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                              >
                                Check Out
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-900 bg-opacity-30 border border-green-600 p-4 rounded">
            <div className="text-sm text-green-300">Hadir</div>
            <div className="text-2xl font-bold text-green-400">
              {attendanceRecords.filter(r => r.status === 'Hadir').length}
            </div>
          </div>
          <div className="bg-blue-900 bg-opacity-30 border border-blue-600 p-4 rounded">
            <div className="text-sm text-blue-300">Sakit</div>
            <div className="text-2xl font-bold text-blue-400">
              {attendanceRecords.filter(r => r.status === 'Sakit').length}
            </div>
          </div>
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-4 rounded">
            <div className="text-sm text-yellow-300">Izin</div>
            <div className="text-2xl font-bold text-yellow-400">
              {attendanceRecords.filter(r => r.status === 'Izin').length}
            </div>
          </div>
          <div className="bg-red-900 bg-opacity-30 border border-red-600 p-4 rounded">
            <div className="text-sm text-red-300">Alpha</div>
            <div className="text-2xl font-bold text-red-400">
              {attendanceRecords.filter(r => r.status === 'Alpha').length}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
