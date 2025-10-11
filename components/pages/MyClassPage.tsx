import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';

interface MyClassPageProps {
  user: User;
}

const MyClassPage: React.FC<MyClassPageProps> = ({ user }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('MA Kelas 10-A');

  // In a real app, this would be fetched based on the teacher's assigned classes
  const teacherClasses = ['MA Kelas 10-A', 'MA Kelas 10-B', 'MA Kelas 11-A'];

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user.schoolId) return;
      setIsLoading(true);
      try {
        // This is a simplification. In reality, you'd filter by selectedClass.
        const allStudents = await dataService.getUsers({ role: UserRole.STUDENT, schoolId: user.schoolId });
        setStudents(allStudents.filter(s => s.level === selectedClass));
      } catch (error) {
        console.error(`Failed to fetch students for class ${selectedClass}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [user.schoolId, selectedClass]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Kelas Saya</h2>
      <Card>
        <div className="p-4 border-b">
          <label htmlFor="class-selector" className="sr-only">Pilih Kelas</label>
          <select
            id="class-selector"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            {teacherClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
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
