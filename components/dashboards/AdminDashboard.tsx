import React, { useState, useEffect } from 'react';
import { User, School } from '../../types';
import Card from '../Card';
import { supabase } from '../../services/supabaseClient';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';

interface AdminDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onNavigate }) => {
    const [stats, setStats] = useState({ schools: 0, users: 0, students: 0 });
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch school count and data
                const { data: schoolData, error: schoolError } = await supabase
                    .from('schools')
                    .select('*');
                if (schoolError) throw schoolError;
                setSchools(schoolData || []);

                // Fetch user counts
                const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });
                if (userError) throw userError;

                const { count: studentCount, error: studentError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'Siswa');
                if (studentError) throw studentError;
                
                setStats({
                    schools: schoolData?.length || 0,
                    users: userCount || 0,
                    students: studentCount || 0,
                });

            } catch (error) {
                console.error("Error fetching admin dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Selamat Datang, {user.name}!</h2>
            <p className="text-gray-600 mb-8">Ini adalah ringkasan sistem SIAKAD Yayasan Fathus Salafi dari data live.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-brand-600 text-white">
                    <div className="flex items-center">
                        <BuildingLibraryIcon className="h-10 w-10 mr-4"/>
                        <div>
                            <p className="text-lg font-medium">Total Sekolah</p>
                            <p className="text-4xl font-bold">{isLoading ? '...' : stats.schools}</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                     <div className="flex items-center">
                        <UserGroupIcon className="h-10 w-10 mr-4"/>
                        <div>
                            <p className="text-lg font-medium">Total Pengguna</p>
                            <p className="text-4xl font-bold">{isLoading ? '...' : stats.users}</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center">
                        <ChartBarIcon className="h-10 w-10 mr-4"/>
                        <div>
                            <p className="text-lg font-medium">Total Siswa</p>
                            <p className="text-4xl font-bold">{isLoading ? '...' : stats.students}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Daftar Sekolah">
                    {isLoading ? <p>Loading...</p> : (
                        <ul className="space-y-3">
                            {schools.map(school => (
                                <li key={school.id} className="p-3 rounded-lg bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">{school.name}</p>
                                        <p className="text-sm text-gray-500">{school.address}</p>
                                    </div>
                                    <span className="text-xs font-bold bg-brand-100 text-brand-800 px-2 py-1 rounded-full">{school.level}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
                <Card title="Akses Cepat">
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onNavigate('Kelola Sekolah')} className="p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Kelola Sekolah</button>
                        <button onClick={() => onNavigate('Kelola Pengguna')} className="p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Kelola Pengguna</button>
                        <button onClick={() => onNavigate('Pengaturan Sistem')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800 font-semibold transition-colors">Pengaturan Sistem</button>
                        <button onClick={() => onNavigate('Pengumuman')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800 font-semibold transition-colors">Buat Pengumuman</button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;