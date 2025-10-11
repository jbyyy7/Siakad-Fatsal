import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, Class, Subject, AttendanceStatus, School } from '../../types';

const AdminAttendancePage: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
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
            setClasses([]);
            setSubjects([]);
            setSelectedClassId('');
            setSelectedSubjectId('');
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
                setError("Gagal memuat data kelas atau mata pelajaran.");
            } finally {
                setIsLoading(prev => ({ ...prev, classes: false, subjects: false }));
            }
        };
        fetchSchoolData();
    }, [selectedSchoolId]);
    
    // Fetch students and attendance
    const fetchAttendanceData = useCallback(async () => {
        if (!selectedClassId || !selectedSubjectId || !selectedDate) {
            setStudents([]);
            setAttendance({});
            return;
        }

        setIsLoading(prev => ({ ...prev, students: true }));
        setError(null);
        try {
            const [studentsData, attendanceData] = await Promise.all([
                dataService.getStudentsInClass(selectedClassId),
                dataService.getAttendanceForDate(selectedClassId, selectedSubjectId, selectedDate),
            ]);
            setStudents(studentsData);
            const attendanceMap = attendanceData.reduce((acc, record) => {
                acc[record.student_id] = record.status;
                return acc;
            }, {} as Record<string, AttendanceStatus>);
            setAttendance(attendanceMap);
        } catch (err) {
            console.error("Failed to fetch attendance data", err);
            setError("Gagal memuat data absensi.");
        } finally {
            setIsLoading(prev => ({ ...prev, students: false }));
        }
    }, [selectedClassId, selectedSubjectId, selectedDate]);

    useEffect(() => {
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    const getStatusBadgeColor = (status?: AttendanceStatus) => {
        switch (status) {
            case 'Hadir': return 'bg-green-100 text-green-800';
            case 'Sakit': return 'bg-yellow-100 text-yellow-800';
            case 'Izin': return 'bg-blue-100 text-blue-800';
            case 'Alpha': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pantau Absensi Siswa</h2>
            <Card>
                <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sekolah</label>
                        <select value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} disabled={isLoading.page} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Kelas</label>
                        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} disabled={isLoading.classes || !selectedSchoolId} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                            {isLoading.classes ? <option>Memuat...</option> : classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                         <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={isLoading.subjects || !selectedSchoolId} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                            {isLoading.subjects ? <option>Memuat...</option> : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {isLoading.students ? <p className="p-4 text-center">Memuat data absensi...</p> :
                     error ? <p className="p-4 text-center text-red-500">{error}</p> :
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
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(attendance[student.id])}`}>
                                            {attendance[student.id] || 'Belum Tercatat'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                     ) : <p className="p-4 text-center text-gray-500">Tidak ada data siswa atau absensi untuk filter yang dipilih.</p>
                    }
                </div>
            </Card>
        </div>
    );
};

export default AdminAttendancePage;
