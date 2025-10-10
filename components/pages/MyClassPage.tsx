import React from 'react';
import Card from '../Card';
import { MOCK_USERS } from '../../constants';
import { User, UserRole } from '../../types';

interface MyClassPageProps {
    user: User;
}

const MyClassPage: React.FC<MyClassPageProps> = ({ user }) => {
    const students = MOCK_USERS.filter(u => u.role === UserRole.STUDENT && u.schoolId === user.schoolId);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kelas Saya: MA Kelas 10-A</h2>
            <Card>
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Daftar Siswa</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img src={student.avatarUrl} alt={student.name} className="h-8 w-8 rounded-full mr-3"/>
                                            {student.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{student.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default MyClassPage;
