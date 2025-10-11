
import React, { useState, useEffect } from 'react';
import { User, TeachingJournal } from '../../types';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import Card from '../Card';
import Modal from '../ui/Modal';
import JournalForm from '../forms/JournalForm';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface TeachingJournalPageProps {
  user: User;
}

const TeachingJournalPage: React.FC<TeachingJournalPageProps> = ({ user }) => {
  const [journals, setJournals] = useState<TeachingJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<TeachingJournal | null>(null);

  const fetchJournals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.getTeachingJournals(user.id);
      // Sort by date descending
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setJournals(data);
    } catch (err) {
      setError('Gagal memuat data jurnal mengajar.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [user.id]);

  const openModal = (journal: TeachingJournal | null = null) => {
    setSelectedJournal(journal);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedJournal(null);
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    await fetchJournals();
    closeModal();
  };

  const handleDelete = async (journalId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus entri jurnal ini?')) {
      try {
        await dataService.deleteTeachingJournal(journalId);
        await fetchJournals();
      } catch (error: any) {
        alert(`Gagal menghapus jurnal: ${error.message}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          Tambah Entri Jurnal
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="p-4">Memuat jurnal...</p>
          ) : error ? (
            <p className="p-4 text-red-500">{error}</p>
          ) : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Kelas</th>
                  <th className="px-6 py-3">Mata Pelajaran</th>
                  <th className="px-6 py-3">Topik / Materi</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {journals.map((journal) => (
                  <tr key={journal.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{formatDate(journal.date)}</td>
                    <td className="px-6 py-4">{journal.className}</td>
                    <td className="px-6 py-4">{journal.subjectName}</td>
                    <td className="px-6 py-4">{journal.topic}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openModal(journal)} className="p-1 text-blue-600 hover:text-blue-800">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(journal.id)} className="p-1 text-red-600 hover:text-red-800 ml-2">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {journals.length === 0 && (
                    <tr>
                        <td colSpan={5} className="text-center text-gray-500 py-6">
                            Belum ada entri jurnal.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedJournal ? 'Edit Jurnal' : 'Tambah Jurnal'}>
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
