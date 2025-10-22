/**
 * QR Attendance Page - Teacher creates QR sessions for classes
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { logger } from '../../utils/logger';
import type { Class, Subject, QRAttendanceSession } from '../../types';

export default function QRAttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [duration, setDuration] = useState(30); // minutes
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [radius, setRadius] = useState(100); // meters
  const [currentSession, setCurrentSession] = useState<QRAttendanceSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [attendees, setAttendees] = useState<Array<{ studentName: string; timestamp: string; status: string }>>([]);

  useEffect(() => {
    loadClasses();
    loadSubjects();
  }, []);

  async function loadClasses() {
    try {
      const { data, error } = await supabase.from('classes').select('*');
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      logger.error('Failed to load classes', error);
      toast.error('Gagal memuat kelas');
    }
  }

  async function loadSubjects() {
    try {
      const { data, error } = await supabase.from('subjects').select('*');
      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      logger.error('Failed to load subjects', error);
      toast.error('Gagal memuat mata pelajaran');
    }
  }

  async function generateQRSession() {
    if (!selectedClass || !selectedSubject) {
      toast.error('Pilih kelas dan mata pelajaran');
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + duration * 60 * 1000);
      
      // Generate unique session ID
      const sessionId = `qr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      let location = undefined;
      if (useGeolocation) {
        const position = await getCurrentPosition();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius,
        };
      }

      const session: QRAttendanceSession = {
        id: sessionId,
        classId: selectedClass,
        subjectId: selectedSubject,
        teacherId: user.id,
        date: now.toISOString().split('T')[0],
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
        qrCode: sessionId, // The session ID is embedded in QR
        location,
      };

      // Save session to database
      const { error } = await supabase.from('qr_attendance_sessions').insert(session);
      if (error) throw error;

      setCurrentSession(session);

      // Generate QR code
      const qrData = JSON.stringify({
        sessionId: session.id,
        classId: session.classId,
        subjectId: session.subjectId,
        validUntil: session.endTime,
      });

      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrDataUrl(qrUrl);
      toast.success('QR Code berhasil dibuat!');

      // Start polling for attendees
      pollAttendees(sessionId);
    } catch (error) {
      logger.error('Failed to generate QR session', error);
      toast.error('Gagal membuat sesi QR: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });
  }

  async function pollAttendees(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('qr_check_ins')
        .select(`
          *,
          profiles:student_id (name)
        `)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedAttendees = (data || []).map((item: any) => ({
        studentName: item.profiles?.name || 'Unknown',
        timestamp: new Date(item.timestamp).toLocaleTimeString('id-ID'),
        status: item.status === 'on-time' ? 'Tepat Waktu' : item.status === 'late' ? 'Terlambat' : 'Lebih Awal',
      }));

      setAttendees(formattedAttendees);
    } catch (error) {
      logger.error('Failed to poll attendees', error);
    }
  }

  function endSession() {
    setCurrentSession(null);
    setQrDataUrl('');
    setAttendees([]);
    toast.success('Sesi absensi ditutup');
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">QR Attendance</h2>

      {!currentSession ? (
        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Buat Sesi Absensi Baru</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              >
                <option value="">Pilih Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Mata Pelajaran</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Durasi (menit)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 rounded"
                min="5"
                max="180"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useGeo"
                checked={useGeolocation}
                onChange={(e) => setUseGeolocation(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="useGeo" className="text-sm">
                Gunakan validasi lokasi (GPS)
              </label>
            </div>

            {useGeolocation && (
              <div>
                <label className="block text-sm mb-2">Radius Toleransi (meter)</label>
                <input
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 rounded"
                  min="10"
                  max="1000"
                />
              </div>
            )}

            <button
              onClick={generateQRSession}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded"
            >
              Generate QR Code
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Sesi Aktif</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                {qrDataUrl && (
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={qrDataUrl} alt="QR Code" className="w-80 h-80" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-2">Kelas: {classes.find(c => c.id === currentSession.classId)?.name}</p>
                <p className="text-sm text-gray-400 mb-2">Mata Pelajaran: {subjects.find(s => s.id === currentSession.subjectId)?.name}</p>
                <p className="text-sm text-gray-400 mb-2">Berlaku sampai: {new Date(currentSession.endTime).toLocaleTimeString('id-ID')}</p>
                {currentSession.location && (
                  <p className="text-sm text-gray-400 mb-4">📍 Validasi lokasi aktif (radius {currentSession.location.radius}m)</p>
                )}
                <button
                  onClick={endSession}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded"
                >
                  Tutup Sesi
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Siswa yang Sudah Absen ({attendees.length})</h3>
            {attendees.length === 0 ? (
              <p className="text-gray-400 text-sm">Belum ada siswa yang absen</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3 text-left">Nama</th>
                      <th className="p-3 text-left">Waktu</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((attendee, idx) => (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="p-3">{attendee.studentName}</td>
                        <td className="p-3">{attendee.timestamp}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            attendee.status === 'Tepat Waktu' ? 'bg-green-600' : 
                            attendee.status === 'Terlambat' ? 'bg-yellow-600' : 'bg-blue-600'
                          }`}>
                            {attendee.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={() => pollAttendees(currentSession.id)}
              className="mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
