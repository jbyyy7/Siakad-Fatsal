import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { User, ReportCard, Semester, AcademicYear } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';

export default function ReportCardViewPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [selectedReportCard, setSelectedReportCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadReportCards();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadReportCards = async () => {
    setLoading(true);
    try {
      let studentId = currentUser?.id;

      // If parent, get children (note: Parent role might not exist in UserRole enum yet)
      if (currentUser?.email && currentUser.role?.toString() === 'Parent') {
        const { data: contacts } = await supabase
          .from('parent_contacts')
          .select('student_id')
          .eq('parent_id', currentUser.id);
        
        if (contacts && contacts.length > 0) {
          studentId = contacts[0].student_id; // For now, show first child
        }
      }

      if (!studentId) return;

      const { data } = await supabase
        .from('report_cards')
        .select(`
          *,
          report_card_subjects(*),
          report_card_comments(*),
          semester:semesters(*)
        `)
        .eq('student_id', studentId)
        .eq('status', 'Published')
        .order('created_at', { ascending: false });

      setReportCards(data || []);
      
      // Auto-select first report card
      if (data && data.length > 0) {
        setSelectedReportCard(data[0]);
      }
    } catch (error) {
      console.error('Error loading report cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Rapor-${selectedReportCard?.student_name}-${selectedReportCard?.semester?.name}`,
  });

  const exportToPDF = async () => {
    if (!printRef.current || !selectedReportCard) return;
    
    setExporting(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Rapor-${selectedReportCard.student_name}-${selectedReportCard.semester?.name}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('❌ Gagal export PDF');
    } finally {
      setExporting(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50';
      case 'B': return 'text-blue-600 bg-blue-50';
      case 'C': return 'text-yellow-600 bg-yellow-50';
      case 'D': return 'text-orange-600 bg-orange-50';
      case 'E': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📊 Rapor Digital</h1>
          {selectedReportCard && (
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
              >
                {exporting ? '⏳ Exporting...' : '📥 Download PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                🖨️ Print
              </button>
            </div>
          )}
        </div>

        {loading && <div className="text-center py-8">⏳ Memuat rapor...</div>}

        {!loading && reportCards.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">📋 Belum ada rapor yang dipublikasikan</p>
          </div>
        )}

        {!loading && reportCards.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - List of Report Cards */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold mb-4">Daftar Rapor</h2>
              <div className="space-y-2">
                {reportCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedReportCard(card)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedReportCard?.id === card.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold">{card.semester?.name}</div>
                    <div className="text-sm text-gray-600">{card.class_name}</div>
                    <div className="text-sm mt-2">
                      <span className="font-medium">Rata-rata: </span>
                      <span className="text-blue-600 font-bold">{card.average_score}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Peringkat: {card.rank} dari {card.total_students}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content - Report Card Detail */}
            <div className="lg:col-span-3">
              {selectedReportCard && (
                <div ref={printRef} className="bg-white">
                  {/* Header */}
                  <div className="border-b-4 border-blue-600 pb-6 mb-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-2">RAPOR SISWA</h2>
                      <p className="text-lg text-gray-600">{selectedReportCard.semester?.name}</p>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">Nama Siswa:</span>
                        <p className="font-semibold text-lg">{selectedReportCard.student_name}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">NIS:</span>
                        <p className="font-semibold">{selectedReportCard.student_nis}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Kelas:</span>
                        <p className="font-semibold">{selectedReportCard.class_name}</p>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">Wali Kelas:</span>
                        <p className="font-semibold">{selectedReportCard.homeroom_teacher_name}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">Kepala Sekolah:</span>
                        <p className="font-semibold">{selectedReportCard.principal_name || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3 border-b pb-2">📅 Kehadiran</h3>
                    <div className="grid grid-cols-5 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{selectedReportCard.total_days}</div>
                        <div className="text-sm text-gray-600">Total Hari</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{selectedReportCard.present_days}</div>
                        <div className="text-sm text-gray-600">Hadir</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{selectedReportCard.sick_days}</div>
                        <div className="text-sm text-gray-600">Sakit</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedReportCard.permission_days}</div>
                        <div className="text-sm text-gray-600">Izin</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{selectedReportCard.absent_days}</div>
                        <div className="text-sm text-gray-600">Alpa</div>
                      </div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3 border-b pb-2">📚 Nilai Mata Pelajaran</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-blue-600 text-white">
                          <tr>
                            <th className="border border-blue-700 p-3 text-left">No</th>
                            <th className="border border-blue-700 p-3 text-left">Mata Pelajaran</th>
                            <th className="border border-blue-700 p-3 text-center w-24">Pengetahuan</th>
                            <th className="border border-blue-700 p-3 text-center w-24">Keterampilan</th>
                            <th className="border border-blue-700 p-3 text-center w-24">Nilai Akhir</th>
                            <th className="border border-blue-700 p-3 text-center w-20">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReportCard.report_card_subjects?.map((subject: any, index: number) => (
                            <React.Fragment key={subject.id}>
                              <tr className="hover:bg-gray-50">
                                <td className="border p-3 text-center">{index + 1}</td>
                                <td className="border p-3 font-medium">{subject.subject_name}</td>
                                <td className="border p-3 text-center font-semibold">{subject.knowledge_score}</td>
                                <td className="border p-3 text-center font-semibold">{subject.skill_score}</td>
                                <td className="border p-3 text-center font-bold text-lg">{subject.final_score}</td>
                                <td className="border p-3 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full font-bold text-lg ${getGradeColor(subject.grade)}`}>
                                    {subject.grade}
                                  </span>
                                </td>
                              </tr>
                              {subject.description && (
                                <tr>
                                  <td colSpan={6} className="border p-3 bg-gray-50 text-sm text-gray-700">
                                    <span className="font-semibold">Deskripsi: </span>{subject.description}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                          <tr className="bg-blue-50 font-bold">
                            <td colSpan={4} className="border p-3 text-right">TOTAL / RATA-RATA:</td>
                            <td className="border p-3 text-center text-lg text-blue-600">
                              {selectedReportCard.total_score} / {selectedReportCard.average_score}
                            </td>
                            <td className="border p-3 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full font-bold text-lg ${
                                getGradeColor(
                                  selectedReportCard.average_score >= 90 ? 'A' :
                                  selectedReportCard.average_score >= 80 ? 'B' :
                                  selectedReportCard.average_score >= 70 ? 'C' :
                                  selectedReportCard.average_score >= 60 ? 'D' : 'E'
                                )
                              }`}>
                                {selectedReportCard.average_score >= 90 ? 'A' :
                                 selectedReportCard.average_score >= 80 ? 'B' :
                                 selectedReportCard.average_score >= 70 ? 'C' :
                                 selectedReportCard.average_score >= 60 ? 'D' : 'E'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Ranking */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-400">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold mb-1">🏆 Peringkat Kelas</h3>
                        <p className="text-sm text-gray-600">Berdasarkan rata-rata nilai</p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-yellow-600">
                          #{selectedReportCard.rank}
                        </div>
                        <div className="text-sm text-gray-600">
                          dari {selectedReportCard.total_students} siswa
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {selectedReportCard.report_card_comments && selectedReportCard.report_card_comments.length > 0 && (
                    <div className="mb-6 space-y-4">
                      <h3 className="text-lg font-bold border-b pb-2">💬 Catatan & Komentar</h3>
                      
                      {selectedReportCard.report_card_comments.map((comment: any) => (
                        <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                          <div className="font-semibold text-sm text-gray-600 mb-2">
                            {comment.comment_type === 'Attitude' && '🎭 Catatan Sikap'}
                            {comment.comment_type === 'Achievement' && '🏅 Catatan Prestasi'}
                            {comment.comment_type === 'Homeroom' && '👨‍🏫 Catatan Wali Kelas'}
                            {comment.comment_type === 'Principal' && '🎓 Catatan Kepala Sekolah'}
                          </div>
                          <p className="text-gray-800">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t">
                    <div className="text-center text-sm text-gray-600">
                      <p>Rapor diterbitkan pada: {new Date(selectedReportCard.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</p>
                      <p className="mt-2 text-xs">Dokumen ini sah dan dihasilkan secara elektronik</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
