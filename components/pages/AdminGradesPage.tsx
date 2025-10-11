
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { School, Class, Subject, User } from '../../types';

const AdminGradesPage: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<(User & {grade?: number})[]>([]);

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState({
        page: true,
        classes: false,
        subjects: false,
        students: false,
    });
    const [error, setError] = useState<string | null>(null);

    // Fetch initial schools
    useEffect(() => {
        const fetchSchools = async () => {
            setIsLoading(prev => ({ ...prev, page: true }));
            try {
                const schoolsData = await dataService.getSchools();
                setSchools(schoolsData);
                if (schoolsData.length > 0) {
                    setSelectedSchoolId(schoolsData[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch schools", err);
                setError("Gagal memuat data sekolah.");
            } finally {
                setIsLoading(prev => ({ ...prev, page: false }));
            }
        };
        fetchSchools();
    }, []);

    // Fetch classes and subjects when school changes
    useEffect(() => {
        if (!selectedSchoolId) return;
        const fetchSchoolData = async () => {
            setIsLoading(prev => ({ ...prev, classes: true, subjects: true }));
            try {
                const [classesData, subjectsData] = await Promise.all([
                    dataService.getClasses({ schoolId: selectedSchoolId }),
                    dataService.getSubjects({ schoolId: selectedSchoolId }),
                ]);
                setClasses(classesData);
                setSubjects(subjectsData);
                if (classesData.length > 0) setSelectedClassId(classesData[0].id);
                if (subjectsData.length > 0) setSelectedSubjectId(subjectsData[0].id);
            } catch (err) {
                console.error("Failed to fetch school data", err);
            } finally {
                setIsLoading(prev => ({ ...prev, classes: false, subjects: false }));
            }
        };
        fetchSchoolData();
    }, [selectedSchoolId]);
    
    // Fetch students and their grades
    useEffect(() => {
        if (!selectedClassId || !selectedSubjectId) {
            setStudents([]);
            return;
        }
        const fetchStudentGrades = async () => {
             setIsLoading(prev => ({ ...prev, students: true }));
             try {
                // In a real app, you'd fetch grades for a specific class/subject
                const studentsInClass = await dataService.getStudentsInClass(selectedClassId);
                // Mock grades
                const studentsWithGrades = studentsInClass.map(s => ({
                    ...s,
                    grade: Math.floor(Math.random() * 31) + 70 // random grade 70-100
                }));
                setStudents(studentsWithGrades);
             } catch(err) {
                 console.error("Failed to fetch student grades", err);
                 setError("Gagal memuat nilai siswa.");
             } finally {
                 setIsLoading(prev => ({ ...prev, students: false }));
             }
        };
        fetchStudentGrades();
    }, [selectedClassId, selectedSubjectId]);


    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pantau Nilai Siswa</h2>
             <Card>
                <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sekolah</label>
                        <select value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} disabled={isLoading.page} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Kelas</label>
                        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} disabled={isLoading.classes} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                         <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={isLoading.subjects} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    {isLoading.students ? <p className="p-4 text-center">Memuat nilai...</p> : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nama Siswa</th>
                                <th className="px-6 py-3 text-center">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                                    <td className="px-6 py-4 text-center font-semibold">
                                        {student.grade || 'N/A'}
                                    </td>
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
