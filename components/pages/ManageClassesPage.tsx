import React, { useState, useEffect, useMemo } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { Class, School, User, UserRole } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import ClassForm from '../forms/ClassForm';

const ManageClassesPage: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [allTeachers, setAllTeachers] = useState<User[]>([]);
    const [allStudents, setAllStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [selectedClassWithStudents, setSelectedClassWithStudents] = useState<any>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [classesData, schoolsData, teachersData, studentsData] = await Promise.all([
                dataService.getClasses(),
                dataService.getSchools(),
                dataService.getUsers({ role: UserRole.TEACHER }),
                dataService.getUsers({ role: UserRole.STUDENT }),
            ]);
            setClasses(classesData);
            setSchools(schoolsData);
            setAllTeachers(teachersData);
            setAllStudents(studentsData);
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

    const openModal = async (classItem: Class | null = null) => {
        setSelectedClass(classItem);
        if (classItem) {
            // Fetch students for the selected class to populate the form
            const studentsInClass = await dataService.getStudentsInClass(classItem.id);
            setSelectedClassWithStudents({ ...classItem, studentIds: studentsInClass.map(s => s.id) });
        } else {
            setSelectedClassWithStudents(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedClass(null);
        setSelectedClassWithStudents(null);
    };

    const handleSave = async (formData: any) => {
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
    
    const handleDelete = async (classId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus kelas ini? Semua data siswa yang terhubung akan dilepaskan dari kelas ini.')) {
            try {
                await dataService.deleteClass(classId);
                await fetchData();
            } catch (error: any) {
                console.error('Failed to delete class:', error);
                alert(`Gagal menghapus kelas: ${error.message}`);
            }
        }
    };

    const classesBySchool: Record<string, Class[]> = useMemo(() => classes.reduce((acc, cls) => {
        const schoolId = cls.schoolId || 'unassigned';
        if (!acc[schoolId]) {
            acc[schoolId] = [];
        }
        acc[schoolId].push(cls);
        return acc;
    }, {} as Record<string, Class[]>), [classes]);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kelola Kelas</h2>
            
            {isLoading && <p>Memuat...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!isLoading && !error && (
                <div className="space-y-6">
                    {schools.map(school => (
                        <Card key={school.id}>
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-semibold">{school.name}</h3>
                                <button
                                    onClick={() => openModal()}
                                    className="flex items-center text-sm px-3 py-1.5 bg-brand-100 text-brand-700 font-semibold rounded-md hover:bg-brand-200"
                                >
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Tambah Kelas
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Nama Kelas</th>
                                            <th className="px-6 py-3">Wali Kelas</th>
                                            <th className="px-6 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(classesBySchool[school.id] || []).map(cls => (
                                            <tr key={cls.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{cls.name}</td>
                                                <td className="px-6 py-4">{cls.homeroomTeacherName || '-'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => openModal(cls)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => handleDelete(cls.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!classesBySchool[school.id] || classesBySchool[school.id].length === 0) && (
                                            <tr><td colSpan={3} className="text-center text-gray-500 py-4">Belum ada kelas untuk sekolah ini.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedClass ? "Edit Kelas" : "Tambah Kelas"}>
                    <ClassForm 
                        classData={selectedClassWithStudents}
                        schools={schools}
                        allTeachers={allTeachers}
                        allStudents={allStudents}
                        onClose={closeModal}
                        onSave={handleSave}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ManageClassesPage;
