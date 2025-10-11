
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, TeachingJournal } from '../../types';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import JournalForm from '../forms/JournalForm';

interface TeachingJournalPageProps {
  user: User;
}

const TeachingJournalPage: React.FC<TeachingJournalPageProps> = ({ user }) => {
    const [journals, setJournals] = useState<TeachingJournal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedJournal, setSelectedJournal] = useState<TeachingJournal | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await dataService.getTeachingJournals(user.id);
            setJournals(data);
        } catch (err) {
            setError('Gagal memuat data jurnal.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const openModal = (journal: TeachingJournal | null = null) => {
        setSelectedJournal(journal);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedJournal(null);
    };

    const handleSave = async () => {
        await fetchData();
        closeModal();
    };
    
    const handleDelete = async (journalId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus entri jurnal ini?')) {
            try {
                await dataService.deleteTeachingJournal(journalId);
                await fetchData();
            } catch (error: any) {
                console.error('Failed to delete journal:', error);
                alert(`Gagal menghapus jurnal: ${error.message}`);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Jurnal Mengajar</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Jurnal
                </button>
            </div>
            
            <Card>
                <div className="overflow-x-auto">
                    {isLoading ? <p className="p-4">Memuat jurnal...</p> :
                     error ? <p className="p-4 text-red-500">{error}</p> :
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Tanggal</th>
                                <th className="px-6 py-3">Kelas</th>
                                <th className="px-6 py-3">Mata Pelajaran</th>
                                <th className="px-6 py-3">Topik yang Diajarkan</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journals.map(journal => (
                                <tr key={journal.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(journal.date + 'T00:00:00').toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4">{journal.className}</td>
                                    <td className="px-6 py-4">{journal.subjectName}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{journal.topic}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openModal(journal)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDelete(journal.id)} className="p-1 text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                            {journals.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500">
                                        Belum ada entri jurnal mengajar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    }
                </div>
            </Card>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedJournal ? "Edit Jurnal Mengajar" : "Tambah Jurnal Mengajar"}>
                   <JournalForm
                        journal={selectedJournal}
                        user={user}
                        onClose={closeModal}
                        onSave={handleSave}
                   />
                </Modal>
            )}
        </div>
    );
};

export default TeachingJournalPage;
