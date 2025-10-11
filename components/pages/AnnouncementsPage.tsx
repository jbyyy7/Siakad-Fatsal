import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { Announcement, User, UserRole } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';

interface AnnouncementsPageProps {
  user: User;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ user }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const canCreate = user.role === UserRole.ADMIN || user.role === UserRole.FOUNDATION_HEAD;

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setIsLoading(true);
            try {
                const data = await dataService.getAnnouncements();
                // sort by date desc
                data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setAnnouncements(data);
            } catch (err) {
                setError('Gagal memuat pengumuman.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);
    
    const formatDate = (dateString: string) => {
      return new Date(dateString + 'T00:00:00').toLocaleDateString('id-ID', {
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
                        // onClick={() => openModal()}
                        className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Buat Pengumuman Baru
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
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{formatDate(announcement.date)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Diposting oleh: {announcement.author}</p>
                                    <p className="mt-4 text-gray-700">{announcement.content}</p>
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
        </div>
    );
};

export default AnnouncementsPage;
