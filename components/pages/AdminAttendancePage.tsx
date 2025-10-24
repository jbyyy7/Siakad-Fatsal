import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import { User, School, Class, AttendanceRecord, AttendanceStatus } from '../../types';
import { dataService } from '../../services/dataService';
import { DownloadIcon } from '../icons/DownloadIcon';
import { PencilIcon } from '../icons/PencilIcon';

interface AdminAttendancePageProps {
  user: User;
}

const AdminAttendancePage: React.FC<AdminAttendancePageProps> = ({ user }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [editableRecords, setEditableRecords] = useState<AttendanceRecord[]>([]);

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    schoolId: '',
    classId: '',
  });

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
        console.error("Failed to fetch schools", error);
      } finally {
        setIsLoading(prev => ({ ...prev, init: false }));
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!filters.schoolId) {
        setClasses([]);
        setFilters(prev => ({ ...prev, classId: ''}));
        return;
      }
      try {
        const classesData = await dataService.getClasses(); // Fetch all for simplicity
        const filteredClasses = classesData.filter(c => c.schoolId === filters.schoolId);
        setClasses(filteredClasses);
        setFilters(prev => ({ ...prev, classId: ''}));
      } catch (error) {
        console.error("Failed to fetch classes", error);
      }
    };
    fetchClasses();
  }, [filters.schoolId]);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, data: true }));
    setSaveStatus('idle');
    try {
      const data = await dataService.getAttendanceForAdmin({ 
          date: filters.date,
          schoolId: filters.schoolId,
          classId: filters.classId,
      });
      setAttendanceRecords(data);
      setEditableRecords(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error("Failed to fetch attendance records", error);
    } finally {
      setIsLoading(prev => ({ ...prev, data: false }));
    }
  }, [filters]);

  useEffect(() => {
    if (!filters.schoolId || !filters.date) return;
    fetchAttendance();
  }, [fetchAttendance, filters]);


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel changes
      setEditableRecords(JSON.parse(JSON.stringify(attendanceRecords)));
    }
    setIsEditMode(!isEditMode);
    setSaveStatus('idle');
  };
  
  const handleStatusChange = (index: number, newStatus: AttendanceStatus) => {
    const updatedRecords = [...editableRecords];
    updatedRecords[index].status = newStatus;
    setEditableRecords(updatedRecords);
    setSaveStatus('idle');
  };

  const handleSaveChanges = async () => {
    setSaveStatus('saving');
    try {
        await dataService.updateAttendanceRecords(editableRecords);
        setSaveStatus('success');
        setIsEditMode(false);
        fetchAttendance(); // Refetch data to confirm
    } catch (error) {
        console.error("Failed to save attendance:", error);
        setSaveStatus('error');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Pantau Absensi Keseluruhan</h2>
      <Card>
        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm">Tanggal</label>
            <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label className="text-sm">Sekolah</label>
            <select name="schoolId" value={filters.schoolId} onChange={handleFilterChange} className="w-full p-2 border rounded-md">
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Kelas</label>
            <select name="classId" value={filters.classId} onChange={handleFilterChange} className="w-full p-2 border rounded-md" disabled={!filters.schoolId}>
              <option value="">Semua Kelas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
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
                    if (filters.date) params.append('date', filters.date);
                    window.location.href = `/api/export-attendance?${params.toString()}`; 
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
                        <th className="px-6 py-3">Guru Pencatat</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {editableRecords.map((rec, index) => (
                        <tr key={rec.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{rec.studentName}</td>
                            <td className="px-6 py-4 text-gray-600">{rec.teacherName}</td>
                            <td className="px-6 py-4">
                                {isEditMode ? (
                                    <select value={rec.status} onChange={(e) => handleStatusChange(index, e.target.value as AttendanceStatus)} className="p-1 border rounded-md">
                                        <option>Hadir</option>
                                        <option>Sakit</option>
                                        <option>Izin</option>
                                        <option>Alpha</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ rec.status === 'Hadir' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{rec.status}</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            )}
            {attendanceRecords.length === 0 && !isLoading.data && <p className="p-4 text-center text-gray-500">Tidak ada data absensi untuk filter yang dipilih.</p>}
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

export default AdminAttendancePage;