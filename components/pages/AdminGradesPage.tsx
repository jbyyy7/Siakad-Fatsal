
import React, { useState } from 'react';
import Card from '../Card';
import { User, School, Class } from '../../types';
// import { dataService } from '../../services/dataService';


interface AdminGradesPageProps {
    user: User;
}

const AdminGradesPage: React.FC<AdminGradesPageProps> = ({ user }) => {
    // MOCK DATA
    const mockGradesData = [
        { id: 1, studentName: 'Ahmad Dahlan', className: 'MA Kelas 10-A', subject: 'Matematika', score: 85, grade: 'A-' },
        { id: 2, studentName: 'Siti Aminah', className: 'MA Kelas 10-A', subject: 'Matematika', score: 92, grade: 'A' },
        { id: 3, studentName: 'Zainal Arifin', className: 'MTs Kelas 8-B', subject: 'IPA', score: 75, grade: 'B' },
        { id: 4, studentName: 'Dewi Lestari', className: 'MI Kelas 5', subject: 'Bahasa Indonesia', score: 88, grade: 'A-' },
        { id: 5, studentName: 'Fajar Nugroho', className: 'MA Kelas 11-A', subject: 'Fisika', score: 68, grade: 'C+' },
    ];
    
    // In a real app, you would fetch these from dataService
    const [schools, setSchools] = useState<School[]>([{id: 'ma_fs', name: 'MA Fathus Salafi', level: 'MA', address: '...'}]);
    const [classes, setClasses] = useState<Class[]>([{id: '10a', name: 'MA Kelas 10-A', schoolId: 'ma_fs'}]);

    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [grades, setGrades] = useState(mockGradesData);
    const [isLoading, setIsLoading] = useState(false);

    // useEffect for fetching data would go here

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pantau Nilai Seluruh Sekolah</h2>
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                        value={selectedSchool}
                        onChange={(e) => setSelectedSchool(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Semua Sekolah</option>
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        disabled={!selectedSchool}
                    >
                        <option value="">Semua Kelas</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </Card>
            <Card>
                <div className="overflow-x-auto">
                    {isLoading ? <p>Memuat...</p> : (
                        <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                            <th className="px-6 py-3">Siswa</th>
                            <th className="px-6 py-3">Kelas</th>
                            <th className="px-6 py-3">Mapel</th>
                            <th className="px-6 py-3 text-center">Skor</th>
                            <th className="px-6 py-3 text-center">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grades.map(record => (
                            <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{record.studentName}</td>
                                <td className="px-6 py-4">{record.className}</td>
                                <td className="px-6 py-4">{record.subject}</td>
                                <td className="px-6 py-4 text-center">{record.score}</td>
                                <td className="px-6 py-4 text-center font-bold">{record.grade}</td>
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

export default AdminGradesPage;
