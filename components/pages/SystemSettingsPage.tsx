import React, { useState } from 'react';
import Card from '../Card';
import ToggleSwitch from '../ui/ToggleSwitch';
import CogIcon from '../icons/CogIcon';
import LockClosedIcon from '../icons/LockClosedIcon';
import BellIcon from '../icons/BellIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';

type SettingsTab = 'general' | 'security' | 'notifications' | 'database';

const SystemSettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // General Settings
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [allowRegistrations, setAllowRegistrations] = useState(true);
    const [systemName, setSystemName] = useState('SIAKAD Fatsal');
    const [maxUploadSize, setMaxUploadSize] = useState('10');
    
    // Security Settings
    const [requireEmailVerification, setRequireEmailVerification] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState('30');
    const [passwordMinLength, setPasswordMinLength] = useState('6');
    const [enableTwoFactor, setEnableTwoFactor] = useState(false);
    
    // Notification Settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [notifyOnNewUser, setNotifyOnNewUser] = useState(true);
    const [notifyOnGradeUpdate, setNotifyOnGradeUpdate] = useState(true);
    
    // Database Settings
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupFrequency, setBackupFrequency] = useState('daily');
    const [retentionDays, setRetentionDays] = useState('30');

    const handleSave = async () => {
        setIsSaving(true);
        setSuccessMessage('');
        
        try {
            // TODO: Implement actual save logic
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setSuccessMessage('Pengaturan berhasil disimpan!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'general' as const, label: 'Umum', icon: <CogIcon className="h-5 w-5" /> },
        { id: 'security' as const, label: 'Keamanan', icon: <LockClosedIcon className="h-5 w-5" /> },
        { id: 'notifications' as const, label: 'Notifikasi', icon: <BellIcon className="h-5 w-5" /> },
        { id: 'database' as const, label: 'Database', icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
    ];

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Pengaturan Sistem</h1>
                <p className="text-sm text-gray-600 mt-1">Kelola konfigurasi dan preferensi sistem</p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                    <p className="text-green-800 font-medium">{successMessage}</p>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Mobile: Dropdown */}
                <div className="lg:hidden border-b border-gray-200">
                    <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
                        className="w-full px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        {tabs.map(tab => (
                            <option key={tab.id} value={tab.id}>{tab.label}</option>
                        ))}
                    </select>
                </div>

                {/* Desktop: Tabs */}
                <div className="hidden lg:flex border-b border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                                activeTab === tab.id
                                    ? 'text-brand-600 border-b-2 border-brand-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4 lg:p-6">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama Sistem
                                </label>
                                <input
                                    type="text"
                                    value={systemName}
                                    onChange={(e) => setSystemName(e.target.value)}
                                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Nama yang ditampilkan di seluruh aplikasi</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ukuran Maksimal Upload (MB)
                                </label>
                                <input
                                    type="number"
                                    value={maxUploadSize}
                                    onChange={(e) => setMaxUploadSize(e.target.value)}
                                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Batasan ukuran file untuk upload dokumen</p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Mode Perawatan</h4>
                                    <p className="text-sm text-gray-600 mt-1">Jika aktif, hanya admin yang dapat mengakses sistem</p>
                                </div>
                                <ToggleSwitch enabled={maintenanceMode} onChange={setMaintenanceMode} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Izinkan Pendaftaran Siswa Baru</h4>
                                    <p className="text-sm text-gray-600 mt-1">Kontrol apakah portal pendaftaran siswa baru dibuka</p>
                                </div>
                                <ToggleSwitch enabled={allowRegistrations} onChange={setAllowRegistrations} />
                            </div>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timeout Sesi (menit)
                                </label>
                                <input
                                    type="number"
                                    value={sessionTimeout}
                                    onChange={(e) => setSessionTimeout(e.target.value)}
                                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Durasi inaktivitas sebelum user logout otomatis</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Panjang Minimal Password
                                </label>
                                <input
                                    type="number"
                                    value={passwordMinLength}
                                    onChange={(e) => setPasswordMinLength(e.target.value)}
                                    min="6"
                                    max="20"
                                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum karakter untuk password pengguna</p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Verifikasi Email Wajib</h4>
                                    <p className="text-sm text-gray-600 mt-1">User harus verifikasi email sebelum login</p>
                                </div>
                                <ToggleSwitch enabled={requireEmailVerification} onChange={setRequireEmailVerification} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Autentikasi 2 Faktor</h4>
                                    <p className="text-sm text-gray-600 mt-1">Tambahan keamanan dengan OTP/SMS</p>
                                </div>
                                <ToggleSwitch enabled={enableTwoFactor} onChange={setEnableTwoFactor} />
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Notifikasi Email</h4>
                                    <p className="text-sm text-gray-600 mt-1">Kirim notifikasi penting via email</p>
                                </div>
                                <ToggleSwitch enabled={emailNotifications} onChange={setEmailNotifications} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Push Notifications</h4>
                                    <p className="text-sm text-gray-600 mt-1">Notifikasi real-time di aplikasi</p>
                                </div>
                                <ToggleSwitch enabled={pushNotifications} onChange={setPushNotifications} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Notifikasi Pengguna Baru</h4>
                                    <p className="text-sm text-gray-600 mt-1">Beritahu admin saat ada user baru</p>
                                </div>
                                <ToggleSwitch enabled={notifyOnNewUser} onChange={setNotifyOnNewUser} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Notifikasi Update Nilai</h4>
                                    <p className="text-sm text-gray-600 mt-1">Beritahu siswa/ortu saat nilai diupdate</p>
                                </div>
                                <ToggleSwitch enabled={notifyOnGradeUpdate} onChange={setNotifyOnGradeUpdate} />
                            </div>
                        </div>
                    )}

                    {/* Database Settings */}
                    {activeTab === 'database' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    ⚠️ Pengaturan database memerlukan akses administrator. Perubahan dapat mempengaruhi performa sistem.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Frekuensi Backup
                                </label>
                                <select
                                    value={backupFrequency}
                                    onChange={(e) => setBackupFrequency(e.target.value)}
                                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                >
                                    <option value="hourly">Setiap Jam</option>
                                    <option value="daily">Harian</option>
                                    <option value="weekly">Mingguan</option>
                                    <option value="monthly">Bulanan</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Seberapa sering backup otomatis dilakukan</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Retensi Backup (hari)
                                </label>
                                <input
                                    type="number"
                                    value={retentionDays}
                                    onChange={(e) => setRetentionDays(e.target.value)}
                                    min="7"
                                    max="365"
                                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Berapa lama backup disimpan sebelum dihapus otomatis</p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Backup Otomatis</h4>
                                    <p className="text-sm text-gray-600 mt-1">Aktifkan backup database secara otomatis</p>
                                </div>
                                <ToggleSwitch enabled={autoBackup} onChange={setAutoBackup} />
                            </div>

                            <div className="flex gap-3">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Backup Sekarang
                                </button>
                                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                                    Restore Database
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button (Sticky on Mobile) */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettingsPage;
