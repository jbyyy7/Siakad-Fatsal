import React, { useState, useMemo, useEffect } from 'react';
import Card from '../Card';
import { User, UserRole } from '../../types';
import { dataService } from '../../services/dataService';

interface StudentDataPageProps {
  user: User;
}

const StudentDataPage: React.FC<StudentDataPageProps> = ({ user }) => {
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user.schoolId) return;
    const fetchStudents = async () => {
      try {
        const studentsData = await dataService.getUsers({ role: UserRole.STUDENT, schoolId: user.schoolId });
        setAllStudents(studentsData);
      } catch (error) {
        console.error("Failed to fetch student data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [user.schoolId]);

  const filteredStudents = useMemo(() => allStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allStudents, searchTerm]);
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Siswa - {user.schoolName}</h2>
       <Card>
        <div className="p-4 border-b">
            <input 
                type="text"
                placeholder="Cari nama siswa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <p className="p-4">Memuat data siswa...</p> : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">NIS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          <div className="flex items-center">
                              <img src={student.avatarUrl} alt={student.name} className="h-8 w-8 rounded-full mr-3"/>
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

export default StudentDataPage;