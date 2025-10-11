import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { Subject, School } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import SubjectForm from '../forms/SubjectForm';

const ManageSubjectsPage: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [currentSchoolId, setCurrentSchoolId] = useState<string>('');

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

    const openModal = (subject: Subject | null = null, schoolId?: string) => {
        setSelectedSubject(subject);
        setCurrentSchoolId(schoolId || subject?.schoolId || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubject(null);
        setCurrentSchoolId('');
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

    const subjectsBySchool: Record<string, Subject[]> = subjects.reduce((acc, subject) => {
        const schoolId = subject.schoolId || 'unassigned';
        if (!acc[schoolId]) {
            acc[schoolId] = [];
        }
        acc[schoolId].push(subject);
        return acc;
    }, {} as Record<string, Subject[]>);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kelola Mata Pelajaran</h2>
            
            {isLoading && <p>Memuat...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!isLoading && !error && (
                <div className="space-y-6">
                    {schools.map(school => (
                        <Card key={school.id}>
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-semibold">{school.name}</h3>
                                <button
                                    onClick={() => openModal(null, school.id)}
                                    className="flex items-center text-sm px-3 py-1.5 bg-brand-100 text-brand-700 font-semibold rounded-md hover:bg-brand-200"
                                >
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Tambah Mapel
                                </button>
                            </div>
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <tbody>
                                        {(subjectsBySchool[school.id] || []).map(subject => (
                                            <tr key={subject.id} className="bg-white border-b hover:bg-gray-50 last:border-b-0">
                                                <td className="px-6 py-3 font-medium text-gray-900">{subject.name}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <button onClick={() => openModal(subject)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => handleDeleteSubject(subject.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!subjectsBySchool[school.id] || subjectsBySchool[school.id].length === 0) && (
                                            <tr><td colSpan={2} className="text-center text-gray-500 py-4">Belum ada mata pelajaran untuk sekolah ini.</td></tr>
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
                        initialSchoolId={currentSchoolId}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ManageSubjectsPage;