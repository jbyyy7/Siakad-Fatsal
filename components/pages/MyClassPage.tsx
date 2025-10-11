
import React, { useState, useEffect } from 'react';
import { User, Class } from '../../types';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';

interface MyClassPageProps {
  user: User;
}

const MyClassPage: React.FC<MyClassPageProps> = ({ user }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState({ classes: true, students: false });
  const [selectedClassId, setSelectedClassId] = useState<string>('');

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
        setStudents(studentsData);
      } catch (error) {
        console.error(`Failed to fetch students for class ${selectedClassId}:`, error);
      } finally {
        setIsLoading(prev => ({...prev, students: false}));
      }
    };
    fetchStudents();
  }, [selectedClassId]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Kelas Saya</h2>
      <Card>
        <div className="p-4 border-b">
          <label htmlFor="class-selector" className="text-sm font-medium mr-2">Pilih Kelas:</label>
          <select
            id="class-selector"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={isLoading.classes}
            className="p-2 border border-gray-300 rounded-md"
          >
            {isLoading.classes ? <option>Memuat...</option> :
              classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
            }
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading.students ? (
            <p className="p-4 text-center">Memuat daftar siswa...</p>
          ) : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nama Siswa</th>
                  <th className="px-6 py-3">Nomor Induk Siswa (NIS)</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={student.avatarUrl} alt={student.name} className="h-8 w-8 rounded-full mr-3 object-cover" />
                        {student.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">{student.identityNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MyClassPage;
