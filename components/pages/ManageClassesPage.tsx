
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { Class, School, User, UserRole } from '../../types';
import Modal from '../ui/Modal';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { IdentificationIcon } from '../icons/IdentificationIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import ClassForm from '../forms/ClassForm';

const ManageClassesPage: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [allTeachers, setAllTeachers] = useState<User[]>([]);
    const [allStudents, setAllStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClassWithStudents, setSelectedClassWithStudents] = useState<any>(null);
    const [initialSchoolIdForNewClass, setInitialSchoolIdForNewClass] = useState<string | undefined>();
    
    // Calculate stats
    const totalStudentsInClasses = useMemo(() => {
        return classes.reduce((sum, cls) => sum + (cls.studentIds?.length || 0), 0);
    }, [classes]);
    
    const classesWithTeachers = useMemo(() => {
        return classes.filter(cls => cls.homeroomTeacherId).length;
    }, [classes]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [classesData, schoolsData, teachersData, studentsData] = await Promise.all([
                dataService.getClasses(),
                dataService.getSchools(),
                dataService.getUsers({ role: UserRole.TEACHER }),
                dataService.getUsers({ role: UserRole.STUDENT }),
            ]);
            
            console.log('📊 Data Fetched:');
            console.log('- Classes:', classesData.length);
            console.log('- Schools:', schoolsData.length);
            console.log('- Teachers:', teachersData.length, teachersData);
            console.log('- Students:', studentsData.length, studentsData);
            
            // Check for users without school_id
            const teachersWithoutSchool = teachersData.filter(t => !t.schoolId);
            const studentsWithoutSchool = studentsData.filter(s => !s.schoolId);
            
            if (teachersWithoutSchool.length > 0) {
                console.warn('⚠️ PROBLEM: Guru tanpa school_id:', teachersWithoutSchool.length);
                console.warn('→ Jalankan SQL: sql/FIX_MISSING_SCHOOL_ID.sql');
                console.table(teachersWithoutSchool.map(t => ({ 
                    name: t.name, 
                    email: t.email,
                    schoolId: t.schoolId || '❌ NULL'
                })));
            }
            
            if (studentsWithoutSchool.length > 0) {
                console.warn('⚠️ PROBLEM: Siswa tanpa school_id:', studentsWithoutSchool.length);
                console.warn('→ Jalankan SQL: sql/FIX_MISSING_SCHOOL_ID.sql');
                console.table(studentsWithoutSchool.map(s => ({ 
                    name: s.name, 
                    email: s.email,
                    schoolId: s.schoolId || '❌ NULL'
                })));
            }
            
            setClasses(classesData);
            setSchools(schoolsData);
            setAllTeachers(teachersData);
            setAllStudents(studentsData);
        } catch (err) {
            toast.error('Gagal memuat data kelas');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = async (classItem: Class | null = null, schoolId?: string) => {
        if (classItem) {
            // Editing existing class
            const studentsInClass = await dataService.getStudentsInClass(classItem.id);
            setSelectedClassWithStudents({ ...classItem, studentIds: studentsInClass.map(s => s.id) });
            setInitialSchoolIdForNewClass(undefined);
        } else {
            // Creating new class
            setSelectedClassWithStudents(null);
            setInitialSchoolIdForNewClass(schoolId);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedClassWithStudents(null);
        setInitialSchoolIdForNewClass(undefined);
    };

    const handleSave = async (formData: any) => {
        try {
            if (selectedClassWithStudents?.id) {
                await dataService.updateClass(selectedClassWithStudents.id, formData);
                toast.success('Kelas berhasil diperbarui');
            } else {
                await dataService.createClass(formData);
                toast.success('Kelas berhasil ditambahkan');
            }
            await fetchData();
            closeModal();
        } catch (error: any) {
            console.error('Failed to save class:', error);
            toast.error(`Gagal menyimpan kelas: ${error.message}`);
        }
    };
    
    const handleDelete = async (classId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus kelas ini? Semua data siswa yang terhubung akan dilepaskan dari kelas ini.')) {
            try {
                await dataService.deleteClass(classId);
                toast.success('Kelas berhasil dihapus');
                await fetchData();
            } catch (error: any) {
                console.error('Failed to delete class:', error);
                toast.error(`Gagal menghapus kelas: ${error.message}`);
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
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                <h2 className="text-3xl font-bold mb-2">Kelola Kelas</h2>
                <p className="text-indigo-100">Manajemen kelas dan penempatan siswa</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Total Kelas</p>
                            <p className="text-3xl font-bold text-indigo-600">{isLoading ? '...' : classes.length}</p>
                        </div>
                        <IdentificationIcon className="h-10 w-10 text-indigo-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Total Siswa</p>
                            <p className="text-3xl font-bold text-purple-600">{isLoading ? '...' : totalStudentsInClasses}</p>
                        </div>
                        <UserGroupIcon className="h-10 w-10 text-purple-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Wali Kelas</p>
                            <p className="text-3xl font-bold text-green-600">{isLoading ? '...' : classesWithTeachers}</p>
                        </div>
                        <AcademicCapIcon className="h-10 w-10 text-green-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Sekolah</p>
                            <p className="text-3xl font-bold text-blue-600">{isLoading ? '...' : schools.length}</p>
                        </div>
                        <BuildingLibraryIcon className="h-10 w-10 text-blue-200" />
                    </div>
                </div>
            </div>
            
            {isLoading ? (
                <Loading text="Memuat data kelas..." />
            ) : (
                <div className="space-y-6">
                    {schools.length === 0 ? (
                        <EmptyState 
                            message="Belum ada sekolah"
                            submessage="Tambahkan sekolah terlebih dahulu untuk membuat kelas"
                        />
                    ) : (
                        schools.map(school => (
                        <div key={school.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-indigo-200">
                                <div className="flex items-center">
                                    <BuildingLibraryIcon className="h-6 w-6 text-indigo-600 mr-3" />
                                    <h3 className="text-lg font-bold text-gray-800">{school.name}</h3>
                                    <span className="ml-3 px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                                        {(classesBySchool[school.id] || []).length} kelas
                                    </span>
                                </div>
                                <button
                                    onClick={() => openModal(null, school.id)}
                                    className="flex items-center text-sm px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
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
                                            <tr><td colSpan={3} className="text-center text-gray-400 py-8 italic">Belum ada kelas untuk sekolah ini.</td></tr>
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
                <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedClassWithStudents ? "Edit Kelas" : "Tambah Kelas"}>
                    <ClassForm 
                        classData={selectedClassWithStudents}
                        schools={schools}
                        allTeachers={allTeachers}
                        allStudents={allStudents}
                        onClose={closeModal}
                        onSave={handleSave}
                        initialSchoolId={initialSchoolIdForNewClass}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ManageClassesPage;
