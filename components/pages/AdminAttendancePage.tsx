
import React, { useState, useEffect } from 'react';
import Card from '../Card';
// import { dataService } from '../../services/dataService';
import { User, School, Class } from '../../types';

interface AdminAttendancePageProps {
  user: User; // The logged-in admin user
}

const AdminAttendancePage: React.FC<AdminAttendancePageProps> = ({ user }) => {
  // MOCK DATA
  const mockAttendanceData = [
    { id: 1, studentName: 'Ahmad Dahlan', className: 'MA Kelas 10-A', subject: 'Matematika', status: 'Hadir', teacher: 'Budi S.', date: '2024-08-01' },
    { id: 2, studentName: 'Siti Aminah', className: 'MA Kelas 10-A', subject: 'Matematika', status: 'Hadir', teacher: 'Budi S.', date: '2024-08-01' },
    { id: 3, studentName: 'Zainal Arifin', className: 'MTs Kelas 8-B', subject: 'IPA', status: 'Sakit', teacher: 'Citra L.', date: '2024-08-01' },
    { id: 4, studentName: 'Dewi Lestari', className: 'MI Kelas 5', subject: 'Bahasa Indonesia', status: 'Hadir', teacher: 'Dewi P.', date: '2024-08-01' },
    { id: 5, studentName: 'Fajar Nugroho', className: 'MA Kelas 11-A', subject: 'Fisika', status: 'Alpha', teacher: 'Eko W.', date: '2024-08-01' },
  ];

  // In a real app, you would fetch these from dataService
  const [schools, setSchools] = useState<School[]>([{id: 'ma_fs', name: 'MA Fathus Salafi', level: 'MA', address: '...'}]);
  const [classes, setClasses] = useState<Class[]>([{id: '10a', name: 'MA Kelas 10-A', schoolId: 'ma_fs'}]);
  
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState(mockAttendanceData);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect for fetching data would go here in a real app

  const getStatusColor = (status: string) => {
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Pantau Absensi Seluruh Sekolah</h2>
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
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
                  <th className="px-6 py-3">Guru</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(record => (
                  <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{record.studentName}</td>
                    <td className="px-6 py-4">{record.className}</td>
                    <td className="px-6 py-4">{record.subject}</td>
                    <td className="px-6 py-4">{record.teacher}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                        </span>
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

export default AdminAttendancePage;
