import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, Announcement, UserRole } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface AnnouncementsPageProps {
  user: User;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ user }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

    const canManage = user.role === UserRole.FOUNDATION_HEAD || user.role === UserRole.ADMIN;

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            const data = await dataService.getAnnouncements();
            setAnnouncements(data);
        } catch (err) {
            setError('Gagal memuat pengumuman.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);
    
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dataService.createAnnouncement({ ...newAnnouncement, author: user.name });
            setNewAnnouncement({ title: '', content: '' });
            setIsModalOpen(false);
            fetchAnnouncements();
        } catch (error: any) {
            alert(`Gagal membuat pengumuman: ${error.message}`);
        }
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
            try {
                await dataService.deleteAnnouncement(id);
                fetchAnnouncements();
            } catch (error: any) {
                alert(`Gagal menghapus pengumuman: ${error.message}`);
            }
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pengumuman Yayasan</h2>
                {canManage && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Buat Pengumuman
                    </button>
                )}
            </div>
            
            {isLoading ? <p>Memuat pengumuman...</p> : 
             error ? <p className="text-red-500">{error}</p> :
            <div className="space-y-6">
                {announcements.map(announcement => (
                    <Card key={announcement.id}>
                       <div className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Oleh: {announcement.author} - {new Date(announcement.date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                {canManage && (
                                    <button onClick={() => handleDelete(announcement.id)} className="p-1 text-red-500 hover:text-red-700">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                )}
                            </div>
                            <p className="mt-4 text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                       </div>
                    </Card>
                ))}
                 {announcements.length === 0 && <p className="text-center text-gray-500">Tidak ada pengumuman.</p>}
            </div>
            }

            {isModalOpen && (
                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Pengumuman Baru">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Judul</label>
                            <input 
                                type="text" 
                                id="title"
                                value={newAnnouncement.title}
                                onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                required
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                         <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Isi Pengumuman</label>
                            <textarea 
                                id="content"
                                rows={5}
                                value={newAnnouncement.content}
                                onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                required
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="flex justify-end pt-2 space-x-2">
                             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Batal</button>
                             <button type="submit" className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700">Kirim</button>
                        </div>
                    </form>
                </Modal>
            )}

        </div>
    );
};

export default AnnouncementsPage;