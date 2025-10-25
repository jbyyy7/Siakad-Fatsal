
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
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ChevronUpIcon } from '../icons/ChevronUpIcon';
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
    const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
    const [classStudents, setClassStudents] = useState<Record<string, User[]>>({});
    
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
                
                // Reload students for updated class if it's expanded
                if (expandedClasses.has(selectedClassWithStudents.id)) {
                    const students = await dataService.getStudentsInClass(selectedClassWithStudents.id);
                    setClassStudents(prev => ({ ...prev, [selectedClassWithStudents.id]: students }));
                }
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

    const toggleClassExpansion = async (classId: string) => {
        const newExpanded = new Set(expandedClasses);
        if (newExpanded.has(classId)) {
            newExpanded.delete(classId);
        } else {
            newExpanded.add(classId);
            // Load students if not already loaded
            if (!classStudents[classId]) {
                try {
                    const students = await dataService.getStudentsInClass(classId);
                    setClassStudents(prev => ({ ...prev, [classId]: students }));
                } catch (error) {
                    console.error('Failed to load students:', error);
                    toast.error('Gagal memuat data siswa');
                }
            }
        }
        setExpandedClasses(newExpanded);
    };

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
                                            <th className="px-6 py-3 w-12"></th>
                                            <th className="px-6 py-3">Nama Kelas</th>
                                            <th className="px-6 py-3">Wali Kelas</th>
                                            <th className="px-6 py-3 text-center">Jumlah Siswa</th>
                                            <th className="px-6 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(classesBySchool[school.id] || []).map(cls => {
                                            const isExpanded = expandedClasses.has(cls.id);
                                            const students = classStudents[cls.id] || [];
                                            const studentCount = cls.studentIds?.length || 0;
                                            
                                            return (
                                                <React.Fragment key={cls.id}>
                                                    <tr className="bg-white border-b hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => toggleClassExpansion(cls.id)}
                                                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                                                title={isExpanded ? "Tutup detail" : "Lihat detail"}
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                                                                ) : (
                                                                    <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
                                                                    {cls.name.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">{cls.name}</div>
                                                                    <div className="text-xs text-gray-500">Kelas {cls.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {cls.homeroomTeacherId ? (
                                                                <div className="flex items-center">
                                                                    <AcademicCapIcon className="h-5 w-5 text-green-600 mr-2" />
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{cls.homeroomTeacherName}</div>
                                                                        <div className="text-xs text-green-600">Wali Kelas</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                                                    Belum ada wali kelas
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-sm ${
                                                                studentCount > 0 
                                                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                                                                    : 'bg-gray-200 text-gray-500'
                                                            }`}>
                                                                {studentCount}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => openModal(cls)} 
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit kelas"
                                                            >
                                                                <PencilIcon className="h-5 w-5"/>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(cls.id)} 
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                                                title="Hapus kelas"
                                                            >
                                                                <TrashIcon className="h-5 w-5"/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    
                                                    {/* Expanded Details Row */}
                                                    {isExpanded && (
                                                        <tr className="bg-gradient-to-r from-gray-50 to-indigo-50 border-b">
                                                            <td colSpan={5} className="px-6 py-6">
                                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                                    {/* Wali Kelas Info */}
                                                                    <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500">
                                                                        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                                                                            <AcademicCapIcon className="h-5 w-5 text-green-600 mr-2" />
                                                                            Wali Kelas
                                                                        </h4>
                                                                        {cls.homeroomTeacherId ? (
                                                                            <div className="space-y-2">
                                                                                <div className="flex items-center">
                                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                                                        {cls.homeroomTeacherName?.charAt(0).toUpperCase() || 'G'}
                                                                                    </div>
                                                                                    <div className="ml-3">
                                                                                        <p className="font-semibold text-gray-900">{cls.homeroomTeacherName}</p>
                                                                                        <p className="text-xs text-gray-500">Guru Pembimbing</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center py-6">
                                                                                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                                                                    <AcademicCapIcon className="h-8 w-8 text-gray-400" />
                                                                                </div>
                                                                                <p className="text-sm text-gray-500 italic">Belum ada wali kelas</p>
                                                                                <button
                                                                                    onClick={() => openModal(cls)}
                                                                                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                                                >
                                                                                    Tambahkan Wali Kelas
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Students List */}
                                                                    <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-500 lg:col-span-2">
                                                                        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center justify-between">
                                                                            <span className="flex items-center">
                                                                                <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                                                                                Daftar Siswa
                                                                            </span>
                                                                            <span className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                                                {studentCount} siswa
                                                                            </span>
                                                                        </h4>
                                                                        {students.length > 0 ? (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar">
                                                                                {students.map((student, idx) => (
                                                                                    <div 
                                                                                        key={student.id} 
                                                                                        className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow"
                                                                                    >
                                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                                                                            {idx + 1}
                                                                                        </div>
                                                                                        <div className="ml-3 flex-1 min-w-0">
                                                                                            <p className="font-medium text-gray-900 truncate">{student.name}</p>
                                                                                            <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center py-8">
                                                                                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                                                                    <UserGroupIcon className="h-8 w-8 text-gray-400" />
                                                                                </div>
                                                                                <p className="text-sm text-gray-500 italic mb-3">Belum ada siswa di kelas ini</p>
                                                                                <button
                                                                                    onClick={() => openModal(cls)}
                                                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                                                >
                                                                                    Tambahkan Siswa
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                        {(!classesBySchool[school.id] || classesBySchool[school.id].length === 0) && (
                                            <tr><td colSpan={5} className="text-center text-gray-400 py-8 italic">Belum ada kelas untuk sekolah ini.</td></tr>
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
