import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { dataService } from '../../services/dataService';
import toast from 'react-hot-toast';
import { User } from '../../types';

// Icons
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { IdentificationIcon } from '../icons/IdentificationIcon';

interface RFIDCardManagementPageProps {
  user: User;
}

interface RFIDCard {
  id: string;
  card_uid: string;
  student_id: string;
  status: 'active' | 'blocked' | 'lost' | 'expired';
  assigned_date: string;
  last_used: string | null;
  total_taps: number;
  school_id: string;
  notes: string | null;
  student_name?: string;
  student_class?: string;
  nis?: string;
}

interface Student {
  id: string;
  full_name: string;
  class: string;
  identity_number: string;
}

export const RFIDCardManagementPage: React.FC<RFIDCardManagementPageProps> = ({ user }) => {
  const [cards, setCards] = useState<RFIDCard[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<RFIDCard | null>(null);
  
  // Form states
  const [newCardUID, setNewCardUID] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [cardNotes, setCardNotes] = useState('');
  const [cardStatus, setCardStatus] = useState<'active' | 'blocked' | 'lost' | 'expired'>('active');

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCards();
    fetchStudents();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('rfid_cards_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rfid_cards' },
        (payload) => {
          console.log('Card change detected:', payload);
          fetchCards();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('v_active_cards')
        .select('*')
        .eq('school_id', user.schoolId)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      
      setCards(data || []);
    } catch (error: any) {
      console.error('Error fetching cards:', error);
      toast.error('Gagal memuat data kartu');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, class, identity_number')
        .eq('school_id', user.schoolId)
        .eq('role', 'Siswa')
        .order('full_name');

      if (error) throw error;
      
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
    }
  };

  const handleRegisterCard = async () => {
    if (!newCardUID || !selectedStudentId) {
      toast.error('Mohon lengkapi UID kartu dan pilih siswa');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('register_rfid_card', {
          p_card_uid: newCardUID.toUpperCase(),
          p_student_id: selectedStudentId,
          p_school_id: user.schoolId,
          p_notes: cardNotes || null
        });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'Kartu berhasil didaftarkan!');
        setShowRegisterModal(false);
        resetForm();
        fetchCards();
      } else {
        toast.error(data?.message || 'Gagal mendaftarkan kartu');
      }
    } catch (error: any) {
      console.error('Error registering card:', error);
      toast.error('Terjadi kesalahan saat mendaftarkan kartu');
    }
  };

  const handleUpdateCardStatus = async () => {
    if (!selectedCard) return;

    try {
      const { data, error } = await supabase
        .rpc('update_card_status', {
          p_card_uid: selectedCard.card_uid,
          p_new_status: cardStatus,
          p_notes: cardNotes || null
        });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'Status kartu diperbarui!');
        setShowEditModal(false);
        setSelectedCard(null);
        resetForm();
        fetchCards();
      } else {
        toast.error(data?.message || 'Gagal memperbarui status');
      }
    } catch (error: any) {
      console.error('Error updating card:', error);
      toast.error('Terjadi kesalahan saat memperbarui status');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kartu ini?')) return;

    try {
      const { error } = await supabase
        .from('rfid_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      toast.success('Kartu berhasil dihapus');
      fetchCards();
    } catch (error: any) {
      console.error('Error deleting card:', error);
      toast.error('Gagal menghapus kartu');
    }
  };

  const resetForm = () => {
    setNewCardUID('');
    setSelectedStudentId('');
    setCardNotes('');
    setCardStatus('active');
  };

  const openEditModal = (card: RFIDCard) => {
    setSelectedCard(card);
    setCardStatus(card.status);
    setCardNotes(card.notes || '');
    setShowEditModal(true);
  };

  // Filter cards
  const filteredCards = cards.filter(card => {
    const matchesStatus = filterStatus === 'all' || card.status === filterStatus;
    const matchesSearch = 
      card.card_uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.nis?.includes(searchQuery);
    
    return matchesStatus && matchesSearch;
  });

  // Statistics
  const stats = {
    total: cards.length,
    active: cards.filter(c => c.status === 'active').length,
    blocked: cards.filter(c => c.status === 'blocked').length,
    lost: cards.filter(c => c.status === 'lost').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-300';
      case 'lost': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'blocked': return 'Diblokir';
      case 'lost': return 'Hilang';
      case 'expired': return 'Kadaluarsa';
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Manajemen Kartu RFID
          </h1>
          <p className="text-gray-400 mt-1">Kelola kartu RFID untuk absensi gerbang</p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5" />
          Daftarkan Kartu Baru
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/40 rounded-xl p-6 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm font-medium">Total Kartu</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <IdentificationIcon className="w-12 h-12 text-purple-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/40 rounded-xl p-6 shadow-lg shadow-green-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm font-medium">Kartu Aktif</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.active}</p>
            </div>
            <div className="text-4xl">✓</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/40 rounded-xl p-6 shadow-lg shadow-red-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300 text-sm font-medium">Diblokir</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.blocked}</p>
            </div>
            <div className="text-4xl">🚫</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/40 rounded-xl p-6 shadow-lg shadow-yellow-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300 text-sm font-medium">Hilang</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.lost}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Cari UID kartu, nama siswa, atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="blocked">Diblokir</option>
            <option value="lost">Hilang</option>
            <option value="expired">Kadaluarsa</option>
          </select>
        </div>
      </div>

      {/* Cards Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Memuat data kartu...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 border border-gray-700 rounded-xl">
          <IdentificationIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {searchQuery || filterStatus !== 'all' 
              ? 'Tidak ada kartu yang sesuai dengan filter'
              : 'Belum ada kartu yang terdaftar'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">UID Kartu</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Siswa</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NIS</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kelas</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Tap</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Terakhir Digunakan</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-purple-400 font-medium">{card.card_uid}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{card.student_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{card.nis || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{card.student_class || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(card.status)}`}>
                        {getStatusText(card.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{card.total_taps}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {card.last_used ? new Date(card.last_used).toLocaleString('id-ID') : 'Belum digunakan'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(card)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit status"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Hapus kartu"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Daftarkan Kartu RFID Baru</h2>
              <p className="text-gray-400 mt-1">Masukkan UID kartu dan pilih siswa</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  UID Kartu <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: A1B2C3D4"
                  value={newCardUID}
                  onChange={(e) => setNewCardUID(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono uppercase"
                />
                <p className="text-xs text-gray-400 mt-1">Tap kartu pada reader untuk mendapatkan UID</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Siswa <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Pilih Siswa</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} - {student.class} ({student.identity_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Catatan (opsional)
                </label>
                <textarea
                  value={cardNotes}
                  onChange={(e) => setCardNotes(e.target.value)}
                  rows={3}
                  placeholder="Catatan tambahan tentang kartu ini..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRegisterCard}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
              >
                Daftarkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {showEditModal && selectedCard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Edit Status Kartu</h2>
              <p className="text-gray-400 mt-1">Kartu: {selectedCard.card_uid}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status Kartu
                </label>
                <select
                  value={cardStatus}
                  onChange={(e) => setCardStatus(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Aktif</option>
                  <option value="blocked">Diblokir</option>
                  <option value="lost">Hilang</option>
                  <option value="expired">Kadaluarsa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Catatan
                </label>
                <textarea
                  value={cardNotes}
                  onChange={(e) => setCardNotes(e.target.value)}
                  rows={3}
                  placeholder="Tambahkan catatan perubahan status..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCard(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateCardStatus}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-lg"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
