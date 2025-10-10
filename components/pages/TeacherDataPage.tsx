import React, { useState, useMemo } from 'react';
import Card from '../Card';
import { User, UserRole } from '../../types';
import { MOCK_USERS } from '../../constants';

interface TeacherDataPageProps {
  user: User;
}

const TeacherDataPage: React.FC<TeacherDataPageProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const teachers = useMemo(() => MOCK_USERS.filter(u => 
      u.role === UserRole.TEACHER && 
      u.schoolId === user.schoolId &&
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [user.schoolId, searchTerm]);

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
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">NIP</th>
                <th className="px-6 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
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
        </div>
      </Card>
    </div>
  );
};

export default TeacherDataPage;