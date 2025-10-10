// FIX: Implemented the ManageSchoolsPage component which was a placeholder, resolving "not a module" errors.
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { School } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';

const ManageSchoolsPage: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchools = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase.from('schools').select('*');
                if (error) {
                    throw error;
                }
                setSchools(data || []);
            } catch (err: any) {
                console.error("Error fetching schools:", err);
                setError("Gagal memuat data sekolah. Pastikan RLS sudah diatur dengan benar.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSchools();
    }, []);
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kelola Sekolah</h2>
            <Card>
                 <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <BuildingLibraryIcon className="h-6 w-6 mr-3 text-brand-600" />
                        Semua Sekolah (Live Data)
                    </h3>
                    <button className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                        Tambah Sekolah Baru
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <p className="p-4 text-center">Memuat data sekolah dari Supabase...</p>
                    ) : error ? (
                        <p className="p-4 text-center text-red-600">{error}</p>
                    ) : (
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Nama Sekolah</th>
                                    <th scope="col" className="px-6 py-3">Jenjang</th>
                                    <th scope="col" className="px-6 py-3">Alamat</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Aksi</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.map(school => (
                                    <tr key={school.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{school.name}</td>
                                        <td className="px-6 py-4">
                                             <span className="text-xs font-bold bg-brand-100 text-brand-800 px-2 py-1 rounded-full">{school.level}</span>
                                        </td>
                                        <td className="px-6 py-4">{school.address}</td>
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

export default ManageSchoolsPage;