import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { dataService } from '../../services/dataService';
import toast from 'react-hot-toast';
import { User } from '../../types';

interface NFCTapPageProps {
  user: User;
}

interface TapLog {
  id: string;
  card_uid: string;
  student_name: string;
  tap_time: string;
  tap_type: string;
  success: boolean;
  failure_reason: string | null;
  gate_device_id: string;
}

export const NFCTapPage: React.FC<NFCTapPageProps> = ({ user }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastTap, setLastTap] = useState<TapLog | null>(null);
  const [recentTaps, setRecentTaps] = useState<TapLog[]>([]);
  const [deviceId] = useState(`NFC_${Math.random().toString(36).substr(2, 9)}`);
  const [nfcSupported, setNfcSupported] = useState(true);

  useEffect(() => {
    // Check NFC support
    if (!('NDEFReader' in window)) {
      setNfcSupported(false);
      toast.error('Browser Anda tidak mendukung Web NFC API');
    }

    fetchRecentTaps();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('nfc_taps')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'gate_tap_logs' },
        (payload) => {
          console.log('New tap detected:', payload);
          fetchRecentTaps();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRecentTaps = async () => {
    try {
      const { data, error } = await supabase
        .from('gate_tap_logs')
        .select(`
          *,
          profiles!student_id(full_name)
        `)
        .eq('school_id', user.schoolId)
        .order('tap_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formatted = data?.map((log: any) => ({
        id: log.id,
        card_uid: log.card_uid,
        student_name: log.profiles?.full_name || 'Unknown',
        tap_time: log.tap_time,
        tap_type: log.tap_type,
        success: log.success,
        failure_reason: log.failure_reason,
        gate_device_id: log.gate_device_id
      })) || [];

      setRecentTaps(formatted);
    } catch (error: any) {
      console.error('Error fetching taps:', error);
    }
  };

  const startNFCScanning = async () => {
    if (!nfcSupported) {
      toast.error('NFC tidak didukung pada perangkat ini');
      return;
    }

    try {
      setIsScanning(true);
      
      // @ts-ignore - Web NFC API not yet in TypeScript definitions
      const ndef = new NDEFReader();
      
      await ndef.scan();
      
      toast.success('✓ Siap scan kartu NFC!');

      // @ts-ignore
      ndef.addEventListener('reading', async ({ message, serialNumber }) => {
        console.log('NFC Card detected:', serialNumber);
        
        const cardUID = serialNumber.toUpperCase().replace(/:/g, '');
        
        // Visual feedback
        navigator.vibrate?.(200); // Vibrate if supported
        
        // Record tap
        await recordTap(cardUID);
      });

      // @ts-ignore
      ndef.addEventListener('readingerror', () => {
        toast.error('Gagal membaca kartu NFC');
      });

    } catch (error: any) {
      console.error('NFC Error:', error);
      setIsScanning(false);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Izin NFC ditolak. Aktifkan di pengaturan browser.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('NFC tidak didukung pada perangkat ini');
        setNfcSupported(false);
      } else {
        toast.error('Gagal memulai NFC scan: ' + error.message);
      }
    }
  };

  const stopNFCScanning = () => {
    setIsScanning(false);
    toast.error('⏹️ Scanning dihentikan');
  };

  const recordTap = async (cardUID: string) => {
    try {
      const { data, error} = await supabase
        .rpc('record_gate_tap', {
          p_card_uid: cardUID,
          p_gate_device_id: deviceId,
          p_school_id: user.schoolId
        });

      if (error) throw error;

      console.log('Tap response:', data);

      if (data?.success) {
        // Success feedback
        toast.success(data.message);

        // Play success sound (optional)
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ0PVqzn77BfGQdBnN7vwW0iCCp+y/LLdyoGI3fD8dyOPwoRYbXp7KdUEwlKn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ0PVqzn77BfGQdBnN7vwW0iCCp+y/LLdyoGI3fD8dyOPwoRYbXp7KdUEwlKn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ0PVqzn77BfGQdBnN7vwW0iCCp+y/LLdyoGI3fD8dyOPwoRYbXp7KdUEwlKn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ0PVqzn77BfGQdBnN7vwW0iCCp+y/LLdyoGI3fD8dyOPwoRYbXp7KdUEwlKn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ0PVqzn77BfGQdBnN7vwW0iCCp+y/LLdyoGI3fD8dyOPwoRYbXp7KdUEwlKn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ0PVqzn77BfGQdBnN7vwW0iCCp+y/LLdyoGI3fD8dyOPwoRYbXp7KdUEw==');
        audio.play().catch(() => {});

        setLastTap({
          id: Math.random().toString(),
          card_uid: cardUID,
          student_name: data.student_name || 'Unknown',
          tap_time: new Date().toISOString(),
          tap_type: data.tap_type,
          success: true,
          failure_reason: null,
          gate_device_id: deviceId
        });

        fetchRecentTaps();
      } else {
        // Error feedback
        toast.error(data?.message || 'Gagal mencatat tap');

        // Play error sound (optional)
        const audio = new Audio('data:audio/wav;base64,UklGRhQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfACAAD/////AgD9/wEAAAAAAAQA+f8DAPX/BgD6/wIA/v////8AAAAA/P8EAPr/AwD8////AQD+/wAA/v8BAAAAAAD//wAA//8AAP//AAACAP7/AgD9/wIA/f8BAAAA');
        audio.play().catch(() => {});

        setLastTap({
          id: Math.random().toString(),
          card_uid: cardUID,
          student_name: 'Error',
          tap_time: new Date().toISOString(),
          tap_type: 'error',
          success: false,
          failure_reason: data?.message || 'Unknown error',
          gate_device_id: deviceId
        });
      }
    } catch (error: any) {
      console.error('Error recording tap:', error);
      toast.error('Terjadi kesalahan sistem');
    }
  };

  const getStatusColor = (success: boolean) => {
    return success 
      ? 'bg-green-500/20 border-green-500/40 text-green-400'
      : 'bg-red-500/20 border-red-500/40 text-red-400';
  };

  const getTapTypeText = (tapType: string) => {
    switch (tapType) {
      case 'check_in': return '📥 Check-in';
      case 'check_out': return '📤 Check-out';
      default: return '❓ Unknown';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          NFC Tap - Absensi Gerbang
        </h1>
        <p className="text-gray-300 mt-2">Gunakan smartphone untuk scan kartu NFC siswa</p>
      </div>

      {/* NFC Scanner Card */}
      <div className="max-w-md mx-auto">
        <div className={`rounded-2xl p-8 text-center transition-all duration-300 shadow-xl ${
          isScanning 
            ? 'bg-gradient-to-br from-green-600 to-blue-600 border-4 border-green-400 animate-pulse' 
            : 'bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600'
        }`}>
          <div className="text-7xl mb-4">
            {isScanning ? '📱' : '📲'}
          </div>
          
          {!nfcSupported ? (
            <div className="space-y-4">
              <p className="text-red-300 font-bold text-xl">❌ NFC Tidak Didukung</p>
              <p className="text-sm text-gray-200">
                Browser atau perangkat Anda tidak mendukung Web NFC API.
                <br/>
                Gunakan Chrome/Edge di Android untuk fitur ini.
              </p>
            </div>
          ) : isScanning ? (
            <div className="space-y-4">
              <p className="text-white font-bold text-2xl drop-shadow-lg">✓ Siap Scan!</p>
              <p className="text-white font-medium text-lg">Dekatkan kartu NFC ke smartphone Anda</p>
              <button
                onClick={stopNFCScanning}
                className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold shadow-lg"
              >
                ⏹️ Stop Scanning
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-white font-semibold text-lg">Mulai Scan Kartu NFC</p>
              <button
                onClick={startNFCScanning}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl hover:from-blue-700 hover:to-green-700 transition-all shadow-xl transform hover:scale-105 font-bold text-lg"
              >
                🚀 Mulai Scanning
              </button>
              <p className="text-xs text-gray-300 font-medium">
                Pastikan NFC aktif di pengaturan smartphone
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Last Tap Result */}
      {lastTap && (
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-bold text-white mb-3">Tap Terakhir:</h3>
          <div className={`border-2 rounded-xl p-6 shadow-lg ${getStatusColor(lastTap.success)}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold">
                {lastTap.success ? '✅' : '❌'}
              </span>
              <span className="text-sm font-medium opacity-90">
                {new Date(lastTap.tap_time).toLocaleTimeString('id-ID')}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium opacity-90">Siswa:</span>
                <span className="font-bold">{lastTap.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium opacity-90">UID Kartu:</span>
                <span className="font-mono font-bold">{lastTap.card_uid}</span>
              </div>
              {lastTap.success && (
                <div className="flex justify-between">
                  <span className="font-medium opacity-90">Tipe:</span>
                  <span className="font-bold">{getTapTypeText(lastTap.tap_type)}</span>
                </div>
              )}
              {!lastTap.success && lastTap.failure_reason && (
                <div className="mt-3 p-3 bg-black/30 rounded-lg border border-red-500/30">
                  <p className="text-xs font-medium opacity-90">Alasan Error:</p>
                  <p className="font-bold">{lastTap.failure_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Taps */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-white mb-3">Riwayat Tap Terbaru:</h3>
        <div className="bg-gray-800/80 border border-gray-600 rounded-xl overflow-hidden shadow-lg">
          {recentTaps.length === 0 ? (
            <div className="text-center py-12 text-gray-300 font-medium">
              Belum ada riwayat tap
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase">Siswa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase">UID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase">Tipe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {recentTaps.map((tap) => (
                    <tr key={tap.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-200">
                        {new Date(tap.tap_time).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-semibold">
                        {tap.student_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-purple-300 font-mono font-semibold">
                        {tap.card_uid}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200 font-medium">
                        {tap.success ? getTapTypeText(tap.tap_type) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${tap.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {tap.success ? '✓ Sukses' : '✗ Gagal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="max-w-md mx-auto bg-blue-600/80 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
        <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <span>ℹ️</span> Cara Menggunakan:
        </h4>
        <ol className="text-sm text-white space-y-2 list-decimal list-inside font-medium">
          <li>Pastikan NFC aktif di smartphone Android Anda</li>
          <li>Gunakan browser Chrome atau Edge</li>
          <li>Klik "Mulai Scanning" dan izinkan akses NFC</li>
          <li>Dekatkan kartu NFC siswa ke bagian belakang smartphone</li>
          <li>Sistem akan otomatis mencatat absensi</li>
        </ol>
      </div>

      {/* Device ID */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Device ID: <span className="font-mono text-gray-400">{deviceId}</span>
        </p>
      </div>
    </div>
  );
};
