import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import { User, School, Class, Subject, Grade } from '../../types';
import { dataService } from '../../services/dataService';
import { DownloadIcon } from '../icons/DownloadIcon';
import { PencilIcon } from '../icons/PencilIcon';

interface AdminGradesPageProps {
  user: User;
}

const AdminGradesPage: React.FC<AdminGradesPageProps> = ({ user }) => {
    const [schools, setSchools] = useState<School[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [editableGrades, setEditableGrades] = useState<Grade[]>([]);

    const [filters, setFilters] = useState({ schoolId: '', classId: '', subjectId: '' });
    const [isLoading, setIsLoading] = useState({ init: true, data: false });
    const [isEditMode, setIsEditMode] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const schoolsData = await dataService.getSchools();
                setSchools(schoolsData);
                if (schoolsData.length > 0) {
                    setFilters(prev => ({ ...prev, schoolId: schoolsData[0].id }));
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(prev => ({ ...prev, init: false }));
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const updateFilters = async () => {
            if (!filters.schoolId) {
                setClasses([]);
                setSubjects([]);
                setFilters(prev => ({ ...prev, classId: '', subjectId: '' }));
                return;
            }
            try {
                const [allClasses, allSubjects] = await Promise.all([
                    dataService.getClasses(),
                    dataService.getSubjects()
                ]);
                const filteredClasses = allClasses.filter(c => c.schoolId === filters.schoolId);
                const filteredSubjects = allSubjects.filter(s => s.schoolId === filters.schoolId);
                setClasses(filteredClasses);
                setSubjects(filteredSubjects);
                setFilters(prev => ({ ...prev, classId: '', subjectId: '' }));
            } catch (error) {
                console.error("Failed to update filters", error);
            }
        };
        updateFilters();
    }, [filters.schoolId]);
    
    const fetchGrades = useCallback(async () => {
        if (!filters.classId || !filters.subjectId) {
            setGrades([]);
            return;
        }
        setIsLoading(prev => ({ ...prev, data: true }));
        try {
            const data = await dataService.getGradesForAdmin(filters);
            setGrades(data);
            setEditableGrades(JSON.parse(JSON.stringify(data)));
        } catch (error) {
            console.error("Failed to fetch grades", error);
        } finally {
            setIsLoading(prev => ({ ...prev, data: false }));
        }
    }, [filters]);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEditToggle = () => {
        if (isEditMode) {
            setEditableGrades(JSON.parse(JSON.stringify(grades)));
        }
        setIsEditMode(!isEditMode);
        setSaveStatus('idle');
    };

    const handleScoreChange = (index: number, score: string) => {
        const newScore = parseInt(score, 10);
        if (isNaN(newScore) || newScore < 0 || newScore > 100) return;
        const updatedGrades = [...editableGrades];
        updatedGrades[index].score = newScore;
        setEditableGrades(updatedGrades);
        setSaveStatus('idle');
    };
    
    const handleSaveChanges = async () => {
        setSaveStatus('saving');
        try {
            await dataService.saveGradesForStudents(editableGrades);
            setSaveStatus('success');
            setIsEditMode(false);
            fetchGrades();
        } catch (error) {
            console.error("Failed to save grades", error);
            setSaveStatus('error');
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pantau Nilai Keseluruhan</h2>
            <Card>
                <div className="p-4 border-b grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <select name="schoolId" value={filters.schoolId} onChange={handleFilterChange} className="w-full p-2 border rounded-md">
                        <option value="">Pilih Sekolah</option>
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select name="classId" value={filters.classId} onChange={handleFilterChange} className="w-full p-2 border rounded-md" disabled={!filters.schoolId}>
                        <option value="">Pilih Kelas</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select name="subjectId" value={filters.subjectId} onChange={handleFilterChange} className="w-full p-2 border rounded-md" disabled={!filters.schoolId}>
                        <option value="">Pilih Mapel</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button onClick={handleEditToggle} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                            <PencilIcon className="h-5 w-5 mr-2" />
                            {isEditMode ? 'Batal' : 'Edit Data'}
                        </button>
                        <button 
                            onClick={() => { 
                                const params = new URLSearchParams();
                                if (filters.schoolId) params.append('schoolId', filters.schoolId);
                                if (filters.classId) params.append('classId', filters.classId);
                                if (filters.subjectId) params.append('subjectId', filters.subjectId);
                                window.location.href = `/api/export-grades?${params.toString()}`; 
                            }}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700"
                        >
                            <DownloadIcon className="h-5 w-5 mr-2" />
                            Ekspor CSV
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {isLoading.data ? <p className="p-4 text-center">Memuat data...</p> : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Siswa</th>
                                <th className="px-6 py-3">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editableGrades.map((grade, index) => (
                                <tr key={grade.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{grade.studentName}</td>
                                    <td className="px-6 py-4">
                                        {isEditMode ? (
                                            <input type="number" min="0" max="100" value={grade.score} onChange={(e) => handleScoreChange(index, e.target.value)} className="w-20 p-1 border rounded-md"/>
                                        ) : (
                                            <span className="font-semibold">{grade.score}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                    {grades.length === 0 && !isLoading.data && <p className="p-4 text-center text-gray-500">Pilih kelas dan mata pelajaran untuk melihat nilai.</p>}
                </div>
                 {isEditMode && (
                    <div className="p-4 border-t flex justify-end items-center gap-4">
                        {saveStatus === 'success' && <p className="text-sm text-green-600">Berhasil disimpan!</p>}
                        {saveStatus === 'error' && <p className="text-sm text-red-600">Gagal menyimpan.</p>}
                        <button onClick={handleSaveChanges} disabled={saveStatus === 'saving'} className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400">
                            {saveStatus === 'saving' ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AdminGradesPage;