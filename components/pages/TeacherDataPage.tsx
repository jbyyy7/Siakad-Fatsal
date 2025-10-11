import React, { useState, useMemo, useEffect } from 'react';
import Card from '../Card';
import { User, UserRole } from '../../types';
import { dataService } from '../../services/dataService';

interface TeacherDataPageProps {
  user: User;
}

const TeacherDataPage: React.FC<TeacherDataPageProps> = ({ user }) => {
  const [allTeachers, setAllTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!user.schoolId) return;
    const fetchTeachers = async () => {
      try {
        const teachersData = await dataService.getUsers({ role: UserRole.TEACHER, schoolId: user.schoolId });
        setAllTeachers(teachersData);
      } catch (error) {
        console.error("Failed to fetch teacher data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, [user.schoolId]);

  const filteredTeachers = useMemo(() => allTeachers.filter(teacher => 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allTeachers, searchTerm]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Guru - {user.schoolName}</h2>
      
      <Card>
        <div className="p-4 border-b">
            <input 
                type="text"
                placeholder="Cari nama guru..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <p className="p-4">Memuat data guru...</p> : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">NIP</th>
                  <th className="px-6 py-3">Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map(teacher => (
                  <tr key={teacher.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          <div className="flex items-center">
                              <img src={teacher.avatarUrl} alt={teacher.name} className="h-8 w-8 rounded-full mr-3"/>
                              {teacher.name}
                          </div>
                      </td>
                    <td className="px-6 py-4">{teacher.identityNumber}</td>
                    <td className="px-6 py-4">{teacher.email}</td>
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

export default TeacherDataPage;