
import React, { useState } from 'react';
import Card from '../Card';
import { User } from '../../types';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { authService } from '../../services/authService';

interface ProfileSettingsPageProps {
  user: User;
}

const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ user }) => {
    const [name, setName] = useState(user.name);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    
    const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileMessage(null);
        try {
            await dataService.updateUser(user.id, { name: name });
            setProfileMessage({ type: 'success', text: 'Informasi profil berhasil diperbarui.'});
            // Note: In a real app, you'd also need to update the user state in App.tsx
        } catch (error: any) {
            setProfileMessage({ type: 'error', text: `Gagal menyimpan: ${error.message}`});
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
             setPasswordMessage({ type: 'error', text: 'Kata sandi minimal harus 6 karakter.'});
             return;
        }
        if (password !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.'});
            return;
        }
        setIsSavingPassword(true);
        setPasswordMessage(null);
        try {
            await authService.updatePassword(password);
            setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diubah.'});
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: `Gagal mengubah kata sandi: ${error.message}`});
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Akun</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Informasi Profil">
                    <form onSubmit={handleProfileSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Nomor Induk</label>
                            <input
                                type="text"
                                value={user.identityNumber}
                                disabled
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                             <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400"
                            >
                                {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                            {profileMessage && (
                                <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {profileMessage.text}
                                </p>
                            )}
                        </div>
                    </form>
                </Card>
                 <Card title="Ubah Kata Sandi">
                     <form onSubmit={handlePasswordSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kata Sandi Baru</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="Minimal 6 karakter"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Konfirmasi Kata Sandi Baru</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                         <div className="flex items-center justify-between pt-2">
                             <button
                                type="submit"
                                disabled={isSavingPassword}
                                className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400"
                            >
                                {isSavingPassword ? 'Menyimpan...' : 'Ubah Kata Sandi'}
                            </button>
                             {passwordMessage && (
                                <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {passwordMessage.text}
                                </p>
                            )}
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;
