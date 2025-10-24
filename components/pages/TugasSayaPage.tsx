import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { dataService } from '../../services/dataService';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ArrowUpTrayIcon } from '../icons/ArrowUpTrayIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';

interface TugasSayaPageProps {
  user: User;
}

type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'overdue';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  submittedDate?: string;
  grade?: number;
  maxGrade: number;
  teacherName: string;
  teacherFeedback?: string;
  attachmentUrl?: string;
  submissionUrl?: string;
}

const TugasSayaPage: React.FC<TugasSayaPageProps> = ({ user }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Demo data
  useEffect(() => {
    const loadAssignments = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        const demoAssignments: Assignment[] = [
          {
            id: '1',
            title: 'Tugas Matematika: Persamaan Linear',
            subject: 'Matematika',
            description: 'Kerjakan soal persamaan linear halaman 45-50. Upload jawaban dalam format PDF.',
            dueDate: '2024-02-15',
            status: 'pending',
            maxGrade: 100,
            teacherName: 'Ibu Siti Nurhaliza'
          },
          {
            id: '2',
            title: 'Laporan Praktikum Fotosintesis',
            subject: 'Biologi',
            description: 'Buat laporan praktikum fotosintesis lengkap dengan data hasil percobaan.',
            dueDate: '2024-02-10',
            status: 'submitted',
            submittedDate: '2024-02-09',
            maxGrade: 100,
            teacherName: 'Pak Ahmad Dahlan',
            submissionUrl: '/submissions/bio-report.pdf'
          },
          {
            id: '3',
            title: 'Essay: Perang Kemerdekaan',
            subject: 'Sejarah',
            description: 'Tulis essay tentang peristiwa penting dalam perang kemerdekaan Indonesia (min. 1000 kata).',
            dueDate: '2024-02-05',
            status: 'graded',
            submittedDate: '2024-02-04',
            grade: 85,
            maxGrade: 100,
            teacherName: 'Ibu Dewi Sartika',
            teacherFeedback: 'Bagus! Analisis sudah cukup mendalam. Tingkatkan referensi.',
            submissionUrl: '/submissions/history-essay.pdf'
          },
          {
            id: '4',
            title: 'Speaking Practice: Self Introduction',
            subject: 'Bahasa Inggris',
            description: 'Record video perkenalan diri dalam bahasa Inggris (3-5 menit).',
            dueDate: '2024-01-30',
            status: 'overdue',
            maxGrade: 100,
            teacherName: 'Mr. John Smith'
          },
          {
            id: '5',
            title: 'Soal Latihan: Gerak Parabola',
            subject: 'Fisika',
            description: 'Kerjakan 10 soal tentang gerak parabola. Tunjukkan langkah penyelesaian.',
            dueDate: '2024-02-20',
            status: 'pending',
            maxGrade: 100,
            teacherName: 'Pak Bambang Susanto'
          },
          {
            id: '6',
            title: 'Praktikum: Titrasi Asam Basa',
            subject: 'Kimia',
            description: 'Lakukan praktikum titrasi dan buat laporan hasil percobaan.',
            dueDate: '2024-02-12',
            status: 'graded',
            submittedDate: '2024-02-11',
            grade: 92,
            maxGrade: 100,
            teacherName: 'Ibu Sri Mulyani',
            teacherFeedback: 'Excellent work! Data akurat dan analisis mendalam.',
            submissionUrl: '/submissions/chemistry-lab.pdf'
          },
          {
            id: '7',
            title: 'Project: Membuat Website Sederhana',
            subject: 'Informatika',
            description: 'Buat website sederhana menggunakan HTML, CSS, dan JavaScript. Upload kode ke GitHub.',
            dueDate: '2024-02-25',
            status: 'pending',
            maxGrade: 100,
            teacherName: 'Pak Andi Wijaya'
          },
          {
            id: '8',
            title: 'Analisis Pasar: Produk Lokal',
            subject: 'Ekonomi',
            description: 'Analisis kondisi pasar untuk produk lokal di daerah kalian.',
            dueDate: '2024-02-18',
            status: 'submitted',
            submittedDate: '2024-02-17',
            maxGrade: 100,
            teacherName: 'Ibu Kartini Hadiningrat',
            submissionUrl: '/submissions/market-analysis.pdf'
          }
        ];

        setAssignments(demoAssignments);
        setFilteredAssignments(demoAssignments);
      } catch (error) {
        console.error('Failed to load assignments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignments();
  }, [user]);

  // Filter assignments
  useEffect(() => {
    let filtered = [...assignments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Sort by due date (nearest first)
    filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    setFilteredAssignments(filtered);
  }, [statusFilter, assignments]);

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Belum Dikerjakan</span>;
      case 'submitted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Sudah Dikumpulkan</span>;
      case 'graded':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Sudah Dinilai</span>;
      case 'overdue':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Terlambat</span>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: AssignmentStatus) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'submitted':
        return <ArrowUpTrayIcon className="h-5 w-5 text-blue-600" />;
      case 'graded':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'overdue':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="text-red-600 font-semibold">Terlambat {Math.abs(diffDays)} hari</span>;
    if (diffDays === 0) return <span className="text-orange-600 font-semibold">Hari ini!</span>;
    if (diffDays === 1) return <span className="text-orange-500 font-semibold">Besok</span>;
    if (diffDays <= 3) return <span className="text-yellow-600 font-semibold">{diffDays} hari lagi</span>;
    return <span className="text-gray-600">{diffDays} hari lagi</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSubmitClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !submissionFile) {
      alert('Pilih file untuk dikumpulkan');
      return;
    }

    // TODO: Implement actual file upload
    alert(`Tugas "${selectedAssignment.title}" berhasil dikumpulkan!`);
    setShowSubmitModal(false);
    setSelectedAssignment(null);
    setSubmissionFile(null);
    setSubmissionNotes('');
  };

  const statusCounts = {
    all: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    graded: assignments.filter(a => a.status === 'graded').length,
    overdue: assignments.filter(a => a.status === 'overdue').length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-8 w-8 text-brand-600" />
            Tugas Saya
          </h1>
          <p className="text-gray-600 mt-1">Kelola dan kumpulkan tugas pelajaran</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-800">{statusCounts.all}</div>
          <div className="text-sm text-gray-600">Total Tugas</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-sm text-gray-600">Belum Dikerjakan</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{statusCounts.submitted}</div>
          <div className="text-sm text-gray-600">Dikumpulkan</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{statusCounts.graded}</div>
          <div className="text-sm text-gray-600">Dinilai</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{statusCounts.overdue}</div>
          <div className="text-sm text-gray-600">Terlambat</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AssignmentStatus | 'all')}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="all">Semua Tugas ({statusCounts.all})</option>
          <option value="pending">Belum Dikerjakan ({statusCounts.pending})</option>
          <option value="submitted">Sudah Dikumpulkan ({statusCounts.submitted})</option>
          <option value="graded">Sudah Dinilai ({statusCounts.graded})</option>
          <option value="overdue">Terlambat ({statusCounts.overdue})</option>
        </select>
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat tugas...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada tugas ditemukan</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tugas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenggat Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssignments.map(assignment => (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(assignment.status)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{assignment.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{assignment.subject}</div>
                            <div className="text-sm text-gray-500 mt-1">{assignment.description}</div>
                            <div className="text-xs text-gray-400 mt-1">Pengajar: {assignment.teacherName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(assignment.dueDate)}</div>
                        <div className="text-sm mt-1">{getDaysRemaining(assignment.dueDate)}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(assignment.status)}
                        {assignment.submittedDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Dikumpulkan: {formatDate(assignment.submittedDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {assignment.grade !== undefined ? (
                          <div>
                            <div className="text-lg font-bold text-gray-900">{assignment.grade}/{assignment.maxGrade}</div>
                            {assignment.teacherFeedback && (
                              <div className="text-xs text-gray-600 mt-1 italic">"{assignment.teacherFeedback}"</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {assignment.status === 'pending' || assignment.status === 'overdue' ? (
                          <button
                            onClick={() => handleSubmitClick(assignment)}
                            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                          >
                            Kumpulkan
                          </button>
                        ) : assignment.submissionUrl ? (
                          <a
                            href={assignment.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            Lihat
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredAssignments.map(assignment => (
              <div key={assignment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">
                    {getStatusIcon(assignment.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                    <div className="text-sm text-gray-600 mb-2">{assignment.subject}</div>
                    {getStatusBadge(assignment.status)}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tenggat:</span>
                    <span className="font-medium text-gray-900">{formatDate(assignment.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sisa Waktu:</span>
                    {getDaysRemaining(assignment.dueDate)}
                  </div>
                  {assignment.submittedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dikumpulkan:</span>
                      <span className="font-medium text-gray-900">{formatDate(assignment.submittedDate)}</span>
                    </div>
                  )}
                  {assignment.grade !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nilai:</span>
                      <span className="font-bold text-lg text-gray-900">{assignment.grade}/{assignment.maxGrade}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pengajar:</span>
                    <span className="font-medium text-gray-900">{assignment.teacherName}</span>
                  </div>
                </div>

                {assignment.teacherFeedback && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Feedback Pengajar:</p>
                    <p className="text-sm text-gray-700 italic">"{assignment.teacherFeedback}"</p>
                  </div>
                )}

                {assignment.status === 'pending' || assignment.status === 'overdue' ? (
                  <button
                    onClick={() => handleSubmitClick(assignment)}
                    className="w-full px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Kumpulkan Tugas
                  </button>
                ) : assignment.submissionUrl ? (
                  <a
                    href={assignment.submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    Lihat Pengumpulan
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Kumpulkan Tugas</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedAssignment.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Format: PDF, DOC, DOCX, ZIP (Max: 10MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (opsional)
                </label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Tambahkan catatan untuk pengajar..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedAssignment(null);
                  setSubmissionFile(null);
                  setSubmissionNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitAssignment}
                className="flex-1 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TugasSayaPage;
