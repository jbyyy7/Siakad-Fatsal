import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { dataService } from '../../services/dataService';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { MagnifyingGlassIcon } from '../icons/MagnifyingGlassIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { LinkIcon } from '../icons/LinkIcon';

interface MateriPelajaranPageProps {
  user: User;
}

type MaterialType = 'PDF' | 'Video' | 'Link' | 'Document' | 'Presentation';

interface Material {
  id: string;
  title: string;
  subject: string;
  type: MaterialType;
  description: string;
  uploadDate: string;
  fileUrl?: string;
  linkUrl?: string;
  fileSize?: string;
  teacherName: string;
}

const MateriPelajaranPage: React.FC<MateriPelajaranPageProps> = ({ user }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<MaterialType | 'all'>('all');

  // Demo data
  useEffect(() => {
    const loadMaterials = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        const demoMaterials: Material[] = [
          {
            id: '1',
            title: 'Pengantar Matematika Dasar',
            subject: 'Matematika',
            type: 'PDF',
            description: 'Materi pengantar tentang konsep dasar matematika untuk semester 1',
            uploadDate: '2024-01-15',
            fileUrl: '/materials/math-intro.pdf',
            fileSize: '2.5 MB',
            teacherName: 'Ibu Siti Nurhaliza'
          },
          {
            id: '2',
            title: 'Video Tutorial: Photosynthesis',
            subject: 'Biologi',
            type: 'Video',
            description: 'Video penjelasan lengkap tentang proses fotosintesis pada tumbuhan',
            uploadDate: '2024-01-18',
            linkUrl: 'https://youtube.com/watch?v=example',
            fileSize: '125 MB',
            teacherName: 'Pak Ahmad Dahlan'
          },
          {
            id: '3',
            title: 'Sejarah Kemerdekaan Indonesia',
            subject: 'Sejarah',
            type: 'Presentation',
            description: 'Slide presentasi tentang perjuangan kemerdekaan Indonesia',
            uploadDate: '2024-01-20',
            fileUrl: '/materials/sejarah-kemerdekaan.pptx',
            fileSize: '8.3 MB',
            teacherName: 'Ibu Dewi Sartika'
          },
          {
            id: '4',
            title: 'Referensi Grammar Bahasa Inggris',
            subject: 'Bahasa Inggris',
            type: 'Link',
            description: 'Link ke website untuk belajar grammar bahasa Inggris',
            uploadDate: '2024-01-22',
            linkUrl: 'https://englishgrammar.example.com',
            teacherName: 'Mr. John Smith'
          },
          {
            id: '5',
            title: 'Soal Latihan Fisika Bab 3',
            subject: 'Fisika',
            type: 'PDF',
            description: 'Kumpulan soal latihan untuk persiapan ujian fisika bab 3',
            uploadDate: '2024-01-25',
            fileUrl: '/materials/physics-exercise.pdf',
            fileSize: '1.2 MB',
            teacherName: 'Pak Bambang Susanto'
          },
          {
            id: '6',
            title: 'Kamus Istilah Kimia',
            subject: 'Kimia',
            type: 'Document',
            description: 'Dokumen berisi istilah-istilah penting dalam kimia',
            uploadDate: '2024-01-28',
            fileUrl: '/materials/chemistry-glossary.docx',
            fileSize: '450 KB',
            teacherName: 'Ibu Sri Mulyani'
          },
          {
            id: '7',
            title: 'Tutorial Algoritma Sorting',
            subject: 'Informatika',
            type: 'Video',
            description: 'Video tutorial tentang berbagai algoritma sorting (bubble, quick, merge)',
            uploadDate: '2024-02-01',
            linkUrl: 'https://youtube.com/watch?v=sorting-tutorial',
            fileSize: '89 MB',
            teacherName: 'Pak Andi Wijaya'
          },
          {
            id: '8',
            title: 'Ekonomi Makro: Konsep Dasar',
            subject: 'Ekonomi',
            type: 'PDF',
            description: 'Materi tentang konsep dasar ekonomi makro dan penerapannya',
            uploadDate: '2024-02-03',
            fileUrl: '/materials/macro-economics.pdf',
            fileSize: '3.7 MB',
            teacherName: 'Ibu Kartini Hadiningrat'
          }
        ];

        setMaterials(demoMaterials);
        setFilteredMaterials(demoMaterials);
      } catch (error) {
        console.error('Failed to load materials:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMaterials();
  }, [user]);

  // Filter materials
  useEffect(() => {
    let filtered = [...materials];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by subject
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(material => material.subject === subjectFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(material => material.type === typeFilter);
    }

    setFilteredMaterials(filtered);
  }, [searchQuery, subjectFilter, typeFilter, materials]);

  const subjects = Array.from(new Set(materials.map(m => m.subject)));

  const getTypeIcon = (type: MaterialType) => {
    switch (type) {
      case 'PDF':
      case 'Document':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'Video':
        return <VideoCameraIcon className="h-5 w-5" />;
      case 'Link':
        return <LinkIcon className="h-5 w-5" />;
      case 'Presentation':
        return <DocumentTextIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getTypeBadgeColor = (type: MaterialType) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-100 text-red-800';
      case 'Video':
        return 'bg-purple-100 text-purple-800';
      case 'Link':
        return 'bg-blue-100 text-blue-800';
      case 'Document':
        return 'bg-green-100 text-green-800';
      case 'Presentation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (material: Material) => {
    if (material.fileUrl) {
      // TODO: Implement actual download
      alert(`Downloading: ${material.title}`);
    } else if (material.linkUrl) {
      window.open(material.linkUrl, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpenIcon className="h-8 w-8 text-brand-600" />
            Materi Pelajaran
          </h1>
          <p className="text-gray-600 mt-1">Download dan akses materi pembelajaran</p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-brand-600">{filteredMaterials.length}</span> materi
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Materi</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MaterialType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">Semua Tipe</option>
              <option value="PDF">PDF</option>
              <option value="Video">Video</option>
              <option value="Document">Dokumen</option>
              <option value="Presentation">Presentasi</option>
              <option value="Link">Link</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat materi...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada materi yang ditemukan</p>
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
                      Materi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ukuran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Upload
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMaterials.map(material => (
                    <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(material.type)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{material.title}</div>
                            <div className="text-sm text-gray-500 mt-1">{material.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Oleh: {material.teacherName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{material.subject}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(material.type)}`}>
                          {material.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{material.fileSize || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatDate(material.uploadDate)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDownload(material)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                        >
                          <DownloadIcon className="h-4 w-4" />
                          {material.type === 'Link' ? 'Buka' : 'Download'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredMaterials.map(material => (
              <div key={material.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                    {getTypeIcon(material.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{material.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(material.type)}`}>
                      {material.type}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{material.description}</p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mata Pelajaran:</span>
                    <span className="font-medium text-gray-900">{material.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ukuran:</span>
                    <span className="font-medium text-gray-900">{material.fileSize || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Upload:</span>
                    <span className="font-medium text-gray-900">{formatDate(material.uploadDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pengajar:</span>
                    <span className="font-medium text-gray-900">{material.teacherName}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(material)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {material.type === 'Link' ? 'Buka Link' : 'Download Materi'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MateriPelajaranPage;
