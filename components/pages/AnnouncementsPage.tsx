import React, { useState } from 'react';
import Card from '../Card';
import { MOCK_ANNOUNCEMENTS } from '../../constants';
import { Announcement, User } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';

interface AnnouncementsPageProps {
    user: User;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ user }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pengumuman Yayasan</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Buat Pengumuman Baru
                </button>
            </div>
            
            <div className="space-y-6">
                {announcements.map(ann => (
                    <Card key={ann.id}>
                        <h3 className="text-xl font-bold text-gray-900">{ann.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Dipublikasikan pada {ann.date} oleh {ann.author}</p>
                        <p className="mt-4 text-gray-700">{ann.content}</p>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Pengumuman Baru">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Judul</label>
                        <input type="text" className="w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Isi Pengumuman</label>
                        <textarea rows={5} className="w-full p-2 border rounded-md"></textarea>
                    </div>
                    <div className="text-right">
                        <button className="px-5 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700">Publikasikan</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AnnouncementsPage;
