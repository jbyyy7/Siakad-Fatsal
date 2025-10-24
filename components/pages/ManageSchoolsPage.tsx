
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
import SchoolForm from '../forms/SchoolForm';

const ManageSchoolsPage: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Kelola Sekolah</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Sekolah
                </button>
            </div>
            <Card>
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
            </Card>

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
