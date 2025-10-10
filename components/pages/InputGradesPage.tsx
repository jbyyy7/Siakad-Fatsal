import React, { useState } from 'react';
import Card from '../Card';
import { MOCK_USERS } from '../../constants';
import { User, UserRole } from '../../types';

interface InputGradesPageProps {
  user: User;
}

const subjects = ['Matematika', 'Bahasa Indonesia', 'Fisika', 'Kimia', 'Biologi', 'Sejarah'];

const InputGradesPage: React.FC<InputGradesPageProps> = ({ user }) => {
    const [selectedClass, setSelectedClass] = useState('MA Kelas 10-A');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const studentsInClass = MOCK_USERS.filter(u => u.role === UserRole.STUDENT && u.schoolId === user.schoolId && u.level === selectedClass);
    
    // Initialize grades state
    const [grades, setGrades] = useState<Record<string, number | ''>>({});

    const handleStudentSelect = (studentId: string) => {
        setSelectedStudentId(studentId);
        // Pre-fill grades for the selected student if they exist (mocked)
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
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <h3 className="font-semibold mb-4">Daftar Siswa - {selectedClass}</h3>
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
