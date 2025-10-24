import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import Card from '../Card';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'react-hot-toast';
import { logger } from '../../utils/logger';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { CalendarIcon } from '../icons/CalendarIcon';

interface SelfAttendancePageProps {
  user: User;
}

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const SelfAttendancePage: React.FC<SelfAttendancePageProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [schoolLocation, setSchoolLocation] = useState<{ lat: number; lng: number; radius: number } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Get current location
  const getCurrentLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser Anda'));
        return;
      }

      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCurrentLocation(coords);
          setLocationLoading(false);
          resolve(coords);
        },
        (error) => {
          setLocationLoading(false);
          let message = 'Gagal mendapatkan lokasi';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Izin lokasi ditolak. Mohon aktifkan lokasi di browser Anda.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Informasi lokasi tidak tersedia';
              break;
            case error.TIMEOUT:
              message = 'Request lokasi timeout';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // Load school location settings
  const loadSchoolLocation = async () => {
    if (!user.schoolId) return;

    try {
      const { data, error } = await supabase
        .from('schools')
        .select('location_latitude, location_longitude, location_radius')
        .eq('id', user.schoolId)
        .single();

      if (error) throw error;

      if (data && data.location_latitude && data.location_longitude) {
        setSchoolLocation({
          lat: data.location_latitude,
          lng: data.location_longitude,
          radius: data.location_radius || 100, // Default 100 meters
        });
      }
    } catch (error) {
      logger.error('Failed to load school location', error);
    }
  };

  // Load today's attendance record
  const loadTodayRecord = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_attendance')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      setTodayRecord(data);
    } catch (error) {
      logger.error('Failed to load today record', error);
    }
  };

  // Load attendance history (last 7 days)
  const loadHistory = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('teacher_attendance')
        .select('*')
        .eq('teacher_id', user.id)
        .gte('date', startDate)
        .lte('date', today)
        .order('date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      logger.error('Failed to load history', error);
    }
  };

  // Check in
  const handleCheckIn = async () => {
    try {
      setLoading(true);

      // Get current location
      const location = await getCurrentLocation();

      // Validate location if school location is set
      if (schoolLocation) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          schoolLocation.lat,
          schoolLocation.lng
        );

        if (distance > schoolLocation.radius) {
          toast.error(
            `Anda berada ${Math.round(distance)}m dari sekolah. Maksimal jarak: ${schoolLocation.radius}m`
          );
          setLoading(false);
          return;
        }
      }

      const now = new Date();
      const time = now.toTimeString().split(' ')[0];

      // Insert or update record
      const record = {
        teacher_id: user.id,
        school_id: user.schoolId,
        date: today,
        check_in_time: time,
        status: 'Hadir',
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      };

      if (todayRecord) {
        // Update existing record
        const { error } = await supabase
          .from('teacher_attendance')
          .update(record)
          .eq('id', todayRecord.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from('teacher_attendance').insert([record]);

        if (error) throw error;
      }

      toast.success('✅ Check-in berhasil!');
      await loadTodayRecord();
      await loadHistory();
    } catch (error: any) {
      logger.error('Check-in failed', error);
      toast.error(error.message || 'Gagal check-in');
    } finally {
      setLoading(false);
    }
  };

  // Check out
  const handleCheckOut = async () => {
    if (!todayRecord) {
      toast.error('Anda belum check-in hari ini');
      return;
    }

    try {
      setLoading(true);

      // Get current location
      const location = await getCurrentLocation();

      const now = new Date();
      const time = now.toTimeString().split(' ')[0];

      const { error } = await supabase
        .from('teacher_attendance')
        .update({
          check_out_time: time,
        })
        .eq('id', todayRecord.id);

      if (error) throw error;

      toast.success('✅ Check-out berhasil!');
      await loadTodayRecord();
      await loadHistory();
    } catch (error: any) {
      logger.error('Check-out failed', error);
      toast.error(error.message || 'Gagal check-out');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolLocation();
    loadTodayRecord();
    loadHistory();
  }, [user.id]);

  const isCheckedIn = todayRecord?.check_in_time != null;
  const isCheckedOut = todayRecord?.check_out_time != null;

  return (
    <Card>
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          📍 Absensi Saya
        </h2>

        {/* Current Status */}
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Status Hari Ini - {today}</h3>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Check-in</p>
              {isCheckedIn ? (
                <p className="text-2xl font-bold text-green-600">
                  ✓ {todayRecord.check_in_time}
                </p>
              ) : (
                <p className="text-lg text-gray-400">Belum check-in</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Check-out</p>
              {isCheckedOut ? (
                <p className="text-2xl font-bold text-blue-600">
                  → {todayRecord.check_out_time}
                </p>
              ) : (
                <p className="text-lg text-gray-400">Belum check-out</p>
              )}
            </div>
          </div>

          {/* Location Info */}
          {currentLocation && (
            <div className="mb-4 p-3 bg-white rounded-lg text-sm">
              <p className="text-gray-600">
                📍 Lokasi saat ini: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              <p className="text-gray-500 text-xs">Akurasi: ±{Math.round(currentLocation.accuracy)}m</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              disabled={loading || isCheckedOut}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
                isCheckedOut
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-500/30'
              }`}
            >
              {loading && !isCheckedIn ? '⏳ Memproses...' : isCheckedIn ? '✓ Sudah Check-in' : '▶ Check-in Sekarang'}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={loading || !isCheckedIn || isCheckedOut}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
                !isCheckedIn || isCheckedOut
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/30'
              }`}
            >
              {loading && isCheckedIn && !isCheckedOut
                ? '⏳ Memproses...'
                : isCheckedOut
                ? '✓ Sudah Check-out'
                : '◼ Check-out Sekarang'}
            </button>
          </div>

          {/* Get Location Button */}
          <button
            onClick={() => getCurrentLocation().catch((err) => toast.error(err.message))}
            disabled={locationLoading}
            className="mt-3 w-full px-4 py-2 bg-white border-2 border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            {locationLoading ? '🔄 Mendapatkan lokasi...' : '📍 Perbarui Lokasi'}
          </button>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h3 className="text-lg font-semibold flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Riwayat 7 Hari Terakhir
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="text-left p-3 font-semibold">Tanggal</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Check-in</th>
                  <th className="text-left p-3 font-semibold">Check-out</th>
                  <th className="text-left p-3 font-semibold">Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-400">
                      <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      Belum ada riwayat absensi
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id} className="border-b border-blue-100 hover:bg-blue-50/30 transition-colors">
                      <td className="p-3 font-medium">{record.date}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === 'Hadir'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="p-3 text-green-600 font-medium">{record.check_in_time || '-'}</td>
                      <td className="p-3 text-blue-600 font-medium">{record.check_out_time || '-'}</td>
                      <td className="p-3 text-xs text-gray-500">{record.location_name || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        {schoolLocation && (
          <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
            <p className="text-sm text-amber-800">
              ℹ️ Anda harus berada dalam radius <strong>{schoolLocation.radius}m</strong> dari sekolah untuk check-in.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SelfAttendancePage;
