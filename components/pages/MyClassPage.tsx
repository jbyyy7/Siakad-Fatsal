import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, UserRole } from '../../types';

interface MyClassPageProps {
    user: User;
}

const MyClassPage: React.FC<MyClassPageProps> = ({ user }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!user.schoolId) return;
            try {
                // This is a simplification. A real app would have a class concept
                // and fetch students for that specific class.
                const allStudents = await dataService.getUsers({ role: UserRole.STUDENT, schoolId: user.schoolId });
                // TODO: Re-enable class filtering once the correct 'level' column in the DB is identified.
                const classStudents = allStudents; // Temporarily show all students
                setStudents(classStudents);
            } catch (error) {
                console.error("Failed to fetch students for class:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [user.schoolId]);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Siswa di {user.schoolName}</h2>
             <p className="mb-4 text-sm text-yellow-700 bg-yellow-100 p-2 rounded-md">
                <b>Catatan:</b> Fitur penyaringan per kelas dinonaktifkan sementara. Daftar ini menampilkan semua siswa di sekolah Anda.
            </p>
            <Card>
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Daftar Siswa</h3>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <p className="p-4">Memuat daftar siswa...</p> :
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama</th>
                                <th scope="col" className="px-6 py-3">NIS</th>
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
                                    <td className="px-6 py-4">{student.identityNumber}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    }
                </div>
            </Card>
        </div>
    );
};

export default MyClassPage;