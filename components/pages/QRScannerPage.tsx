/**
 * QR Scanner - Students scan QR code to check in
 */

import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import { logger } from '../../utils/logger';

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<Array<{
    className: string;
    subjectName: string;
    timestamp: string;
    status: string;
  }>>([]);

  useEffect(() => {
    loadRecentCheckIns();
    return () => {
      // Cleanup scanner on unmount
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  async function loadRecentCheckIns() {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('qr_check_ins')
        .select(`
          *,
          qr_attendance_sessions!inner(
            classes(name),
            subjects(name)
          )
        `)
        .eq('student_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        className: item.qr_attendance_sessions?.classes?.name || 'Unknown',
        subjectName: item.qr_attendance_sessions?.subjects?.name || 'Unknown',
        timestamp: new Date(item.timestamp).toLocaleString('id-ID'),
        status: item.status === 'on-time' ? 'Tepat Waktu' : item.status === 'late' ? 'Terlambat' : 'Lebih Awal',
      }));

      setRecentCheckIns(formatted);
    } catch (error) {
      logger.error('Failed to load recent check-ins', error);
    }
  }

  async function startScanner() {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      setScanner(html5QrCode);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => {} // onScanFailure - ignore
      );

      setScanning(true);
      toast.success('Scanner aktif');
    } catch (error) {
      logger.error('Failed to start scanner', error);
      toast.error('Gagal mengaktifkan kamera: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async function stopScanner() {
    if (scanner) {
      try {
        await scanner.stop();
        setScanning(false);
        toast.success('Scanner dihentikan');
      } catch (error) {
        logger.error('Failed to stop scanner', error);
      }
    }
  }

  async function onScanSuccess(decodedText: string) {
    try {
      // Parse QR data
      const qrData = JSON.parse(decodedText);
      const { sessionId, classId, subjectId, validUntil } = qrData;

      // Validate expiry
      if (new Date(validUntil) < new Date()) {
        toast.error('QR Code sudah kadaluarsa');
        return;
      }

      // Get current position if geolocation is required
      const session = await getSession(sessionId);
      if (session?.location) {
        const position = await getCurrentPosition();
        const distance = calculateDistance(
          session.location.latitude,
          session.location.longitude,
          position.coords.latitude,
          position.coords.longitude
        );

        if (distance > session.location.radius) {
          toast.error(`Anda terlalu jauh dari lokasi (${Math.round(distance)}m dari ${session.location.radius}m)`);
          return;
        }
      }

      // Submit check-in
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      const now = new Date();
      const sessionStart = new Date(session!.startTime);
      const timeDiff = now.getTime() - sessionStart.getTime();
      let status: 'early' | 'on-time' | 'late' = 'on-time';

      if (timeDiff < 0) status = 'early';
      else if (timeDiff > 10 * 60 * 1000) status = 'late'; // 10 minutes grace period

      const location = session?.location ? {
        latitude: (await getCurrentPosition()).coords.latitude,
        longitude: (await getCurrentPosition()).coords.longitude,
      } : undefined;

      const { error } = await supabase.from('qr_check_ins').insert({
        session_id: sessionId,
        student_id: user.id,
        timestamp: now.toISOString(),
        location,
        status,
      });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('Anda sudah absen untuk sesi ini');
        } else {
          throw error;
        }
        return;
      }

      // Also create attendance record
      await supabase.from('attendance').insert({
        date: now.toISOString().split('T')[0],
        student_id: user.id,
        class_id: classId,
        subject_id: subjectId,
        teacher_id: session!.teacherId,
        status: status === 'late' ? 'Terlambat' : 'Hadir',
      });

      toast.success(`Absensi berhasil! ${status === 'on-time' ? 'Tepat waktu ✅' : status === 'late' ? 'Terlambat ⚠️' : 'Lebih awal 🎉'}`);
      
      // Stop scanner after successful scan
      stopScanner();
      
      // Reload recent check-ins
      loadRecentCheckIns();
    } catch (error) {
      logger.error('QR scan error', error);
      if (error instanceof SyntaxError) {
        toast.error('QR Code tidak valid');
      } else {
        toast.error('Gagal absen: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  }

  async function getSession(sessionId: string) {
    const { data, error } = await supabase
      .from('qr_attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
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

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Scan QR Absensi</h2>

      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div id="qr-reader" className="mb-4" style={{ display: scanning ? 'block' : 'none' }}></div>

          {!scanning ? (
            <button
              onClick={startScanner}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded"
            >
              📷 Mulai Scan QR Code
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded"
            >
              ⛔ Hentikan Scanner
            </button>
          )}

          <div className="mt-4 text-sm text-gray-400 text-center">
            {scanning ? (
              <p>Arahkan kamera ke QR Code yang ditampilkan guru</p>
            ) : (
              <p>Klik tombol di atas untuk memulai scan</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Riwayat Absensi QR</h3>
          {recentCheckIns.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada riwayat absensi QR</p>
          ) : (
            <div className="space-y-3">
              {recentCheckIns.map((checkIn, idx) => (
                <div key={idx} className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-semibold">{checkIn.className}</p>
                      <p className="text-sm text-gray-400">{checkIn.subjectName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      checkIn.status === 'Tepat Waktu' ? 'bg-green-600' : 
                      checkIn.status === 'Terlambat' ? 'bg-yellow-600' : 'bg-blue-600'
                    }`}>
                      {checkIn.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{checkIn.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
