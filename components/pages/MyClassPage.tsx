import React, { useState, useEffect } from 'react';
import { User, Class } from '../../types';
import { dataService } from '../../services/dataService';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';

interface MyClassPageProps {
  user: User;
}

interface StudentWithStats extends User {
  attendance_rate?: number;
  average_grade?: number;
}

const MyClassPage: React.FC<MyClassPageProps> = ({ user }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([]);
  const [isLoading, setIsLoading] = useState({ classes: true, students: false });
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch classes assigned to the teacher
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(prev => ({...prev, classes: true}));
      try {
        const teacherClasses = await dataService.getClasses({ teacherId: user.id });
        setClasses(teacherClasses);
        if (teacherClasses.length > 0) {
          setSelectedClassId(teacherClasses[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch teacher's classes:", error);
      } finally {
        setIsLoading(prev => ({...prev, classes: false}));
      }
    };
    fetchClasses();
  }, [user.id]);

  // Fetch students when a class is selected
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchStudents = async () => {
      setIsLoading(prev => ({...prev, students: true}));
      try {
        const studentsData = await dataService.getStudentsInClass(selectedClassId);
        
        // TODO: Fetch actual stats from database
        // For now, generate random stats for demo
        const studentsWithStats: StudentWithStats[] = studentsData.map(s => ({
          ...s,
          attendance_rate: Math.floor(Math.random() * 30) + 70, // 70-100%
          average_grade: Math.floor(Math.random() * 30) + 70 // 70-100
        }));
        
        setStudents(studentsWithStats);
        setFilteredStudents(studentsWithStats);
      } catch (error) {
        console.error(`Failed to fetch students for class ${selectedClassId}:`, error);
      } finally {
        setIsLoading(prev => ({...prev, students: false}));
      }
    };
    fetchStudents();
  }, [selectedClassId]);

  // Filter students by search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.identityNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const handleViewDetails = (student: StudentWithStats) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const getClassStats = () => {
    if (students.length === 0) return null;

    const avgAttendance = students.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / students.length;
    const avgGrade = students.reduce((sum, s) => sum + (s.average_grade || 0), 0) / students.length;
    const excellentStudents = students.filter(s => (s.average_grade || 0) >= 85).length;

    return { avgAttendance, avgGrade, excellentStudents };
  };

  const stats = getClassStats();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Kelas Saya</h1>
        <p className="text-sm text-gray-600 mt-1">Kelola dan pantau siswa di kelas Anda</p>
      </div>

      {/* Class Selector & Stats */}
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={isLoading.classes || classes.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100"
            >
              {isLoading.classes ? (
                <option>Memuat...</option>
              ) : classes.length === 0 ? (
                <option>Tidak ada kelas</option>
              ) : (
                classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              )}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cari Siswa</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nama atau NIS..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Class Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-600 font-medium">Total Siswa</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{students.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-600 font-medium">Rata² Kehadiran</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.avgAttendance.toFixed(1)}%</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ChartBarIcon className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-600 font-medium">Rata² Nilai</p>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{stats.avgGrade.toFixed(1)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
                <p className="text-sm text-purple-600 font-medium">Nilai ≥ 85</p>
              </div>
              <p className="text-2xl font-bold text-purple-700">{stats.excellentStudents}</p>
            </div>
          </div>
        )}
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Daftar Siswa ({filteredStudents.length})
          </h2>
        </div>

        {isLoading.students ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="mt-2 text-gray-500">Memuat daftar siswa...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p>{searchQuery ? 'Siswa tidak ditemukan' : 'Tidak ada siswa di kelas ini'}</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kehadiran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rata² Nilai</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt={student.name}
                              className="h-10 w-10 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center mr-3">
                              <span className="text-brand-600 font-semibold">{student.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.identityNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          (student.attendance_rate || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {student.attendance_rate?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          (student.average_grade || 0) >= 75 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {student.average_grade?.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetails(student)}
                          className="text-brand-600 hover:text-brand-900 font-medium"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden p-4 space-y-3">
              {filteredStudents.map((student, index) => (
                <div key={student.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {student.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-600 font-semibold text-lg">{student.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">#{index + 1}</p>
                      <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{student.email}</p>
                      {student.identityNumber && (
                        <p className="text-xs text-gray-500">NIS: {student.identityNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-xs text-gray-600 mb-1">Kehadiran</p>
                      <p className={`text-lg font-bold ${
                        (student.attendance_rate || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {student.attendance_rate?.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-xs text-gray-600 mb-1">Rata² Nilai</p>
                      <p className={`text-lg font-bold ${
                        (student.average_grade || 0) >= 75 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {student.average_grade?.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDetails(student)}
                    className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Lihat Detail
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">Detail Siswa</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-start gap-4">
                {selectedStudent.avatarUrl ? (
                  <img
                    src={selectedStudent.avatarUrl}
                    alt={selectedStudent.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-brand-600 font-bold text-2xl">{selectedStudent.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                  {selectedStudent.identityNumber && (
                    <p className="text-sm text-gray-500 mt-1">NIS: {selectedStudent.identityNumber}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium mb-2">Tingkat Kehadiran</p>
                  <p className="text-3xl font-bold text-green-700">{selectedStudent.attendance_rate?.toFixed(1)}%</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-2">Rata-rata Nilai</p>
                  <p className="text-3xl font-bold text-blue-700">{selectedStudent.average_grade?.toFixed(1)}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Informasi Tambahan</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium text-gray-800">{selectedStudent.role}</span>
                  </div>
                  {selectedStudent.phoneNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">No. Telepon:</span>
                      <span className="font-medium text-gray-800">{selectedStudent.phoneNumber}</span>
                    </div>
                  )}
                  {selectedStudent.address && (
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600">Alamat:</span>
                      <span className="font-medium text-gray-800">{selectedStudent.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClassPage;
