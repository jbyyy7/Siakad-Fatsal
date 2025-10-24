import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { User, Class, Subject } from '../../types';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { CheckIcon } from '../icons/CheckIcon';

interface InputGradesPageProps {
  user: User;
}

type GradeType = 'tugas' | 'ulangan_harian' | 'uts' | 'uas' | 'praktek';

const gradeTypeLabels: Record<GradeType, string> = {
  tugas: 'Tugas',
  ulangan_harian: 'Ulangan Harian',
  uts: 'UTS',
  uas: 'UAS',
  praktek: 'Praktikum'
};

const InputGradesPage: React.FC<InputGradesPageProps> = ({ user }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedGradeType, setSelectedGradeType] = useState<GradeType>('ulangan_harian');
    
    const [grades, setGrades] = useState<Record<string, { score: string, notes: string }>>({});
    
    const [isLoading, setIsLoading] = useState({ page: true, students: false });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

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
                setErrorMessage('Gagal memuat data kelas dan mata pelajaran');
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
                setErrorMessage('Gagal memuat data siswa');
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
        setErrorMessage('');
    };

    const handleNotesChange = (studentId: string, value: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], notes: value },
        }));
    };

    const handleBulkFill = (score: string) => {
        const confirmed = window.confirm(`Isi semua siswa dengan nilai ${score}?`);
        if (!confirmed) return;

        const bulkGrades: Record<string, { score: string; notes: string }> = {};
        students.forEach(student => {
            bulkGrades[student.id] = { score, notes: grades[student.id]?.notes || '' };
        });
        setGrades(bulkGrades);
        setSaveStatus('idle');
    };
    
    const handleSaveGrades = async () => {
        if (!selectedClassId || !selectedSubjectId) {
            setErrorMessage('Pilih kelas dan mata pelajaran terlebih dahulu');
            setSaveStatus('error');
            return;
        }
        
        setSaveStatus('saving');
        setErrorMessage('');
        try {
            // Convert grades object to array of grade records
            const gradeRecords = Object.entries(grades)
                .filter(([, value]) => value.score && value.score.trim() !== '')
                .map(([studentId, value]) => ({
                    student_id: studentId,
                    subject_id: selectedSubjectId,
                    score: parseFloat(value.score),
                    notes: value.notes || '',
                    grade_type: selectedGradeType
                }));

            if (gradeRecords.length === 0) {
                setErrorMessage('Tidak ada nilai yang diinput');
                setSaveStatus('error');
                return;
            }

            // Validate scores
            const invalidScores = gradeRecords.filter(g => g.score < 0 || g.score > 100);
            if (invalidScores.length > 0) {
                setErrorMessage('Nilai harus antara 0-100');
                setSaveStatus('error');
                return;
            }

            // Save to database
            await dataService.saveGrades(gradeRecords);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error("Failed to save grades:", error);
            setErrorMessage('Gagal menyimpan nilai. Silakan coba lagi.');
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const getFilledCount = () => {
        return Object.values(grades).filter(g => g.score && g.score.trim() !== '').length;
    };

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Input Nilai Siswa</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Input dan kelola nilai siswa berdasarkan kelas dan mata pelajaran
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pilih Kelas & Mata Pelajaran</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
                        <select
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            disabled={isLoading.page || classes.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {classes.length === 0 ? (
                                <option>Tidak ada kelas</option>
                            ) : (
                                classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                        <select
                            value={selectedSubjectId}
                            onChange={e => setSelectedSubjectId(e.target.value)}
                            disabled={isLoading.page || subjects.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {subjects.length === 0 ? (
                                <option>Tidak ada mata pelajaran</option>
                            ) : (
                                subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Nilai</label>
                        <select
                            value={selectedGradeType}
                            onChange={e => setSelectedGradeType(e.target.value as GradeType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        >
                            {Object.entries(gradeTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bulk Actions */}
                {students.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Isi Otomatis (Bulk):</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleBulkFill('100')}
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                                Semua 100
                            </button>
                            <button
                                onClick={() => handleBulkFill('85')}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                                Semua 85
                            </button>
                            <button
                                onClick={() => handleBulkFill('75')}
                                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                            >
                                Semua 75
                            </button>
                            <button
                                onClick={() => setGrades({})}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                                Reset Semua
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Messages */}
            {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <p className="text-red-800">{errorMessage}</p>
                </div>
            )}

            {saveStatus === 'success' && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center gap-2">
                    <CheckIcon className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-medium">Nilai berhasil disimpan!</p>
                </div>
            )}

            {/* Students Table/Cards */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Daftar Siswa ({students.length})
                    </h2>
                    {students.length > 0 && (
                        <span className="text-sm text-gray-600">
                            Terisi: {getFilledCount()}/{students.length}
                        </span>
                    )}
                </div>

                {isLoading.students ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                        <p className="mt-2 text-gray-500">Memuat data siswa...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p>Tidak ada siswa di kelas ini</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Nilai (0-100)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={grades[student.id]?.score || ''}
                                                    onChange={e => handleGradeChange(student.id, e.target.value)}
                                                    placeholder="0-100"
                                                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={grades[student.id]?.notes || ''}
                                                    onChange={e => handleNotesChange(student.id, e.target.value)}
                                                    placeholder="Catatan (opsional)"
                                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden p-4 space-y-4">
                            {students.map((student, index) => (
                                <div key={student.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">#{index + 1}</span>
                                        {grades[student.id]?.score && (
                                            <CheckIcon className="h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                    <h3 className="font-medium text-gray-900">{student.name}</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Nilai</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={grades[student.id]?.score || ''}
                                                onChange={e => handleGradeChange(student.id, e.target.value)}
                                                placeholder="0-100"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                                            <input
                                                type="text"
                                                value={grades[student.id]?.notes || ''}
                                                onChange={e => handleNotesChange(student.id, e.target.value)}
                                                placeholder="Tulis catatan..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Save Button */}
                {students.length > 0 && (
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 lg:p-6">
                        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-center">
                            {saveStatus === 'success' && (
                                <p className="text-sm text-green-600 flex items-center gap-2">
                                    <CheckIcon className="h-4 w-4" />
                                    <span>Tersimpan!</span>
                                </p>
                            )}
                            <button
                                onClick={handleSaveGrades}
                                disabled={saveStatus === 'saving' || getFilledCount() === 0}
                                className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saveStatus === 'saving' ? 'Menyimpan...' : `Simpan Nilai (${getFilledCount()})`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InputGradesPage;
