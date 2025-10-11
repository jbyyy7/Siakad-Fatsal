import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, UserRole } from '../../types';

interface InputGradesPageProps {
  user: User;
}

// In a real app, this would also be fetched from the database
const subjects = ['Matematika', 'Bahasa Indonesia', 'Fisika', 'Kimia', 'Biologi', 'Sejarah'];

const InputGradesPage: React.FC<InputGradesPageProps> = ({ user }) => {
    const [selectedClass, setSelectedClass] = useState('MA Kelas 10-A');
    const [studentsInClass, setStudentsInClass] = useState<User[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [grades, setGrades] = useState<Record<string, number | ''>>({});

    useEffect(() => {
        const fetchStudents = async () => {
            if (!user.schoolId) return;
            setIsLoadingStudents(true);
            try {
                // In a real app, you might need a more robust way to filter by class
                const allStudents = await dataService.getUsers({ role: UserRole.STUDENT, schoolId: user.schoolId });
                // TODO: Re-enable class filtering once the correct 'level' column in the DB is identified.
                // The current query does not load this data, so filtering is disabled to prevent an empty list.
                const filteredStudents = allStudents;
                setStudentsInClass(filteredStudents);
            } catch (error) {
                console.error("Failed to fetch students for class:", error);
            } finally {
                setIsLoadingStudents(false);
            }
        };

        fetchStudents();
    }, [selectedClass, user.schoolId]);

    const handleStudentSelect = (studentId: string) => {
        setSelectedStudentId(studentId);
        const initialGrades = subjects.reduce((acc, subject) => ({...acc, [subject]: ''}), {});
        setGrades(initialGrades);
    };

    const handleGradeChange = (subject: string, value: string) => {
        const score = value === '' ? '' : parseInt(value, 10);
        if (score === '' || (score >= 0 && score <= 100)) {
            setGrades(prev => ({ ...prev, [subject]: score }));
        }
    };
    
    const handleSave = () => {
        // Here you would call a dataService function to save the grades
        // await dataService.saveGrades(selectedStudentId, grades);
        alert(`Nilai untuk siswa ID ${selectedStudentId} telah disimpan (simulasi).`);
        console.log({ studentId: selectedStudentId, grades });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Input Nilai Ujian</h2>
            
            <Card className="mb-6">
                <div className="flex items-center space-x-4">
                    <label htmlFor="class-select" className="font-semibold">Pilih Kelas:</label>
                    <select
                        id="class-select"
                        value={selectedClass}
                        onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setSelectedStudentId(null); // Reset student selection
                        }}
                        className="p-2 border border-gray-300 rounded-md"
                    >
                        <option>MA Kelas 10-A</option>
                        <option>MA Kelas 10-B</option>
                    </select>
                </div>
                 <p className="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded-md">
                    <b>Catatan:</b> Daftar siswa menampilkan semua siswa di sekolah ini. Fitur penyaringan per kelas akan diaktifkan kembali setelah nama kolom kelas di database dikonfirmasi.
                </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <h3 className="font-semibold mb-4">Daftar Siswa - {selectedClass}</h3>
                    {isLoadingStudents ? <p>Memuat siswa...</p> : (
                        <ul className="space-y-2 max-h-96 overflow-y-auto">
                            {studentsInClass.map(student => (
                                <li key={student.id}>
                                    <button
                                        onClick={() => handleStudentSelect(student.id)}
                                        className={`w-full text-left p-2 rounded-md ${selectedStudentId === student.id ? 'bg-brand-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        {student.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <div className="md:col-span-2">
                    {selectedStudentId ? (
                        <Card>
                            <h3 className="font-semibold mb-4">
                                Input Nilai untuk: {studentsInClass.find(s => s.id === selectedStudentId)?.name}
                            </h3>
                            <div className="space-y-4">
                                {subjects.map(subject => (
                                    <div key={subject} className="grid grid-cols-3 items-center">
                                        <label htmlFor={`grade-${subject}`} className="col-span-1">{subject}</label>
                                        <input
                                            type="number"
                                            id={`grade-${subject}`}
                                            min="0"
                                            max="100"
                                            value={grades[subject] ?? ''}
                                            onChange={(e) => handleGradeChange(subject, e.target.value)}
                                            className="col-span-2 w-full max-w-xs p-2 border border-gray-300 rounded-md"
                                            placeholder="0-100"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 text-right">
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700"
                                >
                                    Simpan Nilai
                                </button>
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <div className="text-center py-10">
                                <p className="text-gray-500">Pilih siswa dari daftar untuk mulai menginput nilai.</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InputGradesPage;