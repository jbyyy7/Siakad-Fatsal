import React, { useState, useEffect } from 'react';
import { User, Class, School } from '../../types';
import { dataService } from '../../services/dataService';
import Card from '../Card';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { PencilSquareIcon } from '../icons/PencilSquareIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { XMarkIcon } from '../icons/XMarkIcon';

interface ManageHomeroomTeachersPageProps {
  currentUser: User;
}

const ManageHomeroomTeachersPage: React.FC<ManageHomeroomTeachersPageProps> = ({ currentUser }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchData();
    }
  }, [selectedSchool]);

  const fetchSchools = async () => {
    try {
      const schoolsData = await dataService.getSchools();
      setSchools(schoolsData);
      
      // Auto-select school for non-admin users
      if (currentUser.schoolId) {
        setSelectedSchool(currentUser.schoolId);
      } else if (schoolsData.length > 0) {
        setSelectedSchool(schoolsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      alert('Gagal memuat data sekolah');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [classesData, teachersData] = await Promise.all([
        dataService.getClasses({ schoolId: selectedSchool }),
        dataService.getUsers({ role: 'Guru' as any, schoolId: selectedSchool })
      ]);
      
      setClasses(classesData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (classData: Class) => {
    setEditingClassId(classData.id);
    setSelectedTeacherId(classData.homeroomTeacherId || '');
  };

  const handleCancel = () => {
    setEditingClassId(null);
    setSelectedTeacherId('');
  };

  const handleSave = async (classId: string) => {
    try {
      setIsLoading(true);
      
      // Find the class
      const classData = classes.find(c => c.id === classId);
      if (!classData) {
        throw new Error('Kelas tidak ditemukan');
      }

      // Update class with new homeroom teacher
      await dataService.updateClass(classId, {
        name: classData.name,
        schoolId: classData.schoolId,
        homeroomTeacherId: selectedTeacherId || null,
        academicYear: classData.academicYear,
        studentIds: classData.studentIds || []
      });

      alert('Wali kelas berhasil diperbarui!');
      setEditingClassId(null);
      setSelectedTeacherId('');
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating homeroom teacher:', error);
      alert(error.message || 'Gagal memperbarui wali kelas');
    } finally {
      setIsLoading(false);
    }
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return '-';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || '-';
  };

  const getStudentCount = (studentIds?: string[]) => {
    return studentIds?.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <AcademicCapIcon className="h-8 w-8 mr-3 text-blue-600" />
          Kelola Wali Kelas
        </h1>
        <p className="text-gray-600 mt-2">
          Assign dan kelola wali kelas untuk setiap kelas
        </p>
      </div>

      {/* School Filter */}
      {currentUser.role === 'Kepala Yayasan' && (
        <Card className="p-4">
          <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
            Filter Sekolah
          </label>
          <select
            id="school"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Sekolah</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Kelas</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{classes.length}</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-blue-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Dengan Wali Kelas</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {classes.filter(c => c.homeroomTeacherId).length}
              </p>
            </div>
            <CheckIcon className="h-12 w-12 text-green-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Belum Ada Wali Kelas</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">
                {classes.filter(c => !c.homeroomTeacherId).length}
              </p>
            </div>
            <XMarkIcon className="h-12 w-12 text-amber-400" />
          </div>
        </Card>
      </div>

      {/* Classes List */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600">
          <h2 className="text-xl font-bold text-white flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2" />
            Daftar Kelas & Wali Kelas
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UserGroupIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p>Tidak ada data kelas</p>
            <p className="text-sm mt-2">Silakan pilih sekolah atau tambah kelas terlebih dahulu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Kelas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tahun Ajaran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Siswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wali Kelas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map((classData) => (
                  <tr key={classData.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {classData.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{classData.name}</div>
                          <div className="text-xs text-gray-500">{classData.schoolName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {classData.academicYear}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{getStudentCount(classData.studentIds)} siswa</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingClassId === classData.id ? (
                        <select
                          value={selectedTeacherId}
                          onChange={(e) => setSelectedTeacherId(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        >
                          <option value="">-- Tidak Ada --</option>
                          {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {classData.homeroomTeacherId ? (
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                <AcademicCapIcon className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="font-medium">{classData.homeroomTeacherName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Belum ada wali kelas</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingClassId === classData.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(classData.id)}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Simpan
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-100"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(classData)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4 mr-1" />
                          Ubah
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Informasi</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Wali kelas harus guru yang terdaftar di sekolah yang sama dengan kelas</li>
          <li>• Satu guru bisa menjadi wali kelas lebih dari satu kelas</li>
          <li>• Klik tombol "Ubah" untuk mengganti atau menambah wali kelas</li>
          <li>• Pilih "-- Tidak Ada --" untuk menghapus wali kelas dari suatu kelas</li>
        </ul>
      </Card>
    </div>
  );
};

export default ManageHomeroomTeachersPage;
