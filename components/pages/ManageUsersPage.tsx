
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { User, UserRole, School } from '../../types';
import Modal from '../ui/Modal';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import UserForm from '../forms/UserForm';

const ManageUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [schoolFilter, setSchoolFilter] = useState<string | 'all'>('all');
    
    // Calculate stats
    const stats = useMemo(() => ({
        totalUsers: users.length,
        students: users.filter(u => u.role === UserRole.STUDENT).length,
        teachers: users.filter(u => u.role === UserRole.TEACHER).length,
        staff: users.filter(u => u.role === UserRole.STAFF).length,
        admins: users.filter(u => u.role === UserRole.ADMIN).length,
    }), [users]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersData, schoolsData] = await Promise.all([
                dataService.getUsers(),
                dataService.getSchools(),
            ]);
            setUsers(usersData);
            setSchools(schoolsData);
        } catch (err) {
            toast.error('Gagal memuat data pengguna');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (user: User | null = null) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };
    
    const handleSaveUser = async (formData: any) => {
        try {
            if (selectedUser) {
                // Update existing user
                await dataService.updateUser(selectedUser.id, formData);
                toast.success('Pengguna berhasil diperbarui');
            } else {
                // Create new user
                await dataService.createUser(formData);
                toast.success('Pengguna berhasil ditambahkan');
            }
            fetchData(); // Refetch data
            closeModal();
        } catch (error: any) {
            console.error('Failed to save user:', error);
            toast.error(`Gagal menyimpan pengguna: ${error.message}`);
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
            try {
                await dataService.deleteUser(userId);
                toast.success('Pengguna berhasil dihapus');
                fetchData(); // Refetch data
            } catch (error: any) {
                console.error('Failed to delete user:', error);
                toast.error(`Gagal menghapus pengguna: ${error.message}`);
            }
        }
    };


    const filteredUsers = useMemo(() => {
        return users
            .filter(user => searchTerm === '' || user.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(user => roleFilter === 'all' || user.role === roleFilter)
            .filter(user => schoolFilter === 'all' || user.schoolId === schoolFilter);
    }, [users, searchTerm, roleFilter, schoolFilter]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Kelola Pengguna</h2>
                        <p className="text-blue-100">Manajemen data pengguna sistem SIAKAD</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center px-5 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Tambah Pengguna
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Total Pengguna</p>
                            <p className="text-3xl font-bold text-blue-600">{isLoading ? '...' : stats.totalUsers}</p>
                        </div>
                        <UserGroupIcon className="h-10 w-10 text-blue-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Siswa</p>
                            <p className="text-3xl font-bold text-purple-600">{isLoading ? '...' : stats.students}</p>
                        </div>
                        <AcademicCapIcon className="h-10 w-10 text-purple-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Guru</p>
                            <p className="text-3xl font-bold text-green-600">{isLoading ? '...' : stats.teachers}</p>
                        </div>
                        <AcademicCapIcon className="h-10 w-10 text-green-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Staff</p>
                            <p className="text-3xl font-bold text-orange-600">{isLoading ? '...' : stats.staff}</p>
                        </div>
                        <BriefcaseIcon className="h-10 w-10 text-orange-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Admin</p>
                            <p className="text-3xl font-bold text-red-600">{isLoading ? '...' : stats.admins}</p>
                        </div>
                        <ShieldCheckIcon className="h-10 w-10 text-red-200" />
                    </div>
                </div>
            </div>
            
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">🔍 Filter & Pencarian</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cari Nama</label>
                        <input
                            type="text"
                            placeholder="Cari nama pengguna..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Peran</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="all">Semua Peran</option>
                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Sekolah</label>
                        <select
                            value={schoolFilter}
                            onChange={(e) => setSchoolFilter(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="all">Semua Sekolah</option>
                            {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                        </select>
                    </div>
                </div>
                {(searchTerm || roleFilter !== 'all' || schoolFilter !== 'all') && (
                    <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-blue-700">
                            Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{users.length}</strong> pengguna
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setSchoolFilter('all');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                        >
                            Reset Filter
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <Loading text="Memuat pengguna..." />
                    ) : filteredUsers.length === 0 ? (
                        <EmptyState 
                            message="Tidak ada pengguna"
                            submessage={searchTerm || roleFilter !== 'all' || schoolFilter !== 'all' 
                                ? 'Coba ubah filter pencarian' 
                                : 'Klik "Tambah Pengguna" untuk membuat pengguna baru'}
                        />
                    ) : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nama</th>
                                <th className="px-6 py-3">No. Induk</th>
                                <th className="px-6 py-3">Peran</th>
                                <th className="px-6 py-3">Sekolah</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full mr-3 object-cover"/>
                                            {user.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{user.identityNumber}</td>
                                    <td className="px-6 py-4">{user.role}</td>
                                    <td className="px-6 py-4">{user.schoolName || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openModal(user)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedUser ? "Edit Pengguna" : "Tambah Pengguna"}>
                   <UserForm
                        user={selectedUser}
                        schools={schools}
                        onClose={closeModal}
                        onSave={handleSaveUser}
                   />
                </Modal>
            )}
        </div>
    );
};

export default ManageUsersPage;
