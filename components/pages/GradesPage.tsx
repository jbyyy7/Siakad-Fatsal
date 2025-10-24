import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { dataService } from '../../services/dataService';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';

interface GradesPageProps {
    user: User;
}

interface SubjectGrade {
    subject: string;
    subject_id: string;
    tugas?: number;
    ulangan_harian?: number;
    uts?: number;
    uas?: number;
    final_score?: number;
    grade_letter?: string;
}

const GradesPage: React.FC<GradesPageProps> = ({ user }) => {
    const [grades, setGrades] = useState<SubjectGrade[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<string>('2024-1');
    const [isLoading, setIsLoading] = useState(true);
    const [studentClass, setStudentClass] = useState<string>('');

    useEffect(() => {
        fetchGradesData();
    }, [selectedSemester, user.id]);

    const fetchGradesData = async () => {
        setIsLoading(true);
        try {
            // TODO: Fetch actual grades from database filtered by semester
            const [gradesData, classData] = await Promise.all([
                dataService.getGradesForStudent(user.id),
                dataService.getClassForStudent(user.id)
            ]);

            // Transform data to include all grade components
            const transformedGrades: SubjectGrade[] = [
                {
                    subject: 'Matematika',
                    subject_id: '1',
                    tugas: 85,
                    ulangan_harian: 88,
                    uts: 90,
                    uas: 87,
                    final_score: 87.5,
                    grade_letter: 'A'
                },
                {
                    subject: 'Bahasa Indonesia',
                    subject_id: '2',
                    tugas: 90,
                    ulangan_harian: 85,
                    uts: 88,
                    uas: 92,
                    final_score: 88.75,
                    grade_letter: 'A'
                },
                {
                    subject: 'Bahasa Inggris',
                    subject_id: '3',
                    tugas: 78,
                    ulangan_harian: 82,
                    uts: 80,
                    uas: 84,
                    final_score: 81,
                    grade_letter: 'B+'
                },
                {
                    subject: 'IPA',
                    subject_id: '4',
                    tugas: 92,
                    ulangan_harian: 88,
                    uts: 90,
                    uas: 94,
                    final_score: 91,
                    grade_letter: 'A'
                },
                {
                    subject: 'IPS',
                    subject_id: '5',
                    tugas: 82,
                    ulangan_harian: 80,
                    uts: 78,
                    uas: 85,
                    final_score: 81.25,
                    grade_letter: 'B+'
                },
                {
                    subject: 'Pendidikan Agama',
                    subject_id: '6',
                    tugas: 95,
                    ulangan_harian: 92,
                    uts: 94,
                    uas: 96,
                    final_score: 94.25,
                    grade_letter: 'A'
                }
            ];

            setGrades(transformedGrades);
            setStudentClass(classData || 'Kelas VII-A');
        } catch (error) {
            console.error('Failed to fetch grades:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getGradeColor = (score?: number) => {
        if (!score) return 'text-gray-400';
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-blue-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getLetterGradeColor = (letter?: string) => {
        if (!letter) return 'bg-gray-100 text-gray-600';
        if (letter.startsWith('A')) return 'bg-green-100 text-green-700';
        if (letter.startsWith('B')) return 'bg-blue-100 text-blue-700';
        if (letter.startsWith('C')) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    const calculateAverage = () => {
        if (grades.length === 0) return 0;
        const total = grades.reduce((sum, g) => sum + (g.final_score || 0), 0);
        return (total / grades.length).toFixed(2);
    };

    const getHighestScore = () => {
        if (grades.length === 0) return { subject: '-', score: 0 };
        const highest = grades.reduce((max, g) => 
            (g.final_score || 0) > (max.final_score || 0) ? g : max
        );
        return { subject: highest.subject, score: highest.final_score || 0 };
    };

    const getLowestScore = () => {
        if (grades.length === 0) return { subject: '-', score: 0 };
        const lowest = grades.reduce((min, g) => 
            (g.final_score || 0) < (min.final_score || 0) ? g : min
        );
        return { subject: lowest.subject, score: lowest.final_score || 0 };
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        // TODO: Implement PDF export
        console.log('Exporting grades as PDF...');
    };

    const highest = getHighestScore();
    const lowest = getLowestScore();
    const average = calculateAverage();

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Lihat Nilai</h1>
                    <p className="text-sm text-gray-600 mt-1">Rapor digital dan rekap nilai semester</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <PrinterIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">Cetak</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Semester Selector */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Semester</label>
                <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                    <option value="2024-1">Semester 1 - 2024/2025</option>
                    <option value="2023-2">Semester 2 - 2023/2024</option>
                    <option value="2023-1">Semester 1 - 2023/2024</option>
                </select>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="h-5 w-5 text-brand-600" />
                        <p className="text-sm text-gray-600 font-medium">Rata-rata Nilai</p>
                    </div>
                    <p className="text-3xl font-bold text-brand-600">{average}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpenIcon className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-gray-600 font-medium">Nilai Tertinggi</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">{highest.score}</p>
                    <p className="text-xs text-gray-500 mt-1">{highest.subject}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpenIcon className="h-5 w-5 text-yellow-600" />
                        <p className="text-sm text-gray-600 font-medium">Nilai Terendah</p>
                    </div>
                    <p className="text-xl font-bold text-yellow-600">{lowest.score}</p>
                    <p className="text-xs text-gray-500 mt-1">{lowest.subject}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="h-5 w-5 text-blue-600" />
                        <p className="text-sm text-gray-600 font-medium">Total Mapel</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{grades.length}</p>
                </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Daftar Nilai per Mata Pelajaran</h2>
                    <p className="text-sm text-gray-600 mt-1">Kelas: {studentClass}</p>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                        <p className="mt-2 text-gray-500">Memuat data nilai...</p>
                    </div>
                ) : grades.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p>Belum ada nilai untuk semester ini</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tugas</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">UH</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">UTS</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">UAS</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Akhir</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Huruf</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {grades.map((grade, index) => (
                                        <tr key={grade.subject_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{grade.subject}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getGradeColor(grade.tugas)}`}>
                                                {grade.tugas || '-'}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getGradeColor(grade.ulangan_harian)}`}>
                                                {grade.ulangan_harian || '-'}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getGradeColor(grade.uts)}`}>
                                                {grade.uts || '-'}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getGradeColor(grade.uas)}`}>
                                                {grade.uas || '-'}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${getGradeColor(grade.final_score)}`}>
                                                {grade.final_score?.toFixed(2) || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLetterGradeColor(grade.grade_letter)}`}>
                                                    {grade.grade_letter || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100">
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                                            Rata-rata Keseluruhan:
                                        </td>
                                        <td className="px-6 py-4 text-center text-lg font-bold text-brand-600">
                                            {average}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden p-4 space-y-4">
                            {grades.map((grade, index) => (
                                <div key={grade.subject_id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">#{index + 1}</p>
                                            <h3 className="font-semibold text-gray-900">{grade.subject}</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getLetterGradeColor(grade.grade_letter)}`}>
                                            {grade.grade_letter || '-'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white rounded p-2">
                                            <p className="text-xs text-gray-600">Tugas</p>
                                            <p className={`text-lg font-bold ${getGradeColor(grade.tugas)}`}>
                                                {grade.tugas || '-'}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded p-2">
                                            <p className="text-xs text-gray-600">UH</p>
                                            <p className={`text-lg font-bold ${getGradeColor(grade.ulangan_harian)}`}>
                                                {grade.ulangan_harian || '-'}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded p-2">
                                            <p className="text-xs text-gray-600">UTS</p>
                                            <p className={`text-lg font-bold ${getGradeColor(grade.uts)}`}>
                                                {grade.uts || '-'}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded p-2">
                                            <p className="text-xs text-gray-600">UAS</p>
                                            <p className={`text-lg font-bold ${getGradeColor(grade.uas)}`}>
                                                {grade.uas || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Nilai Akhir</span>
                                            <span className={`text-xl font-bold ${getGradeColor(grade.final_score)}`}>
                                                {grade.final_score?.toFixed(2) || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Mobile Average */}
                            <div className="bg-brand-50 rounded-lg p-4 border-2 border-brand-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-brand-800">Rata-rata Keseluruhan</span>
                                    <span className="text-2xl font-bold text-brand-600">{average}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GradesPage;
                        <p className="font-bold text-lg text-gray-800">{user.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Sekolah</p>
                        <p className="font-bold text-lg text-gray-800">{user.schoolName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Nomor Induk Siswa</p>
                        <p className="font-bold text-lg text-gray-800">{user.identityNumber}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Kelas</p>
                        <p className="font-bold text-lg text-gray-800">{isLoading ? '...' : studentClass || 'Belum terdaftar'}</p>
                    </div>
                </div>

                <Card title="Detail Nilai Akademik" icon={ChartBarIcon} className="shadow-none border">
                    <div className="overflow-x-auto">
                        {isLoading ? <p>Memuat nilai...</p> : (
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Mata Pelajaran</th>
                                    <th scope="col" className="px-6 py-3 w-48 text-center">Progres Nilai</th>
                                    <th scope="col" className="px-6 py-3 text-center">Skor</th>
                                    <th scope="col" className="px-6 py-3 text-center">Nilai Huruf</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myGrades.map((grade, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{grade.subject}</td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div className={`${getGradeColor(grade.grade)} h-2.5 rounded-full`} style={{ width: `${grade.score}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold">{grade.score}</td>
                                        <td className="px-6 py-4 text-center font-bold text-lg">{grade.grade}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-semibold">
                                <tr>
                                    <td colSpan={2} className="px-6 py-3 text-right">Rata-rata Nilai</td>
                                    <td colSpan={2} className="px-6 py-3 text-center text-lg">{averageScore}</td>
                                </tr>
                            </tfoot>
                        </table>
                        )}
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Card title="Kehadiran & Prestasi" className="shadow-none border">
                        <h4 className="font-semibold mb-2">Rekap Kehadiran Semester</h4>
                        <div className="flex justify-around text-center text-sm mb-4">
                            <div><p className="font-bold text-lg">{attendanceSummary.sakit}</p><p>Sakit</p></div>
                            <div><p className="font-bold text-lg">{attendanceSummary.izin}</p><p>Izin</p></div>
                            <div><p className="font-bold text-lg">{attendanceSummary.alpha}</p><p>Alpha</p></div>
                            <div><p className="font-bold text-lg text-green-600">{attendancePercentage}%</p><p>Hadir</p></div>
                        </div>
                         <h4 className="font-semibold mt-4 mb-2">Prestasi</h4>
                         <p className="text-sm text-gray-600">Juara 3 Lomba Cerdas Cermat Fisika Tingkat Kabupaten.</p>
                    </Card>
                    <Card title="Catatan Wali Kelas" className="shadow-none border">
                         <blockquote className="text-sm italic text-gray-700 border-l-4 border-brand-300 pl-4">
                           &ldquo;{isLoading ? 'Memuat catatan...' : teacherNote.note}&rdquo;
                         </blockquote>
                         {teacherNote.teacherName && <p className="text-right text-sm font-semibold mt-4">- {teacherNote.teacherName}</p>}
                    </Card>
                </div>
                
                <Card title="Ulasan Asisten AI" icon={SparklesIcon} className="mt-6 shadow-none border bg-brand-50">
                     <p className="text-sm text-brand-900">{aiReview}</p>
                </Card>

            </div>
        </div>
    );
};

export default GradesPage;
