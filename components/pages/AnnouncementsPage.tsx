
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { Announcement, User, UserRole } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import Modal from '../ui/Modal';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import AnnouncementForm from '../forms/AnnouncementForm';

interface AnnouncementsPageProps {
  user: User;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ user }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const canCreate = [UserRole.ADMIN, UserRole.FOUNDATION_HEAD, UserRole.PRINCIPAL].includes(user.role);
    
    // Calculate stats
    const globalAnnouncements = announcements.filter(a => !a.schoolId).length;
    const schoolAnnouncements = announcements.filter(a => a.schoolId).length;
    const thisWeekAnnouncements = announcements.filter(a => {
        const announcementDate = new Date(a.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return announcementDate >= weekAgo;
    }).length;

    const fetchAnnouncements = useCallback(async () => {
        setIsLoading(true);
        try {
            // RLS policies now handle filtering, so we don't need to pass schoolId from client
            const data = await dataService.getAnnouncements();
            setAnnouncements(data);
        } catch (err) {
            toast.error('Gagal memuat pengumuman');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const openModal = (announcement: Announcement | null = null) => {
        setSelectedAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedAnnouncement(null);
        setIsModalOpen(false);
    };

    const handleSave = async (formData: { title: string, content: string }) => {
        try {
            if (selectedAnnouncement) {
                // Update
                await dataService.updateAnnouncement(selectedAnnouncement.id, formData);
                toast.success('Pengumuman berhasil diperbarui');
            } else {
                // Create
                const announcementData: any = {
                    ...formData,
                    author_id: user.id
                };
                if (user.role === UserRole.PRINCIPAL) {
                    announcementData.school_id = user.schoolId;
                }
                await dataService.createAnnouncement(announcementData);
                toast.success('Pengumuman berhasil ditambahkan');
            }
            await fetchAnnouncements();
            closeModal();
        } catch (error: any) {
            toast.error(`Gagal menyimpan pengumuman: ${error.message}`);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
            try {
                await dataService.deleteAnnouncement(id);
                toast.success('Pengumuman berhasil dihapus');
                await fetchAnnouncements();
            } catch (error: any) {
                toast.error(`Gagal menghapus pengumuman: ${error.message}`);
            }
        }
    };
    
    const canManage = (announcement: Announcement): boolean => {
        if (user.role === UserRole.ADMIN || user.role === UserRole.FOUNDATION_HEAD) {
            return true;
        }
        if (user.role === UserRole.PRINCIPAL && announcement.schoolId === user.schoolId) {
            return true;
        }
        return false;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString + 'T00:00:00Z').toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">📢 Pengumuman</h2>
                        <p className="text-orange-100">Informasi terbaru untuk seluruh civitas akademika</p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => openModal()}
                            className="flex items-center px-5 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors shadow-md"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Buat Pengumuman
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Total Pengumuman</p>
                            <p className="text-3xl font-bold text-orange-600">{isLoading ? '...' : announcements.length}</p>
                        </div>
                        <MegaphoneIcon className="h-10 w-10 text-orange-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Pengumuman Global</p>
                            <p className="text-3xl font-bold text-blue-600">{isLoading ? '...' : globalAnnouncements}</p>
                        </div>
                        <BuildingLibraryIcon className="h-10 w-10 text-blue-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Minggu Ini</p>
                            <p className="text-3xl font-bold text-green-600">{isLoading ? '...' : thisWeekAnnouncements}</p>
                        </div>
                        <CalendarIcon className="h-10 w-10 text-green-200" />
                    </div>
                </div>
            </div>
            
            {isLoading ? (
                <Loading text="Memuat pengumuman..." />
            ) : (
                <div className="space-y-4">
                    {announcements.length > 0 ? (
                        announcements.map(announcement => (
                             <div key={announcement.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border-l-4 border-orange-500">
                                <div className="p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MegaphoneIcon className="h-5 w-5 text-orange-500" />
                                                <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">Oleh:</span>
                                                    <span>{announcement.author}</span>
                                                </div>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    <span>{formatDate(announcement.date)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {announcement.schoolName ? (
                                            <span className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-100 px-3 py-1.5 rounded-full">
                                                <BuildingLibraryIcon className="h-3 w-3" />
                                                {announcement.schoolName}
                                            </span>
                                        ) : (
                                            <span className="flex-shrink-0 text-xs font-semibold text-blue-800 bg-blue-100 px-3 py-1.5 rounded-full">
                                                🌍 Global
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-orange-300">
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
                                    </div>
                                    {canManage(announcement) && (
                                        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                                            <button 
                                                onClick={() => openModal(announcement)} 
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <PencilIcon className="h-4 w-4"/>
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(announcement.id)} 
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4"/>
                                                Hapus
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <EmptyState 
                            message="Tidak ada pengumuman"
                            submessage={canCreate ? 'Klik "Buat Pengumuman" untuk membuat pengumuman baru' : 'Belum ada pengumuman saat ini'}
                        />
                    )}
                </div>
            )}

            {isModalOpen && (
                <Modal 
                    isOpen={isModalOpen} 
                    onClose={closeModal} 
                    title={selectedAnnouncement ? "Edit Pengumuman" : "Buat Pengumuman"}
                >
                    <AnnouncementForm
                        announcement={selectedAnnouncement}
                        onClose={closeModal}
                        onSave={handleSave}
                    />
                </Modal>
            )}
        </div>
    );
};

export default AnnouncementsPage;
