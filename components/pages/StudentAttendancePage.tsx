import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, UserRole } from '../../types';

type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';

interface StudentAttendancePageProps {
  user: User;
}

const StudentAttendancePage: React.FC<StudentAttendancePageProps> = ({ user }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

    useEffect(() => {
        const fetchStudents = async () => {
            if (!user.schoolId) return;
            try {
                // A more specific filter by class would be needed in a full implementation
                const classStudents = await dataService.getUsers({ role: UserRole.STUDENT, schoolId: user.schoolId });
                setStudents(classStudents);
                // Initialize all students as 'Hadir'
                const initialAttendance = classStudents.reduce((acc, student) => ({ ...acc, [student.id]: 'Hadir' }), {});
                setAttendance(initialAttendance);
            } catch (error) {
                console.error("Failed to fetch students:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudents();
    }, [user.schoolId]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Absensi Siswa - MA Kelas 10-A</h2>
            <Card>
                <div className="p-4 border-b">
                    <p>Tanggal: <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                </div>
                <div className="overflow-x-auto">
                     {isLoading ? <p className="p-4">Memuat siswa...</p> :
                     <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nama Siswa</th>
                                <th className="px-6 py-3 text-center">Status Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center space-x-2">
                                            {(['Hadir', 'Sakit', 'Izin', 'Alpha'] as AttendanceStatus[]).map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(student.id, status)}
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                                        attendance[student.id] === status
                                                        ? 'bg-brand-600 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                    }
                </div>
                <div className="p-4 border-t text-right">
                    <button className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                        Simpan Absensi
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default StudentAttendancePage;