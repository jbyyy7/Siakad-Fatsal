import React, { useState, useEffect } from 'react';
import { User, GateAttendanceAnalytics, LateArrivalReport } from '../../types';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';

const GateAnalyticsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<GateAttendanceAnalytics[]>([]);
  const [lateReport, setLateReport] = useState<LateArrivalReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

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
      fetchAnalytics();
    }
  }, [user, dateRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_gate_attendance_analytics', {
          school_id_param: user.schoolId || null,
          start_date_param: dateRange.startDate,
          end_date_param: dateRange.endDate
        });

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData || []);

      // Get late report
      const { data: lateData, error: lateError } = await supabase
        .rpc('get_late_arrival_report', {
          school_id_param: user.schoolId || null,
          start_date_param: dateRange.startDate,
          end_date_param: dateRange.endDate
        });

      if (lateError) throw lateError;
      setLateReport(lateData || []);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Gagal memuat analytics: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    const totals = analytics.reduce((acc, day) => {
      return {
        totalPresent: acc.totalPresent + day.present_count,
        totalLate: acc.totalLate + day.late_count,
        totalOnTime: acc.totalOnTime + day.on_time_count,
      };
    }, { totalPresent: 0, totalLate: 0, totalOnTime: 0 });

    const latePercentage = totals.totalPresent > 0 
      ? ((totals.totalLate / totals.totalPresent) * 100).toFixed(1)
      : '0';

    return { ...totals, latePercentage };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const totals = calculateTotals();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Analytics Absensi Gerbang</h1>
          <p className="text-gray-600 mt-1">Analisis dan laporan keterlambatan siswa</p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Total Kehadiran</div>
          <div className="text-3xl font-bold text-blue-600">{totals.totalPresent}</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg shadow border border-emerald-200">
          <div className="text-sm text-emerald-700">Tepat Waktu</div>
          <div className="text-3xl font-bold text-emerald-600">{totals.totalOnTime}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
          <div className="text-sm text-red-700">Terlambat</div>
          <div className="text-3xl font-bold text-red-600">{totals.totalLate}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow border border-orange-200">
          <div className="text-sm text-orange-700">% Keterlambatan</div>
          <div className="text-3xl font-bold text-orange-600">{totals.latePercentage}%</div>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
          Grafik Harian
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Simple bar chart using div heights */}
            <div className="flex items-end justify-between h-64 border-b border-gray-300">
              {analytics.map((day, index) => {
                const maxValue = Math.max(...analytics.map(d => d.present_count));
                const presentHeight = maxValue > 0 ? (day.present_count / maxValue) * 100 : 0;
                const lateHeight = maxValue > 0 ? (day.late_count / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end px-1">
                    <div className="w-full flex gap-1 items-end">
                      {/* On-time bar */}
                      <div 
                        className="flex-1 bg-emerald-500 rounded-t hover:bg-emerald-600 transition-all relative group"
                        style={{ height: `${presentHeight - lateHeight}%`, minHeight: day.on_time_count > 0 ? '4px' : '0' }}
                      >
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-emerald-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.on_time_count} tepat waktu
                        </span>
                      </div>
                      {/* Late bar */}
                      <div 
                        className="flex-1 bg-red-500 rounded-t hover:bg-red-600 transition-all relative group"
                        style={{ height: `${lateHeight}%`, minHeight: day.late_count > 0 ? '4px' : '0' }}
                      >
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.late_count} terlambat
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 text-center">
                      {formatDate(day.date)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                <span className="text-sm text-gray-700">Tepat Waktu</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Terlambat</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Late Arrival Report Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">⏰ Laporan Siswa Sering Terlambat</h2>
          <p className="text-sm text-gray-600 mt-1">Ranking siswa berdasarkan jumlah keterlambatan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ranking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hari
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hari Terlambat
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Terlambat
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rata-rata Menit
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maks Terlambat
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : lateReport.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data keterlambatan
                  </td>
                </tr>
              ) : (
                lateReport.slice(0, 20).map((report, index) => (
                  <tr key={report.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${
                        index === 0 ? 'text-red-600' : 
                        index === 1 ? 'text-orange-600' : 
                        index === 2 ? 'text-yellow-600' : 
                        'text-gray-600'
                      }`}>
                        #{index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.identity_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.student_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{report.total_days}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-red-600">{report.late_days}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.late_percentage >= 50 ? 'bg-red-100 text-red-700' :
                        report.late_percentage >= 25 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.late_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {report.average_late_minutes.toFixed(1)} menit
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-red-600">
                        {report.max_late_minutes} menit
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GateAnalyticsPage;
