import React, { useState, useEffect } from 'react';
import { School } from '../../types';
import { getCurrentLocation, formatDistance } from '../../utils/geolocation';
import toast from 'react-hot-toast';

interface SchoolFormProps {
  school: School | null;
  onClose: () => void;
  onSave: (formData: Omit<School, 'id'>) => Promise<void>;
}

const SchoolForm: React.FC<SchoolFormProps> = ({ school, onClose, onSave }) => {
  // Default location: -7.653938, 114.042504
  const DEFAULT_LATITUDE = -7.653938;
  const DEFAULT_LONGITUDE = 114.042504;

  const [formData, setFormData] = useState({
    name: '',
    level: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    locationName: '',
    radius: 100, // default 100 meters
    locationAttendanceEnabled: false, // default disabled
    gateAttendanceEnabled: false, // default disabled
    gateQREnabled: true, // default enabled if gate attendance is on
    gateFaceEnabled: false, // future feature
    gateManualEnabled: true, // default enabled if gate attendance is on
    // Phase 2 settings
    gateCheckInStart: '05:00:00',
    gateCheckInEnd: '23:59:59',
    gateLateThreshold: '07:30:00',
    gateCheckOutStart: '05:00:00',
    gateCheckOutEnd: '23:59:59',
    gateNotifyParents: true,
    gateNotifyOnLate: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        level: school.level || '',
        address: school.address || '',
        latitude: school.latitude,
        longitude: school.longitude,
        locationName: school.locationName || '',
        radius: school.radius || 100,
        locationAttendanceEnabled: school.locationAttendanceEnabled || false,
        gateAttendanceEnabled: school.gateAttendanceEnabled || false,
        gateQREnabled: school.gateQREnabled !== false,
        gateFaceEnabled: school.gateFaceEnabled || false,
        gateManualEnabled: school.gateManualEnabled !== false,
        gateCheckInStart: school.gateCheckInStart || '05:00:00',
        gateCheckInEnd: school.gateCheckInEnd || '23:59:59',
        gateLateThreshold: school.gateLateThreshold || '07:30:00',
        gateCheckOutStart: school.gateCheckOutStart || '05:00:00',
        gateCheckOutEnd: school.gateCheckOutEnd || '23:59:59',
        gateNotifyParents: school.gateNotifyParents !== false,
        gateNotifyOnLate: school.gateNotifyOnLate !== false,
      });
    } else {
      setFormData({ 
        name: '', 
        level: '', 
        address: '', 
        latitude: undefined, 
        longitude: undefined, 
        locationName: '', 
        radius: 100,
        locationAttendanceEnabled: false,
        gateAttendanceEnabled: false,
        gateQREnabled: true,
        gateFaceEnabled: false,
        gateManualEnabled: true,
        gateCheckInStart: '05:00:00',
        gateCheckInEnd: '23:59:59',
        gateLateThreshold: '07:30:00',
        gateCheckOutStart: '05:00:00',
        gateCheckOutEnd: '23:59:59',
        gateNotifyParents: true,
        gateNotifyOnLate: true,
      });
    }
  }, [school]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleUseDefaultLocation = () => {
    setFormData(prev => ({
      ...prev,
      latitude: DEFAULT_LATITUDE,
      longitude: DEFAULT_LONGITUDE,
      locationName: 'Jember, Jawa Timur',
    }));
    toast.success('Lokasi default berhasil diatur!');
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationName: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
      }));
      toast.success('Lokasi berhasil didapatkan!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mendapatkan lokasi');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label htmlFor="level" className="block text-sm font-medium text-gray-700">Jenjang (e.g., TK, SD, SMP, SMA)</label>
        <input
          type="text"
          id="level"
          name="level"
          value={formData.level}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {/* Location Fields */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">📍 Lokasi untuk Geofencing Absensi</h3>
          
          {/* Toggle Enable/Disable */}
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="locationAttendanceEnabled"
                checked={formData.locationAttendanceEnabled}
                onChange={handleChange}
                className="sr-only"
              />
              <div className={`block w-14 h-8 rounded-full transition ${
                formData.locationAttendanceEnabled ? 'bg-green-600' : 'bg-gray-300'
              }`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                formData.locationAttendanceEnabled ? 'translate-x-6' : ''
              }`}></div>
            </div>
            <div className="ml-3 text-sm">
              <span className={`font-medium ${formData.locationAttendanceEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {formData.locationAttendanceEnabled ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </label>
        </div>

        {formData.locationAttendanceEnabled && (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleUseDefaultLocation}
                className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700"
              >
                📍 Gunakan Lokasi Default
              </button>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isGettingLocation ? 'Mendapatkan Lokasi...' : '📍 Lokasi GPS Saat Ini'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Lokasi default: Jember, Jawa Timur (-7.653938, 114.042504)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="-7.653938"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="114.042504"
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">Nama Lokasi</label>
              <input
                type="text"
                id="locationName"
                name="locationName"
                value={formData.locationName}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Nama lokasi atau alamat"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700">
                Radius Geofencing ({formData.radius ? formatDistance(formData.radius) : '100 m'})
              </label>
              <input
                type="range"
                id="radius"
                name="radius"
                min="50"
                max="500"
                step="10"
                value={formData.radius}
                onChange={handleChange}
                className="mt-1 block w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Guru/staff harus berada dalam radius ini untuk absen (50m - 500m)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Gate Attendance Settings */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">🚪 Pengaturan Absensi Gerbang</h3>
        
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="gateAttendanceEnabled"
                checked={formData.gateAttendanceEnabled || false}
                onChange={handleChange}
                className="sr-only"
              />
              <div className={`block w-14 h-8 rounded-full transition ${
                formData.gateAttendanceEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                formData.gateAttendanceEnabled ? 'translate-x-6' : ''
              }`}></div>
            </div>
            <div className="ml-3 text-sm">
              <span className={`font-medium ${formData.gateAttendanceEnabled ? 'text-blue-600' : 'text-gray-500'}`}>
                {formData.gateAttendanceEnabled ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-600 mt-2">
            Aktifkan sistem check-in/check-out siswa di gerbang sekolah untuk monitoring keluar-masuk
          </p>
        </div>

        {formData.gateAttendanceEnabled && (
          <div className="space-y-3 pl-4 border-l-2 border-blue-300">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="gateQREnabled"
                checked={formData.gateQREnabled !== false} // default true
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                📱 QR Code Scan (Siswa scan QR untuk check-in/out)
              </span>
            </label>

            <label className="flex items-center cursor-pointer opacity-50 cursor-not-allowed">
              <input
                type="checkbox"
                name="gateFaceEnabled"
                checked={formData.gateFaceEnabled || false}
                onChange={handleChange}
                disabled
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-500">
                👤 Face Recognition (Coming Soon)
              </span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="gateManualEnabled"
                checked={formData.gateManualEnabled !== false} // default true
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                ✍️ Manual Input (Admin/Staff input manual)
              </span>
            </label>

            <hr className="my-3 border-blue-200" />

            {/* Phase 2: Time Rules */}
            <div className="bg-blue-50 p-3 rounded-lg space-y-3">
              <h4 className="text-xs font-semibold text-blue-900 mb-2">⏰ Aturan Waktu</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Batas Terlambat</label>
                  <input
                    type="time"
                    name="gateLateThreshold"
                    value={formData.gateLateThreshold}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 07:30</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Check-in Mulai</label>
                  <input
                    type="time"
                    name="gateCheckInStart"
                    value={formData.gateCheckInStart}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Check-in Sampai</label>
                  <input
                    type="time"
                    name="gateCheckInEnd"
                    value={formData.gateCheckInEnd}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Check-out Mulai</label>
                  <input
                    type="time"
                    name="gateCheckOutStart"
                    value={formData.gateCheckOutStart}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Phase 2: Notification Settings */}
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <h4 className="text-xs font-semibold text-blue-900 mb-2">🔔 Notifikasi Orang Tua</h4>
              
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="gateNotifyParents"
                  checked={formData.gateNotifyParents !== false}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-xs text-gray-700">
                  Kirim notifikasi saat check-in/out
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="gateNotifyOnLate"
                  checked={formData.gateNotifyOnLate !== false}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-xs text-gray-700">
                  Kirim notifikasi khusus saat terlambat
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default SchoolForm;