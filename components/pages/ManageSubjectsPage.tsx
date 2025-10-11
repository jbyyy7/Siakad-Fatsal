import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { Subject } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import SubjectForm from '../forms/SubjectForm';

const ManageSubjectsPage: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const fetchSubjects = async () => {
        setIsLoading(true);
        try {
            const data = await dataService.getSubjects();
            setSubjects(data);
        } catch (err) {
            setError('Gagal memuat data mata pelajaran.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const openModal = (subject: Subject | null = null) => {
        setSelectedSubject(subject);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubject(null);
    };

    const handleSaveSubject = async (formData: Omit<Subject, 'id'>) => {
        try {
            if (selectedSubject) {
                await dataService.updateSubject(selectedSubject.id, formData);
            } else {
                await dataService.createSubject(formData);
            }
            await fetchSubjects(); // Refetch data
            closeModal();
        } catch (error: any) {
             console.error('Failed to save subject:', error);
             alert(`Gagal menyimpan mata pelajaran: ${error.message}`);
        }
    };
    
    const handleDeleteSubject = async (subjectId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) {
            try {
                await dataService.deleteSubject(subjectId);
                await fetchSubjects(); // Refetch data
            } catch (error: any) {
                console.error('Failed to delete subject:', error);
                alert(`Gagal menghapus mata pelajaran: ${error.message}`);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Kelola Mata Pelajaran</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Mata Pelajaran
                </button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    {isLoading ? <p className="p-4">Memuat mata pelajaran...</p> :
                     error ? <p className="p-4 text-red-500">{error}</p> :
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nama Mata Pelajaran</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map(subject => (
                                <tr key={subject.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{subject.name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openModal(subject)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDeleteSubject(subject.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    }
                </div>
            </Card>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}>
                    <SubjectForm 
                        subject={selectedSubject}
                        onClose={closeModal}
                        onSave={handleSaveSubject}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ManageSubjectsPage;