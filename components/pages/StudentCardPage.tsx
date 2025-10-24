/**
 * Student Card Generator Page (Kartu Pelajar Digital)
 * Features:
 * - Generate individual student card
 * - Batch generate for entire class
 * - Export to PDF
 * - Print directly
 * - Preview before download
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, Class, School, UserRole } from '../../types';
import { dataService } from '../../services/dataService';
import QRCode from 'react-qr-code';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';

interface StudentCardPageProps {
  user: User;
}

const StudentCardPage: React.FC<StudentCardPageProps> = ({ user }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [currentYear, setCurrentYear] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'batch'>('single');
  
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    
    // Get current academic year
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Academic year starts in July (month 6)
    if (month >= 6) {
      setCurrentYear(`${year}/${year + 1}`);
    } else {
      setCurrentYear(`${year - 1}/${year}`);
    }
  }, []);

  async function loadData() {
    try {
      const [schoolsData, classesData] = await Promise.all([
        dataService.getSchools(),
        dataService.getClasses({ schoolId: user.schoolId || undefined })
      ]);
      
      setSchools(schoolsData);
      setClasses(classesData);
      
      // Auto-select school if user has one
      if (user.schoolId && schoolsData.length > 0) {
        const school = schoolsData.find(s => s.id === user.schoolId);
        if (school) {
          setSelectedSchoolId(school.id);
          setSelectedSchool(school);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async function loadStudents(classId: string) {
    try {
      setLoading(true);
      const allStudents = await dataService.getUsers({
        role: UserRole.STUDENT,
        schoolId: user.schoolId
      });
      // Filter by classId if needed
      const studentsData = classId
        ? allStudents.filter(s => (s as any).classId === classId)
        : allStudents;
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSchoolChange(schoolId: string) {
    setSelectedSchoolId(schoolId);
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    setSelectedClassId('');
    setStudents([]);
    setSelectedStudent(null);
    
    // Filter classes
    const schoolClasses = classes.filter(c => c.schoolId === schoolId);
    setClasses(schoolClasses);
  }

  function handleClassChange(classId: string) {
    setSelectedClassId(classId);
    setSelectedStudent(null);
    if (classId) {
      loadStudents(classId);
    } else {
      setStudents([]);
    }
  }

  function handleStudentSelect(student: User) {
    setSelectedStudent(student);
    setViewMode('single');
  }

  /**
   * Export single card to PDF
   */
  async function exportToPDF(student: User) {
    if (!cardRef.current) return;
    
    try {
      setLoading(true);
      
      // Create temporary card element for this student
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.innerHTML = cardRef.current.innerHTML;
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      document.body.removeChild(tempDiv);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [85.6, 53.98] // Credit card size (ID-1 format)
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      pdf.save(`Kartu-Pelajar-${student.identityNumber}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Gagal export PDF. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Export batch cards to PDF (all students in class)
   */
  async function exportBatchToPDF() {
    if (students.length === 0) {
      alert('Tidak ada siswa untuk diexport');
      return;
    }
    
    try {
      setLoading(true);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      const cols = 2; // 2 cards per row
      const rows = 5; // 5 rows per page = 10 cards per page
      const marginX = 10;
      const marginY = 10;
      const gapX = 10;
      const gapY = 10;
      
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const row = Math.floor((i % (rows * cols)) / cols);
        const col = i % cols;
        const page = Math.floor(i / (rows * cols));
        
        if (i > 0 && i % (rows * cols) === 0) {
          pdf.addPage();
        }
        
        // Render card to canvas
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.innerHTML = renderCardHTML(student);
        document.body.appendChild(tempDiv);
        
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        document.body.removeChild(tempDiv);
        
        const imgData = canvas.toDataURL('image/png');
        const x = marginX + col * (cardWidth + gapX);
        const y = marginY + row * (cardHeight + gapY);
        
        pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
      }
      
      const className = classes.find(c => c.id === selectedClassId)?.name || 'Unknown';
      pdf.save(`Kartu-Pelajar-${className}.pdf`);
    } catch (error) {
      console.error('Failed to export batch PDF:', error);
      alert('Gagal export batch PDF. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Print handler
   */
  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: viewMode === 'single' && selectedStudent 
      ? `Kartu-Pelajar-${selectedStudent.name}`
      : `Kartu-Pelajar-${selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : 'Batch'}`,
  });

  /**
   * Render card HTML (for batch export)
   */
  function renderCardHTML(student: User): string {
    return `
      <div style="width: 320px; height: 200px; border: 2px solid #3b82f6; border-radius: 12px; padding: 16px; background: white; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 12px;">
          <h2 style="margin: 0; color: #1e40af; font-size: 16px;">${selectedSchool?.name || 'Nama Sekolah'}</h2>
          <p style="margin: 4px 0; color: #64748b; font-size: 12px;">KARTU PELAJAR</p>
        </div>
        
        <div style="display: flex; gap: 12px;">
          <div style="flex-shrink: 0;">
            ${student.photoUrl 
              ? `<img src="${student.photoUrl}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;" />`
              : `<div style="width: 80px; height: 100px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px;">No Photo</div>`
            }
          </div>
          
          <div style="flex: 1; font-size: 11px;">
            <div style="margin-bottom: 6px;">
              <strong>Nama:</strong><br/>
              ${student.name}
            </div>
            <div style="margin-bottom: 6px;">
              <strong>NIS:</strong> ${student.identityNumber}
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Kelas:</strong> ${classes.find(c => c.id === selectedClassId)?.name || '-'}
            </div>
            <div>
              <strong>Tahun Ajaran:</strong> ${currentYear}
            </div>
          </div>
          
          <div style="flex-shrink: 0; text-align: center;">
            <div style="background: white; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;">
              <!-- QR Code would go here -->
              <div style="width: 60px; height: 60px; background: #f1f5f9;"></div>
            </div>
            <p style="margin: 4px 0; font-size: 9px; color: #64748b;">Scan QR</p>
          </div>
        </div>
        
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #64748b;">
          TTD Kepala Sekolah: _____________
        </div>
      </div>
    `;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🎓 Kartu Pelajar Digital</h1>
        <p className="text-gray-600 mt-1">Generate dan export kartu pelajar siswa</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* School Select (Admin only) */}
          {user.role === 'Admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sekolah
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => handleSchoolChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Sekolah</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Class Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              disabled={!selectedSchoolId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Pilih Kelas</option>
              {classes
                .filter(c => user.role === 'Admin' || c.schoolId === user.schoolId)
                .map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('single')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Individu
              </button>
              <button
                onClick={() => setViewMode('batch')}
                disabled={students.length === 0}
                className={`flex-1 px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  viewMode === 'batch'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Batch ({students.length})
              </button>
            </div>
          </div>
        </div>

        {/* Student List for Single Mode */}
        {viewMode === 'single' && students.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Siswa
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-3 rounded-lg text-left border-2 transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-sm">{student.name}</div>
                  <div className="text-xs text-gray-500">{student.identityNumber}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {((viewMode === 'single' && selectedStudent) || (viewMode === 'batch' && students.length > 0)) && (
          <div className="mt-4 flex gap-2">
            {viewMode === 'single' && selectedStudent && (
              <>
                <button
                  onClick={() => selectedStudent && exportToPDF(selectedStudent)}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  📥 Export PDF
                </button>
                <button
                  onClick={handlePrint}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  🖨️ Print
                </button>
              </>
            )}
            {viewMode === 'batch' && (
              <button
                onClick={exportBatchToPDF}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                📥 Export Batch PDF ({students.length} kartu)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Preview (Single Mode) */}
      {viewMode === 'single' && selectedStudent && selectedSchool && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Preview Kartu</h2>
          
          <div className="flex justify-center">
            <div ref={cardRef} className="w-[320px] border-2 border-blue-600 rounded-xl p-4 bg-white shadow-lg">
              {/* Header */}
              <div className="text-center border-b-2 border-blue-600 pb-2 mb-3">
                <h2 className="text-lg font-bold text-blue-900">{selectedSchool.name}</h2>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Kartu Pelajar</p>
              </div>

              {/* Content */}
              <div className="flex gap-3">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {selectedStudent.photoUrl ? (
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.name}
                      className="w-20 h-24 object-cover rounded-lg border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-20 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      No Photo
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-sm">
                  <div className="mb-2">
                    <div className="text-xs text-gray-600">Nama:</div>
                    <div className="font-bold">{selectedStudent.name}</div>
                  </div>
                  <div className="mb-2">
                    <div className="text-xs text-gray-600">NIS:</div>
                    <div className="font-semibold">{selectedStudent.identityNumber}</div>
                  </div>
                  <div className="mb-2">
                    <div className="text-xs text-gray-600">Kelas:</div>
                    <div>{classes.find(c => c.id === selectedClassId)?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Tahun Ajaran:</div>
                    <div>{currentYear}</div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex-shrink-0 text-center">
                  <div className="bg-white p-1 border border-gray-300 rounded">
                    <QRCode
                      value={`STUDENT:${selectedStudent.id}`}
                      size={60}
                      level="M"
                    />
                  </div>
                  <p className="text-[8px] text-gray-500 mt-1">Scan QR</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2 border-t border-gray-200 text-center">
                <p className="text-[10px] text-gray-500">
                  TTD Kepala Sekolah: _____________
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Preview */}
      {viewMode === 'batch' && students.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Preview Batch ({students.length} Kartu)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {students.slice(0, 12).map(student => (
              <div key={student.id} className="border border-gray-200 rounded-lg p-2 text-xs">
                <div className="flex gap-2 items-center">
                  <div className="w-12 h-14 bg-gray-200 rounded flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-bold">{student.name}</div>
                    <div className="text-gray-600">{student.identityNumber}</div>
                  </div>
                </div>
              </div>
            ))}
            {students.length > 12 && (
              <div className="col-span-full text-center text-gray-500">
                ... dan {students.length - 12} kartu lainnya
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedClassId && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Pilih Kelas untuk Mulai
          </h3>
          <p className="text-gray-500">
            Pilih sekolah dan kelas di atas untuk melihat daftar siswa
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentCardPage;
