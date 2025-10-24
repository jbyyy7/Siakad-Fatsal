import React, { useState, useEffect } from 'react';
import { GateAttendanceRecord, User } from '../../types';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
import { notifyParentGateCheckIn, notifyParentGateCheckOut, notifyParentGateLate } from '../../services/whatsappService';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface GateAttendanceSummary {
  total_students: number;
  checked_in: number;
  inside_now: number;
  checked_out: number;
  not_arrived: number;
  late_arrivals?: number;
  on_time_arrivals?: number;
}

const GateAttendancePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<GateAttendanceRecord[]>([]);
  const [summary, setSummary] = useState<GateAttendanceSummary>({
    total_students: 0,
    checked_in: 0,
    inside_now: 0,
    checked_out: 0,
    not_arrived: 0,
    late_arrivals: 0,
    on_time_arrivals: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'inside_school' | 'outside_school' | 'not_arrived' | 'late'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [processingStudent, setProcessingStudent] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const users = await dataService.getUsers();
        const currentUser = users.find(u => u.id === session.user.id);
        if (currentUser) setUser(currentUser);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get students
      const filters = user.schoolId ? { schoolId: user.schoolId } : {};
      const allStudents = await dataService.getUsers(filters);
      const studentList = allStudents.filter(u => u.role === 'Siswa');
      setStudents(studentList);

      // Get today's gate attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData, error } = await supabase
        .from('gate_attendance')
        .select('*, student:profiles!gate_attendance_student_id_fkey(id, full_name, identity_number)')
        .eq('date', today)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setAttendance(attendanceData || []);

      // Get summary
      await fetchSummary();
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .rpc('get_gate_attendance_summary', {
          school_id_param: user.schoolId || null,
          date_param: today,
        });

      if (error) throw error;
      if (data && data.length > 0) {
        setSummary(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleCheckIn = async (studentId: string) => {
    setProcessingStudent(studentId);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      // Check if already checked in today
      const { data: existing, error: checkError } = await supabase
        .from('gate_attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existing) {
        toast.error('Siswa sudah check-in hari ini');
        return;
      }

      // Create check-in record
      const { error } = await supabase
        .from('gate_attendance')
        .insert({
          student_id: studentId,
          school_id: user?.schoolId || null,
          date: today,
          check_in_time: now,
          check_in_method: 'Manual',
          check_in_by: user?.id,
          status: 'inside_school',
        });

      if (error) throw error;

      toast.success('Check-in berhasil');
      
      // Send WhatsApp notification to parents
      try {
        const student = students.find(s => s.id === studentId);
        if (student) {
          const checkInTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          await notifyParentGateCheckIn(
            student.name,
            student.nis || student.email,
            checkInTime,
            user?.schoolId || ''
          );
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the check-in if notification fails
      }
      
      await fetchData();
    } catch (error: any) {
      console.error('Error check-in:', error);
      toast.error('Gagal check-in: ' + error.message);
    } finally {
      setProcessingStudent(null);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    setProcessingStudent(attendanceId);
    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('gate_attendance')
        .update({
          check_out_time: now,
          check_out_method: 'Manual',
          check_out_by: user?.id,
          status: 'outside_school',
        })
        .eq('id', attendanceId);

      if (error) throw error;

      toast.success('Check-out berhasil');
      
      // Send WhatsApp notification to parents
      try {
        const record = attendance.find((a: GateAttendanceRecord) => String(a.id) === attendanceId);
        if (record) {
          const student = students.find(s => s.id === record.student_id);
          const checkOutTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          await notifyParentGateCheckOut(
            student?.name || record.studentName || 'Siswa',
            student?.email || '-',
            checkOutTime,
            user?.schoolId || ''
          );
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
      
      await fetchData();
    } catch (error: any) {
      console.error('Error check-out:', error);
      toast.error('Gagal check-out: ' + error.message);
    } finally {
      setProcessingStudent(null);
    }
  };

  const exportToExcel = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Absensi Gerbang');

      // Title
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `LAPORAN ABSENSI GERBANG - ${today}`;
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: 'center' };

      // Summary
      worksheet.mergeCells('A2:H2');
      const summaryCell = worksheet.getCell('A2');
      summaryCell.value = `Total: ${summary.total_students} | Hadir: ${summary.checked_in} | Terlambat: ${summary.late_arrivals} | Belum Datang: ${summary.not_arrived}`;
      summaryCell.alignment = { horizontal: 'center' };

      // Headers
      worksheet.addRow([]);
      const headerRow = worksheet.addRow([
        'No',
        'NIS',
        'Nama Siswa',
        'Check-in',
        'Status',
        'Check-out',
        'Status Akhir',
        'Keterangan'
      ]);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Data
      filteredStudents.forEach((student, index) => {
        const record = getAttendanceForStudent(student.id);
        worksheet.addRow([
          index + 1,
          student.identityNumber,
          student.name,
          record?.check_in_time ? formatTime(record.check_in_time) : '-',
          record?.late_arrival ? `Terlambat ${record.late_minutes} menit` : (record?.check_in_time ? 'Tepat Waktu' : '-'),
          record?.check_out_time ? formatTime(record.check_out_time) : '-',
          !record ? 'Belum Datang' : record.status === 'inside_school' ? 'Di Sekolah' : 'Sudah Pulang',
          record?.notes || ''
        ]);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      worksheet.getColumn(3).width = 25; // Name column

      // Export
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Absensi-Gerbang-${today}.xlsx`);
      
      toast.success('Export berhasil!');
    } catch (error: any) {
      console.error('Error export:', error);
      toast.error('Gagal export: ' + error.message);
    }
  };

  const getFilteredData = () => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.identityNumber.includes(searchTerm)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'not_arrived') {
        const checkedInIds = attendance.map(a => a.student_id);
        filtered = filtered.filter(s => !checkedInIds.includes(s.id));
      } else if (filterStatus === 'late') {
        const lateAttendance = attendance.filter(a => a.late_arrival === true);
        const lateIds = lateAttendance.map(a => a.student_id);
        filtered = filtered.filter(s => lateIds.includes(s.id));
      } else {
        const statusAttendance = attendance.filter(a => a.status === filterStatus);
        const statusIds = statusAttendance.map(a => a.student_id);
        filtered = filtered.filter(s => statusIds.includes(s.id));
      }
    }

    return filtered;
  };

  const getAttendanceForStudent = (studentId: string): GateAttendanceRecord | undefined => {
    return attendance.find(a => a.student_id === studentId);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredStudents = getFilteredData();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🚪 Absensi Gerbang</h1>
          <p className="text-gray-600 mt-1">Monitoring keluar-masuk siswa di gerbang sekolah</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <DownloadIcon className="h-5 w-5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Siswa</div>
          <div className="text-2xl font-bold text-gray-800">{summary.total_students}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Sudah Check-in</div>
          <div className="text-2xl font-bold text-green-600">{summary.checked_in}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Masih di Sekolah</div>
          <div className="text-2xl font-bold text-blue-600">{summary.inside_now}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow border border-orange-200">
          <div className="text-sm text-orange-700">Sudah Pulang</div>
          <div className="text-2xl font-bold text-orange-600">{summary.checked_out}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Belum Datang</div>
          <div className="text-2xl font-bold text-gray-700">{summary.not_arrived}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
          <div className="text-sm text-red-700">⏰ Terlambat</div>
          <div className="text-2xl font-bold text-red-600">{summary.late_arrivals || 0}</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg shadow border border-emerald-200">
          <div className="text-sm text-emerald-700">✅ Tepat Waktu</div>
          <div className="text-2xl font-bold text-emerald-600">{summary.on_time_arrivals || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Cari nama atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('inside_school')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'inside_school' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Di Sekolah
            </button>
            <button
              onClick={() => setFilterStatus('outside_school')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'outside_school' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Sudah Pulang
            </button>
            <button
              onClick={() => setFilterStatus('not_arrived')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'not_arrived' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Belum Datang
            </button>
            <button
              onClick={() => setFilterStatus('late')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'late' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              ⏰ Terlambat
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data siswa
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const record = getAttendanceForStudent(student.id);
                  const isProcessing = processingStudent === student.id || processingStudent === (record?.id ? String(record.id) : '');

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-8 w-8 text-gray-400" />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.identityNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record?.check_in_time ? (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <ClockIcon className={`h-4 w-4 mr-1 ${record.late_arrival ? 'text-red-500' : 'text-green-500'}`} />
                              <span className="text-gray-900">{formatTime(record.check_in_time)}</span>
                              <span className="ml-1 text-xs text-gray-500">({record.check_in_method})</span>
                            </div>
                            {record.late_arrival && (
                              <div className="flex items-center text-xs">
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                  ⏰ Terlambat {record.late_minutes} menit
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record?.check_out_time ? (
                          <div className="flex items-center text-sm">
                            <ClockIcon className="h-4 w-4 text-orange-500 mr-1" />
                            <span className="text-gray-900">{formatTime(record.check_out_time)}</span>
                            <span className="ml-1 text-xs text-gray-500">({record.check_out_method})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!record ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Belum Datang
                          </span>
                        ) : record.status === 'inside_school' ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            Di Sekolah
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                            Sudah Pulang
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!record ? (
                          <button
                            onClick={() => handleCheckIn(student.id)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {isProcessing ? 'Processing...' : 'Check-in'}
                          </button>
                        ) : record.status === 'inside_school' ? (
                          <button
                            onClick={() => handleCheckOut(String(record.id))}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                          >
                            {isProcessing ? 'Processing...' : 'Check-out'}
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GateAttendancePage;
