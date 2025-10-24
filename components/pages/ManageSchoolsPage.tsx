
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { School } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import SchoolForm from '../forms/SchoolForm';

const ManageSchoolsPage: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    
    // Calculate stats
    const sdCount = schools.filter(s => s.level === 'SD').length;
    const smpCount = schools.filter(s => s.level === 'SMP').length;
    const smaCount = schools.filter(s => s.level === 'SMA/SMK').length;

    const fetchSchools = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await dataService.getSchools();
            setSchools(data);
        } catch (err) {
            const errorMessage = 'Gagal memuat data sekolah';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const openModal = (school: School | null = null) => {
        setSelectedSchool(school);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSchool(null);
    };
    
    const handleSaveSchool = async (formData: Omit<School, 'id'>) => {
        try {
            if (selectedSchool) {
                await dataService.updateSchool(selectedSchool.id, formData);
                toast.success('Sekolah berhasil diperbarui');
            } else {
                await dataService.createSchool(formData);
                toast.success('Sekolah berhasil ditambahkan');
            }
            fetchSchools();
            closeModal();
        } catch (error: any) {
             console.error('Failed to save school:', error);
             toast.error(`Gagal menyimpan sekolah: ${error.message}`);
        }
    };
    
    const handleDeleteSchool = async (schoolId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus sekolah ini? Pengguna yang terhubung dengan sekolah ini tidak akan terhapus.')) {
            try {
                await dataService.deleteSchool(schoolId);
                toast.success('Sekolah berhasil dihapus');
                fetchSchools();
            } catch (error: any) {
                console.error('Failed to delete school:', error);
                toast.error(`Gagal menghapus sekolah: ${error.message}`);
            }
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Kelola Sekolah</h2>
                        <p className="text-cyan-100">Manajemen data sekolah dalam sistem</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center px-5 py-3 bg-white text-cyan-600 font-semibold rounded-lg hover:bg-cyan-50 transition-colors shadow-md"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Tambah Sekolah
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-cyan-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Total Sekolah</p>
                            <p className="text-3xl font-bold text-cyan-600">{isLoading ? '...' : schools.length}</p>
                        </div>
                        <BuildingLibraryIcon className="h-10 w-10 text-cyan-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Sekolah Dasar</p>
                            <p className="text-3xl font-bold text-green-600">{isLoading ? '...' : sdCount}</p>
                        </div>
                        <AcademicCapIcon className="h-10 w-10 text-green-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">SMP</p>
                            <p className="text-3xl font-bold text-blue-600">{isLoading ? '...' : smpCount}</p>
                        </div>
                        <AcademicCapIcon className="h-10 w-10 text-blue-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">SMA/SMK</p>
                            <p className="text-3xl font-bold text-purple-600">{isLoading ? '...' : smaCount}</p>
                        </div>
                        <AcademicCapIcon className="h-10 w-10 text-purple-200" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? <p className="p-4">Memuat sekolah...</p> :
                     error ? <p className="p-4 text-red-500">{error}</p> :
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nama Sekolah</th>
                                <th className="px-6 py-3">Jenjang</th>
                                <th className="px-6 py-3">Alamat</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schools.map(school => (
                                <tr key={school.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{school.name}</td>
                                    <td className="px-6 py-4">{school.level}</td>
                                    <td className="px-6 py-4">{school.address}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openModal(school)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDeleteSchool(school.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    }
                </div>
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedSchool ? "Edit Sekolah" : "Tambah Sekolah"}>
                    <SchoolForm 
                        school={selectedSchool}
                        onClose={closeModal}
                        onSave={handleSaveSchool}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ManageSchoolsPage;
