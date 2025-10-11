import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { Announcement, User, UserRole } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import Modal from '../ui/Modal';
import AnnouncementForm from '../forms/AnnouncementForm';

interface AnnouncementsPageProps {
  user: User;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ user }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const canCreate = [UserRole.ADMIN, UserRole.FOUNDATION_HEAD, UserRole.PRINCIPAL].includes(user.role);

    const fetchAnnouncements = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // RLS policies now handle filtering, so we don't need to pass schoolId from client
            const data = await dataService.getAnnouncements();
            setAnnouncements(data);
        } catch (err) {
            setError('Gagal memuat pengumuman.');
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
            }
            await fetchAnnouncements();
            closeModal();
        } catch (error: any) {
            alert(`Gagal menyimpan pengumuman: ${error.message}`);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
            try {
                await dataService.deleteAnnouncement(id);
                await fetchAnnouncements();
            } catch (error: any) {
                alert(`Gagal menghapus pengumuman: ${error.message}`);
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pengumuman</h2>
                {canCreate && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Buat Pengumuman
                    </button>
                )}
            </div>
            
            {isLoading && <p>Memuat pengumuman...</p>}
            {error && <p className="text-red-500">{error}</p>}
            
            {!isLoading && !error && (
                <div className="space-y-4">
                    {announcements.length > 0 ? (
                        announcements.map(announcement => (
                             <Card key={announcement.id}>
                                <div className="p-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span>Diposting oleh: {announcement.author}</span>
                                                <span>•</span>
                                                <span>{formatDate(announcement.date)}</span>
                                            </div>
                                        </div>
                                        {announcement.schoolName ? (
                                            <span className="flex-shrink-0 text-xs text-green-800 bg-green-100 px-2 py-1 rounded-full">{announcement.schoolName}</span>
                                        ) : (
                                            <span className="flex-shrink-0 text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded-full">Global</span>
                                        )}
                                    </div>
                                    <p className="mt-4 text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                                    {canManage(announcement) && (
                                        <div className="text-right mt-4 border-t pt-2">
                                            <button onClick={() => openModal(announcement)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                            <button onClick={() => handleDelete(announcement.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <p className="p-4 text-center text-gray-500">Tidak ada pengumuman saat ini.</p>
                        </Card>
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
