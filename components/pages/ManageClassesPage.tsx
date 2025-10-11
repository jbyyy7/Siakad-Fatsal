import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { Class } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import ClassForm from '../forms/ClassForm';

const ManageClassesPage: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await dataService.getClasses();
            setClasses(data);
        } catch (err) {
            setError('Gagal memuat data kelas.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (classData: Class | null = null) => {
        setSelectedClass(classData);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedClass(null);
    };

    const handleSaveClass = async (formData: any) => {
        try {
            if (selectedClass) {
                await dataService.updateClass(selectedClass.id, formData);
            } else {
                await dataService.createClass(formData);
            }
            await fetchData();
            closeModal();
        } catch (error: any) {
             console.error('Failed to save class:', error);
             alert(`Gagal menyimpan kelas: ${error.message}`);
        }
    };
    
    const handleDeleteClass = async (classId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
            try {
                await dataService.deleteClass(classId);
                await fetchData();
            } catch (error: any) {
                console.error('Failed to delete class:', error);
                alert(`Gagal menghapus kelas: ${error.message}`);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Kelola Kelas</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Kelas
                </button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    {isLoading ? <p className="p-4">Memuat data kelas...</p> :
                     error ? <p className="p-4 text-red-500">{error}</p> :
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nama Kelas</th>
                                <th className="px-6 py-3">Sekolah</th>
                                <th className="px-6 py-3">Wali Kelas</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map(c => (
                                <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                                    <td className="px-6 py-4">{c.schoolName || '-'}</td>
                                    <td className="px-6 py-4">{c.homeroomTeacherName || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openModal(c)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDeleteClass(c.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    }
                </div>
            </Card>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedClass ? "Edit Kelas" : "Tambah Kelas"}>
                    <ClassForm 
                        classData={selectedClass}
                        onClose={closeModal}
                        onSave={handleSaveClass}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ManageClassesPage;