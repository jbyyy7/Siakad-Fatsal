
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Kelola Pengguna</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Pengguna
                </button>
            </div>
            
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Cari nama pengguna..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                    >
                        <option value="all">Semua Peran</option>
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                     <select
                        value={schoolFilter}
                        onChange={(e) => setSchoolFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                    >
                        <option value="all">Semua Sekolah</option>
                        {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                    </select>
                </div>
            </Card>

            <Card>
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
            </Card>

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
