import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import ChartBarIcon from '../icons/ChartBarIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import DownloadIcon from '../icons/DownloadIcon';

interface School {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  school_id: string;
}

interface Student {
  id: string;
  name: string;
  class_id: string;
  attendance_rate?: number;
  average_grade?: number;
}

interface AttendanceStats {
  total_students: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  attendance_rate: number;
}

interface GradeStats {
  total_students: number;
  average_grade: number;
  highest_grade: number;
  lowest_grade: number;
  passing_rate: number;
}

const MonitoringAkademikPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'grades'>('attendance');
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  // Stats
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [gradeStats, setGradeStats] = useState<GradeStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchClasses(selectedSchool);
    } else {
      setClasses([]);
      setSelectedClass('');
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (activeTab === 'attendance' && selectedClass) {
      fetchAttendanceData();
    } else if (activeTab === 'grades' && selectedClass) {
      fetchGradeData();
    }
  }, [activeTab, selectedClass, dateFilter]);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchClasses = async (schoolId: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, school_id')
        .eq('school_id', schoolId)
        .order('name');
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Fetch attendance records for selected date and class
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          student_id,
          status,
          date,
          students (
            id,
            name,
            class_id
          )
        `)
        .eq('date', dateFilter)
        .eq('students.class_id', selectedClass);

      if (attendanceError) throw attendanceError;

      // Calculate stats
      const total = attendanceData?.length || 0;
      const present = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absent = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const late = attendanceData?.filter(a => a.status === 'late').length || 0;
      const rate = total > 0 ? (present / total) * 100 : 0;

      setAttendanceStats({
        total_students: total,
        present_today: present,
        absent_today: absent,
        late_today: late,
        attendance_rate: rate
      });

      // Map students with attendance data
      const studentList = attendanceData?.map(a => ({
        id: (a.students as any)?.id || '',
        name: (a.students as any)?.name || 'Unknown',
        class_id: (a.students as any)?.class_id || '',
        attendance_rate: a.status === 'present' ? 100 : 0
      })) || [];

      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGradeData = async () => {
    setLoading(true);
    try {
      // Fetch grades for students in selected class
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          student_id,
          grade,
          students (
            id,
            name,
            class_id
          )
        `)
        .eq('students.class_id', selectedClass);

      if (gradesError) throw gradesError;

      // Calculate stats
      const grades = gradesData?.map(g => g.grade).filter(g => g !== null) || [];
      const total = grades.length;
      const average = total > 0 ? grades.reduce((a, b) => a + b, 0) / total : 0;
      const highest = total > 0 ? Math.max(...grades) : 0;
      const lowest = total > 0 ? Math.min(...grades) : 0;
      const passing = grades.filter(g => g >= 75).length;
      const passingRate = total > 0 ? (passing / total) * 100 : 0;

      setGradeStats({
        total_students: total,
        average_grade: average,
        highest_grade: highest,
        lowest_grade: lowest,
        passing_rate: passingRate
      });

      // Group grades by student and calculate average
      const studentGrades = new Map<string, { id: string; name: string; class_id: string; grades: number[] }>();
      
      gradesData?.forEach(g => {
        const studentId = (g.students as any)?.id;
        if (!studentId) return;

        if (!studentGrades.has(studentId)) {
          studentGrades.set(studentId, {
            id: studentId,
            name: (g.students as any)?.name || 'Unknown',
            class_id: (g.students as any)?.class_id || '',
            grades: []
          });
        }
        studentGrades.get(studentId)?.grades.push(g.grade);
      });

      const studentList = Array.from(studentGrades.values()).map(s => ({
        id: s.id,
        name: s.name,
        class_id: s.class_id,
        average_grade: s.grades.reduce((a, b) => a + b, 0) / s.grades.length
      }));

      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching grade data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting data...', { activeTab, selectedSchool, selectedClass, dateFilter });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Monitoring Akademik</h1>
          <p className="text-sm text-gray-600 mt-1">Pantau absensi dan nilai siswa secara real-time</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <DownloadIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Export Data</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'attendance'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ClipboardDocumentListIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Absensi Siswa</span>
          <span className="sm:hidden">Absensi</span>
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'grades'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ChartBarIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Nilai Siswa</span>
          <span className="sm:hidden">Nilai</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Data</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sekolah</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Pilih Sekolah</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              disabled={!selectedSchool}
            >
              <option value="">Pilih Kelas</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {activeTab === 'attendance' && (
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {selectedClass && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {activeTab === 'attendance' && attendanceStats && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <p className="text-sm text-gray-600 mb-1">Total Siswa</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{attendanceStats.total_students}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <p className="text-sm text-gray-600 mb-1">Hadir</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600">{attendanceStats.present_today}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <p className="text-sm text-gray-600 mb-1">Tidak Hadir</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-600">{attendanceStats.absent_today}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <p className="text-sm text-gray-600 mb-1">Tingkat Kehadiran</p>
                <p className="text-2xl lg:text-3xl font-bold text-brand-600">{attendanceStats.attendance_rate.toFixed(1)}%</p>
              </div>
            </>
          )}

          {activeTab === 'grades' && gradeStats && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <p className="text-sm text-gray-600 mb-1">Total Siswa</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{gradeStats.total_students}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <p className="text-sm text-gray-600 mb-1">Rata-rata Nilai</p>
                <p className="text-2xl lg:text-3xl font-bold text-brand-600">{gradeStats.average_grade.toFixed(1)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <p className="text-sm text-gray-600 mb-1">Nilai Tertinggi</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600">{gradeStats.highest_grade}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <p className="text-sm text-gray-600 mb-1">Tingkat Kelulusan</p>
                <p className="text-2xl lg:text-3xl font-bold text-blue-600">{gradeStats.passing_rate.toFixed(1)}%</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Student List / Table */}
      {selectedClass && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              {activeTab === 'attendance' ? 'Daftar Kehadiran' : 'Daftar Nilai'}
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              <p className="mt-2">Memuat data...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Tidak ada data untuk ditampilkan</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                      {activeTab === 'attendance' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Kehadiran</th>
                      )}
                      {activeTab === 'grades' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata Nilai</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                        {activeTab === 'attendance' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              student.attendance_rate === 100
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.attendance_rate === 100 ? 'Hadir' : 'Tidak Hadir'}
                            </span>
                          </td>
                        )}
                        {activeTab === 'grades' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${
                              (student.average_grade || 0) >= 75
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {student.average_grade?.toFixed(1) || '-'}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden p-4 space-y-3">
                {students.map((student, index) => (
                  <div key={student.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500">#{index + 1}</p>
                        <p className="font-medium text-gray-900">{student.name}</p>
                      </div>
                      {activeTab === 'attendance' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          student.attendance_rate === 100
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.attendance_rate === 100 ? 'Hadir' : 'Tidak Hadir'}
                        </span>
                      )}
                      {activeTab === 'grades' && (
                        <span className={`text-lg font-bold ${
                          (student.average_grade || 0) >= 75
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {student.average_grade?.toFixed(1) || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedClass && (
        <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12 text-center">
          <div className="max-w-md mx-auto">
            {activeTab === 'attendance' ? (
              <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            ) : (
              <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Kelas untuk Memulai</h3>
            <p className="text-gray-500">
              Pilih sekolah dan kelas di atas untuk melihat data {activeTab === 'attendance' ? 'absensi' : 'nilai'} siswa
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringAkademikPage;
