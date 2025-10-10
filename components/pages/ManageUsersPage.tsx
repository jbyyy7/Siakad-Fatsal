// FIX: Implemented the ManageUsersPage component which was a placeholder, resolving "not a module" errors.
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { User, UserRole } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { UserGroupIcon } from '../icons/UserGroupIcon';

const ManageUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select(`
                        *,
                        schools ( name )
                    `);

                if (error) {
                    throw error;
                }
                
                // Map Supabase data to our User type
                const mappedUsers: User[] = data.map(profile => ({
                    id: profile.id,
                    email: '', // Email is on auth.users, not easily accessible from client-side for a list
                    username: profile.username || '-',
                    name: profile.full_name,
                    role: profile.role,
                    avatarUrl: profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`,
                    schoolId: profile.school_id,
                    schoolName: (profile.schools as any)?.name || '-',
                }));

                setUsers(mappedUsers);

            } catch (err: any) {
                console.error("Error fetching users:", err);
                setError("Gagal memuat data pengguna. Pastikan RLS sudah diatur dengan benar.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kelola Pengguna</h2>
            <Card>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <UserGroupIcon className="h-6 w-6 mr-3 text-brand-600" />
                        Semua Pengguna (Live Data)
                    </h3>
                    <button className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                        Tambah Pengguna Baru
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <p className="p-4 text-center">Memuat data pengguna dari Supabase...</p>
                    ) : error ? (
                         <p className="p-4 text-center text-red-600">{error}</p>
                    ) : (
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Nama</th>
                                    <th scope="col" className="px-6 py-3">Username</th>
                                    <th scope="col" className="px-6 py-3">Peran</th>
                                    <th scope="col" className="px-6 py-3">Sekolah</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Aksi</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full mr-3"/>
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{user.username}</td>
                                        <td className="px-6 py-4">{user.role}</td>
                                        <td className="px-6 py-4">{user.schoolName || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <a href="#" className="font-medium text-brand-600 hover:underline">Edit</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ManageUsersPage;