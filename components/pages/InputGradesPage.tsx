

import React, { useState, useEffect, useMemo } from 'react';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { User, Class, Subject } from '../../types';

interface InputGradesPageProps {
  user: User;
}

const InputGradesPage: React.FC<InputGradesPageProps> = ({ user }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    
    const [grades, setGrades] = useState<Record<string, { score: string, notes: string }>>({});
    
    const [isLoading, setIsLoading] = useState({ page: true, students: false });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user.id || !user.schoolId) return;
            setIsLoading({ page: true, students: false });
            try {
                const [teacherClasses, schoolSubjects] = await Promise.all([
                    dataService.getClasses({ teacherId: user.id }),
                    dataService.getSubjects({ schoolId: user.schoolId })
                ]);
                setClasses(teacherClasses);
                setSubjects(schoolSubjects);
                if (teacherClasses.length > 0) setSelectedClassId(teacherClasses[0].id);
                if (schoolSubjects.length > 0) setSelectedSubjectId(schoolSubjects[0].id);
            } catch (error) {
                console.error("Failed to load initial data", error);
            } finally {
                setIsLoading({ page: false, students: false });
            }
        };
        fetchInitialData();
    }, [user.id, user.schoolId]);

    useEffect(() => {
        if (!selectedClassId) {
            setStudents([]);
            return;
        }
        const fetchStudents = async () => {
            setIsLoading(prev => ({ ...prev, students: true }));
            try {
                const classStudents = await dataService.getStudentsInClass(selectedClassId);
                setStudents(classStudents);
                setGrades({}); // Reset grades when class changes
            } catch (error) {
                console.error("Failed to fetch students", error);
            } finally {
                setIsLoading(prev => ({ ...prev, students: false }));
            }
        };
        fetchStudents();
    }, [selectedClassId]);

    const handleGradeChange = (studentId: string, value: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], score: value },
        }));
        setSaveStatus('idle');
    };
    
    const handleSaveGrades = async () => {
        if (!selectedClassId || !selectedSubjectId) {
            setSaveStatus('error');
            return;
        }
        
        setSaveStatus('saving');
        try {
            // Convert grades object to array of grade records
            const gradeRecords = Object.entries(grades)
                .filter(([_, value]) => value.score && value.score.trim() !== '')
                .map(([studentId, value]) => ({
                    student_id: studentId,
                    subject_id: selectedSubjectId,
                    score: parseFloat(value.score),
                    notes: value.notes || '',
                }));

            if (gradeRecords.length === 0) {
                setSaveStatus('error');
                return;
            }

            // Save to database
            await dataService.saveGrades(gradeRecords);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Failed to save grades:", error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Input Nilai Siswa</h2>
            <Card>
                <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Kelas</label>
                        <select
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            disabled={isLoading.page}
                            className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                        <select
                            value={selectedSubjectId}
                            onChange={e => setSelectedSubjectId(e.target.value)}
                            disabled={isLoading.page}
                            className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"
                        >
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    {isLoading.students ? <p className="p-4 text-center">Memuat siswa...</p> : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nama Siswa</th>
                                <th className="px-6 py-3 w-32">Nilai (0-100)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={grades[student.id]?.score || ''}
                                            onChange={e => handleGradeChange(student.id, e.target.value)}
                                            className="w-24 p-2 border border-gray-300 rounded-md"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
                 <div className="p-4 border-t flex justify-end items-center gap-4">
                    {saveStatus === 'success' && <p className="text-sm text-green-600">Nilai berhasil disimpan!</p>}
                    <button
                        onClick={handleSaveGrades}
                        disabled={saveStatus === 'saving' || students.length === 0}
                        className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400"
                    >
                        {saveStatus === 'saving' ? 'Menyimpan...' : 'Simpan Nilai'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default InputGradesPage;
