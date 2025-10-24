
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
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
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
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                <h2 className="text-3xl font-bold mb-2">Kelola Mata Pelajaran</h2>
                <p className="text-pink-100">Manajemen mata pelajaran untuk semua sekolah</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-pink-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Total Mata Pelajaran</p>
                            <p className="text-3xl font-bold text-pink-600">{isLoading ? '...' : subjects.length}</p>
                        </div>
                        <BookOpenIcon className="h-10 w-10 text-pink-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-rose-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Sekolah</p>
                            <p className="text-3xl font-bold text-rose-600">{isLoading ? '...' : schools.length}</p>
                        </div>
                        <BuildingLibraryIcon className="h-10 w-10 text-rose-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Rata-rata per Sekolah</p>
                            <p className="text-3xl font-bold text-purple-600">
                                {isLoading ? '...' : schools.length > 0 ? Math.round(subjects.length / schools.length) : 0}
                            </p>
                        </div>
                        <BookOpenIcon className="h-10 w-10 text-purple-200" />
                    </div>
                </div>
            </div>
            
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
                        <div key={school.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-pink-200">
                                <div className="flex items-center">
                                    <BuildingLibraryIcon className="h-6 w-6 text-pink-600 mr-3" />
                                    <h3 className="text-lg font-bold text-gray-800">{school.name}</h3>
                                    <span className="ml-3 px-2 py-1 text-xs font-semibold bg-pink-100 text-pink-700 rounded-full">
                                        {(subjectsBySchool[school.id] || []).length} mapel
                                    </span>
                                </div>
                                <button
                                    onClick={() => openModal(null, school.id)}
                                    className="flex items-center text-sm px-4 py-2 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
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
                        </div>
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
