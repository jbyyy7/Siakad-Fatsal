import React from 'react';
import Card from '../Card';
import { User } from '../../types';
import { MOCK_GRADES, MOCK_TEACHER_NOTES } from '../../constants';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { SparklesIcon } from '../icons/SparklesIcon';

interface GradesPageProps {
    user: User;
}

const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    return 'bg-red-500';
};

const GradesPage: React.FC<GradesPageProps> = ({ user }) => {
    const myGrades = MOCK_GRADES[user.id] || [];
    const averageScore = myGrades.length > 0 ? (myGrades.reduce((acc, curr) => acc + curr.score, 0) / myGrades.length).toFixed(1) : 'N/A';
    const teacherNote = MOCK_TEACHER_NOTES[user.id] || "Belum ada catatan dari wali kelas.";

    // Mock attendance data for the report card
    const attendanceSummary = {
        hadir: 20,
        sakit: 2,
        izin: 1,
        alpha: 0,
    };
    
    const totalDays = Object.values(attendanceSummary).reduce((a, b) => a + b, 0);
    const attendancePercentage = ((attendanceSummary.hadir / totalDays) * 100).toFixed(0);

    const aiReview = `Berdasarkan analisis nilai, ${user.name} menunjukkan keunggulan signifikan dalam bidang Sains (Kimia: A, Fisika: B+) dan Bahasa (Bahasa Indonesia: A). Ini menandakan kemampuan analisis dan pemahaman konsep yang kuat. Untuk meningkatkan performa secara keseluruhan, disarankan untuk memberikan perhatian lebih pada mata pelajaran Biologi. Strategi belajar visual dan praktik langsung mungkin bisa sangat membantu. Secara keseluruhan, potensi ${user.name} sangat besar!`;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Rapor Digital Akhir Semester</h2>
                <button
                    onClick={() => window.print()}
                    className="no-print flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Cetak Rapor
                </button>
            </div>

            <div id="printable-report-card" className="printable-area bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <div className="hidden print-header">
                    <h1>SIAKAD Fathus Salafi</h1>
                    <p>Laporan Hasil Belajar Siswa - Semester Ganjil 2024/2025</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 pb-4 border-b">
                    <div>
                        <p className="text-sm text-gray-500">Nama Siswa</p>
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
                        <p className="font-bold text-lg text-gray-800">{user.level}</p>
                    </div>
                </div>

                <Card title="Detail Nilai Akademik" icon={ChartBarIcon} className="shadow-none border">
                    <div className="overflow-x-auto">
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
                           "{teacherNote}"
                         </blockquote>
                         <p className="text-right text-sm font-semibold mt-4">- Eko Wibowo, S.Pd.</p>
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