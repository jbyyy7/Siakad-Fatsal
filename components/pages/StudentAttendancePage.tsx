import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, Class, Subject, AttendanceStatus, AttendanceRecord } from '../../types';

interface StudentAttendancePageProps {
  user: User;
}

const StudentAttendancePage: React.FC<StudentAttendancePageProps> = ({ user }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState({ page: true, students: false });
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    // Fetch initial data (classes and subjects for the teacher)
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading({ page: true, students: false });
            try {
                const teacherClasses = await dataService.getClasses({ teacherId: user.id });
                setClasses(teacherClasses);
                if (teacherClasses.length > 0) {
                    const firstClass = teacherClasses[0];
                    setSelectedClassId(firstClass.id);
                    // Fetch subjects for the first class
                    const schoolSubjects = await dataService.getSubjects({ schoolId: firstClass.schoolId });
                    setSubjects(schoolSubjects);
                    if (schoolSubjects.length > 0) {
                        setSelectedSubjectId(schoolSubjects[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch initial data for attendance:", error);
                setSaveStatus('error');
            } finally {
                setIsLoading({ page: false, students: false });
            }
        };
        fetchInitialData();
    }, [user.id]);

    // Fetch students and existing attendance when selections change
    const fetchStudentAndAttendanceData = useCallback(async () => {
        if (!selectedClassId || !selectedSubjectId || !selectedDate) {
            setStudents([]);
            return;
        };

        setIsLoading({ page: false, students: true });
        setSaveStatus('idle');
        try {
            const [classStudents, existingAttendance] = await Promise.all([
                dataService.getStudentsInClass(selectedClassId),
                dataService.getAttendanceForDate(selectedClassId, selectedSubjectId, selectedDate)
            ]);
            
            setStudents(classStudents);

            const attendanceMap = new Map(existingAttendance.map(rec => [rec.student_id, rec.status]));
            const initialAttendance = classStudents.reduce((acc, student) => {
                acc[student.id] = attendanceMap.get(student.id) || 'Hadir';
                return acc;
            }, {} as Record<string, AttendanceStatus>);
            setAttendance(initialAttendance);

        } catch (error) {
            console.error("Failed to fetch students or attendance:", error);
            setSaveStatus('error');
        } finally {
            setIsLoading({ page: false, students: false });
        }
    }, [selectedClassId, selectedSubjectId, selectedDate]);
    
    useEffect(() => {
        fetchStudentAndAttendanceData();
    }, [fetchStudentAndAttendanceData]);


    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
        setSaveStatus('idle');
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        const recordsToSave: AttendanceRecord[] = students.map(student => ({
            date: selectedDate,
            student_id: student.id,
            class_id: selectedClassId,
            subject_id: selectedSubjectId,
            teacher_id: user.id,
            status: attendance[student.id]
        }));

        try {
            await dataService.saveAttendance(recordsToSave);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Failed to save attendance:", error);
            setSaveStatus('error');
        }
    };
    
    const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || '';

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Absensi Siswa</h2>
            <Card>
                <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                        <input type="date" value={selectedDate} readOnly disabled className="mt-1 block w-full p-2 border-gray-300 rounded-md bg-gray-100" />
                    </div>
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
                            disabled={isLoading.page || subjects.length === 0}
                            className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"
                        >
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                     {isLoading.students ? <p className="p-4 text-center">Memuat siswa...</p> :
                     students.length > 0 ? (
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
                     ) : <p className="p-4 text-center text-gray-500">Tidak ada siswa di kelas ini atau pilihan tidak valid.</p>
                    }
                </div>
                <div className="p-4 border-t flex justify-end items-center gap-4">
                    {saveStatus === 'success' && <p className="text-sm text-green-600">Absensi berhasil disimpan!</p>}
                    {saveStatus === 'error' && <p className="text-sm text-red-600">Gagal menyimpan absensi.</p>}
                    <button 
                        onClick={handleSave}
                        disabled={saveStatus === 'saving' || students.length === 0}
                        className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:bg-brand-400"
                    >
                        {saveStatus === 'saving' ? 'Menyimpan...' : 'Simpan Absensi'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default StudentAttendancePage;