import React, { useState, useEffect } from 'react';
import { User, GateAttendanceRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { ClockIcon } from '../icons/ClockIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';

const StudentGateQRPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<GateAttendanceRecord | null>(null);
  const [recentHistory, setRecentHistory] = useState<GateAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      fetchAttendanceData();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's attendance
      const { data: todayData, error: todayError } = await supabase
        .from('gate_attendance')
        .select('*')
        .eq('student_id', user.id)
        .eq('date', today)
        .single();

      if (todayError && todayError.code !== 'PGRST116') throw todayError;
      setTodayAttendance(todayData || null);

      // Get recent history (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: historyData, error: historyError } = await supabase
        .from('gate_attendance')
        .select('*')
        .eq('student_id', user.id)
        .gte('date', sevenDaysAgoStr)
        .order('date', { ascending: false })
        .limit(7);

      if (historyError) throw historyError;
      setRecentHistory(historyData || []);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (record: GateAttendanceRecord) => {
    if (record.status === 'inside_school') {
      return (
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">
          Di Sekolah
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-700">
          Sudah Pulang
        </span>
      );
    }
  };

  // QR Code value: Format - GATE:STUDENT_ID:IDENTITY_NUMBER
  const qrValue = user ? `GATE:${user.id}:${user.identityNumber}` : '';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🚪 QR Code Gerbang</h1>
          <p className="text-gray-600 mt-1">Scan QR code ini untuk check-in/out di gerbang sekolah</p>
        </div>
        <button
          onClick={fetchAttendanceData}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {user && (
        <>
          {/* QR Code Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 mb-6 border-2 border-blue-200">
            <div className="text-center">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-600">NIS: {user.identityNumber}</p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-6 rounded-xl shadow-md inline-block mb-4">
                <QRCode value={qrValue} size={256} />
              </div>

              <div className="text-sm text-gray-600 max-w-md mx-auto">
                <p className="mb-2">📱 <strong>Cara Pakai:</strong></p>
                <ol className="text-left space-y-1 pl-4">
                  <li>1. Tunjukkan QR code ini ke petugas gerbang</li>
                  <li>2. Petugas akan scan QR code dengan scanner</li>
                  <li>3. Status check-in/out akan otomatis tercatat</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Today's Status */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
              Status Hari Ini
            </h3>
            {todayAttendance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(todayAttendance)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-1">Check-in</div>
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-lg font-semibold text-green-800">
                        {formatTime(todayAttendance.check_in_time)}
                      </span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      via {todayAttendance.check_in_method}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-700 mb-1">Check-out</div>
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-lg font-semibold text-orange-800">
                        {formatTime(todayAttendance.check_out_time)}
                      </span>
                    </div>
                    {todayAttendance.check_out_method && (
                      <div className="text-xs text-orange-600 mt-1">
                        via {todayAttendance.check_out_method}
                      </div>
                    )}
                  </div>
                </div>
                {todayAttendance.notes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Catatan:</div>
                    <div className="text-sm text-gray-800">{todayAttendance.notes}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">Belum check-in hari ini</div>
                <p className="text-sm text-gray-500">Scan QR code di gerbang untuk check-in</p>
              </div>
            )}
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-blue-600" />
              Riwayat 7 Hari Terakhir
            </h3>
            {recentHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada riwayat absensi gerbang
              </div>
            ) : (
              <div className="space-y-3">
                {recentHistory.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-800">
                        {formatDate(record.date)}
                      </div>
                      {getStatusBadge(record)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Check-in: </span>
                        <span className="font-medium text-gray-800">
                          {formatTime(record.check_in_time)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({record.check_in_method})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Check-out: </span>
                        <span className="font-medium text-gray-800">
                          {formatTime(record.check_out_time)}
                        </span>
                        {record.check_out_method && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({record.check_out_method})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentGateQRPage;
