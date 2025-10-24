
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { Subject, School } from '../../types';
import Modal from '../ui/Modal';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import SubjectForm from '../forms/SubjectForm';

const ManageSubjectsPage: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [currentSchoolId, setCurrentSchoolId] = useState<string>('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [subjectsData, schoolsData] = await Promise.all([
                dataService.getSubjects(),
                dataService.getSchools(),
            ]);
            setSubjects(subjectsData);
            setSchools(schoolsData);
        } catch (err) {
            toast.error('Gagal memuat data mata pelajaran');
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
                toast.success('Mata pelajaran berhasil diperbarui');
            } else {
                await dataService.createSubject(formData);
                toast.success('Mata pelajaran berhasil ditambahkan');
            }
            await fetchData();
            closeModal();
        } catch (error: any) {
             console.error('Failed to save subject:', error);
             toast.error(`Gagal menyimpan mata pelajaran: ${error.message}`);
        }
    };
    
    const handleDeleteSubject = async (subjectId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) {
            try {
                await dataService.deleteSubject(subjectId);
                toast.success('Mata pelajaran berhasil dihapus');
                await fetchData();
            } catch (error: any) {
                console.error('Failed to delete subject:', error);
                toast.error(`Gagal menghapus mata pelajaran: ${error.message}`);
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
            
            {isLoading ? (
                <Loading text="Memuat data mata pelajaran..." />
            ) : (
                <div className="space-y-6">
                    {schools.length === 0 ? (
                        <EmptyState 
                            message="Belum ada sekolah"
                            submessage="Tambahkan sekolah terlebih dahulu untuk membuat mata pelajaran"
                        />
                    ) : (
                        schools.map(school => (
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
                                            <tr><td colSpan={2} className="text-center text-gray-400 py-8 italic">Belum ada mata pelajaran untuk sekolah ini.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ))
                    )}
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
