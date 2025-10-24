import React, { useState, useEffect } from 'react';
import { User, TeacherAttendanceRecord, AttendanceStatus, School } from '../../types';
import { dataService } from '../../services/dataService';
import Card from '../Card';
import toast from 'react-hot-toast';
import { 
  getCurrentLocation, 
  validateLocation, 
  formatDistance,
  Coordinates 
} from '../../utils/geolocation';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ClockIcon } from '../icons/ClockIcon';

interface TeacherSelfAttendancePageProps {
  user: User;
}

const TeacherSelfAttendancePage: React.FC<TeacherSelfAttendancePageProps> = ({ user }) => {
  const [school, setSchool] = useState<School | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TeacherAttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<{
    isValid: boolean;
    distance?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [user.schoolId]);

  const fetchData = async () => {
    if (!user.schoolId) {
      toast.error('Anda belum terdaftar di sekolah manapun');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch school data
      const schools = await dataService.getSchools();
      const userSchool = schools.find(s => s.id === user.schoolId);
      setSchool(userSchool || null);

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendances = await dataService.getTeacherAttendance();
      const todayRecord = attendances.find(
        a => a.teacher_id === user.id && a.date === today
      );
      setTodayAttendance(todayRecord || null);

      // Get current location
      try {
        const coords = await getCurrentLocation();
        setCurrentLocation(coords);

        // Validate location if school has coordinates
        if (userSchool?.latitude && userSchool?.longitude) {
          const validation = validateLocation(
            coords,
            { latitude: userSchool.latitude, longitude: userSchool.longitude },
            userSchool.radius || 100
          );
          setLocationStatus(validation);
        }
      } catch (error) {
        setLocationStatus({
          isValid: false,
          error: error instanceof Error ? error.message : 'Gagal mendapatkan lokasi'
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentLocation) {
      toast.error('Lokasi belum didapatkan');
      return;
    }

    // Only validate location if feature is enabled
    if (school?.locationAttendanceEnabled && !locationStatus?.isValid && school?.latitude && school?.longitude) {
      toast.error(`Anda berada di luar jangkauan sekolah (jarak: ${formatDistance(locationStatus?.distance || 0)})`);
      return;
    }

    setIsCheckingIn(true);
    try {
      const now = new Date();
      const checkInTime = now.toTimeString().split(' ')[0];
      const today = now.toISOString().split('T')[0];

      const attendanceData: Omit<TeacherAttendanceRecord, 'id'> = {
        date: today,
        teacher_id: user.id,
        school_id: user.schoolId!,
        check_in_time: checkInTime,
        status: 'Hadir',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location_name: school?.locationName || `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
      };

      await dataService.createTeacherAttendance(attendanceData);
      toast.success('✅ Check-in berhasil!');
      await fetchData();
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Gagal melakukan check-in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance?.id) {
      toast.error('Belum check-in hari ini');
      return;
    }

    if (!currentLocation) {
      toast.error('Lokasi belum didapatkan');
      return;
    }

    setIsCheckingOut(true);
    try {
      const now = new Date();
      const checkOutTime = now.toTimeString().split(' ')[0];

      await dataService.updateTeacherAttendance(todayAttendance.id, {
        check_out_time: checkOutTime,
      });

      toast.success('✅ Check-out berhasil!');
      await fetchData();
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Gagal melakukan check-out');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleMarkAbsent = async (status: AttendanceStatus) => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const attendanceData: Omit<TeacherAttendanceRecord, 'id'> = {
        date: today,
        teacher_id: user.id,
        school_id: user.schoolId!,
        status,
        notes: `Ditandai sebagai ${status}`,
      };

      await dataService.createTeacherAttendance(attendanceData);
      toast.success(`✅ Berhasil ditandai sebagai ${status}`);
      await fetchData();
    } catch (error) {
      console.error('Mark absent error:', error);
      toast.error('Gagal menandai status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Absensi Saya</h2>
        <Card>
          <p className="p-4">Memuat...</p>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const currentDate = now.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Absensi Saya</h2>

      {/* Current Date & Time */}
      <Card className="mb-6 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 mr-2" />
                <span className="text-lg font-semibold">{currentDate}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span className="text-3xl font-bold">{currentTime}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Sekolah</p>
              <p className="text-lg font-semibold">{school?.name || 'Tidak ada'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Location Status */}
      {school?.locationAttendanceEnabled && school?.latitude && school?.longitude && (
        <Card className="mb-6">
          <div className="p-4">
            <h3 className="font-semibold mb-3">📍 Status Lokasi</h3>
            {locationStatus?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">❌ {locationStatus.error}</p>
              </div>
            ) : locationStatus?.isValid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm font-semibold">
                  ✅ Anda berada di dalam jangkauan sekolah
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Jarak: {formatDistance(locationStatus.distance || 0)} dari lokasi sekolah
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-700 text-sm font-semibold">
                  ⚠️ Anda berada di luar jangkauan sekolah
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Jarak: {formatDistance(locationStatus?.distance || 0)} dari lokasi sekolah
                </p>
                <p className="text-yellow-600 text-xs">
                  Radius yang diizinkan: {formatDistance(school?.radius || 100)}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Attendance Status Today */}
      <Card className="mb-6">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Status Absensi Hari Ini</h3>
          {todayAttendance ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                  todayAttendance.status === 'Hadir' ? 'bg-green-100 text-green-700' :
                  todayAttendance.status === 'Sakit' ? 'bg-yellow-100 text-yellow-700' :
                  todayAttendance.status === 'Izin' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {todayAttendance.status}
                </span>
              </div>
              {todayAttendance.check_in_time && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-semibold">{todayAttendance.check_in_time}</span>
                </div>
              )}
              {todayAttendance.check_out_time && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-semibold">{todayAttendance.check_out_time}</span>
                </div>
              )}
              {todayAttendance.location_name && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Lokasi:</span>
                  <span className="text-sm text-gray-700">{todayAttendance.location_name}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Belum absen hari ini</p>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-4">Tindakan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {!todayAttendance || !todayAttendance.check_in_time ? (
              <>
                <button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn || (school?.locationAttendanceEnabled && !locationStatus?.isValid && !!school?.latitude)}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isCheckingIn ? '⏳ Memproses...' : '✅ Check-In'}
                </button>
                <button
                  onClick={() => handleMarkAbsent('Sakit')}
                  disabled={isLoading}
                  className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700"
                >
                  🤒 Sakit
                </button>
                <button
                  onClick={() => handleMarkAbsent('Izin')}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  📝 Izin
                </button>
              </>
            ) : !todayAttendance.check_out_time ? (
              <button
                onClick={handleCheckOut}
                disabled={isCheckingOut}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
              >
                {isCheckingOut ? '⏳ Memproses...' : '🚪 Check-Out'}
              </button>
            ) : (
              <div className="col-span-2 text-center py-4">
                <p className="text-green-600 font-semibold">
                  ✅ Anda sudah menyelesaikan absensi hari ini
                </p>
              </div>
            )}
          </div>

          {!school?.latitude && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-700 text-sm">
                ⚠️ Lokasi sekolah belum diatur. Hubungi admin untuk mengatur lokasi sekolah.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TeacherSelfAttendancePage;
