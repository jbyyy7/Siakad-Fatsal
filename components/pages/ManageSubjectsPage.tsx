import React, { useState, useEffect, useMemo } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { Subject, School } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import SubjectForm from '../forms/SubjectForm';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';

const ManageSubjectsPage: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [subjectsData, schoolsData] = await Promise.all([
                dataService.getSubjects(),
                dataService.getSchools(),
            ]);
            setSubjects(subjectsData);
            setSchools(schoolsData);
        } catch (err) {
            setError('Gagal memuat data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (subject: Subject | null = null) => {
        setSelectedSubject(subject);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubject(null);
    };

    const handleSaveSubject = async (formData: { name: string, schoolId: string }) => {
        try {
            if (selectedSubject) {
                await dataService.updateSubject(selectedSubject.id, formData);
            } else {
                await dataService.createSubject(formData);
            }
            await fetchData();
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
                await fetchData();
            } catch (error: any) {
                console.error('Failed to delete subject:', error);
                alert(`Gagal menghapus mata pelajaran: ${error.message}`);
            }
        }
    };

    const groupedSubjects = useMemo(() => {
        return subjects.reduce((acc, subject) => {
            const schoolId = subject.schoolId || 'unassigned';
            if (!acc[schoolId]) {
                acc[schoolId] = [];
            }
            acc[schoolId].push(subject);
            return acc;
        }, {} as Record<string, Subject[]>);
    }, [subjects]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Kelola Mata Pelajaran per Sekolah</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Mata Pelajaran
                </button>
            </div>

            {isLoading && <p>Memuat data...</p>}
            {error && <p className="text-red-500">{error}</p>}
            
            {!isLoading && !error && (
                <div className="space-y-6">
                    {schools.map(school => (
                        <Card key={school.id} title={school.name} icon={BuildingLibraryIcon}>
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Nama Mata Pelajaran</th>
                                            <th className="px-6 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(groupedSubjects[school.id] || []).map(subject => (
                                            <tr key={subject.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{subject.name}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => openModal(subject)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => handleDeleteSubject(subject.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                         {(groupedSubjects[school.id] || []).length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">Belum ada mata pelajaran untuk sekolah ini.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}>
                    <SubjectForm 
                        subject={selectedSubject}
                        schools={schools}
                        onClose={closeModal}
                        onSave={handleSaveSubject}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ManageSubjectsPage;