import React, { useState } from 'react';
import Card from '../Card';
import ToggleSwitch from '../ui/ToggleSwitch';

const SystemSettingsPage: React.FC = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [allowRegistrations, setAllowRegistrations] = useState(true);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Sistem</h2>
            <Card title="Pengaturan Umum">
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                            <h4 className="font-semibold">Mode Perawatan</h4>
                            <p className="text-sm text-gray-600">Jika aktif, hanya admin yang dapat mengakses sistem.</p>
                        </div>
                        <ToggleSwitch enabled={maintenanceMode} onChange={setMaintenanceMode} />
                    </div>
                     <div className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                            <h4 className="font-semibold">Izinkan Pendaftaran Siswa Baru</h4>
                            <p className="text-sm text-gray-600">Mengontrol apakah portal pendaftaran siswa baru dibuka.</p>
                        </div>
                        <ToggleSwitch enabled={allowRegistrations} onChange={setAllowRegistrations} />
                    </div>
                </div>
                <div className="mt-6 text-right">
                     <button className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                        Simpan Pengaturan
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default SystemSettingsPage;
