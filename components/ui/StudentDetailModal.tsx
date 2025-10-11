import React from 'react';
import { User } from '../../types';

interface StudentDetailModalProps {
  student: User & { className?: string; homeroomTeacherName?: string; };
}

const DetailItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800">{value || '-'}</p>
  </div>
);

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    // Add 'T00:00:00' to prevent timezone issues
    return new Date(dateString + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const placeAndDateOfBirth = [student.placeOfBirth, formatDate(student.dateOfBirth)].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <img src={student.avatarUrl} alt={student.name} className="h-20 w-20 rounded-full object-cover" />
        <div>
            <h3 className="text-xl font-bold">{student.name}</h3>
            <p className="text-gray-600">{student.identityNumber}</p>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-700 mb-2 pb-1 border-b">Data Akademik</h4>
        <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Email" value={student.email} />
            <DetailItem label="Sekolah" value={student.schoolName} />
            <DetailItem label="Kelas" value={student.className} />
            <DetailItem label="Wali Kelas" value={student.homeroomTeacherName} />
        </div>
      </div>
      
       <div>
        <h4 className="font-bold text-gray-700 mb-2 pb-1 border-b">Data Diri</h4>
        <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Tempat, Tanggal Lahir" value={placeAndDateOfBirth} />
            <DetailItem label="Jenis Kelamin" value={student.gender} />
            <DetailItem label="Agama" value={student.religion} />
            <DetailItem label="Nomor Telepon" value={student.phoneNumber} />
            <DetailItem label="Alamat" value={student.address} />
        </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-700 mb-2 pb-1 border-b">Data Orang Tua / Wali</h4>
        <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Nama Orang Tua" value={student.parentName} />
            <DetailItem label="No. Telepon Orang Tua" value={student.parentPhoneNumber} />
        </div>
      </div>

    </div>
  );
};

export default StudentDetailModal;
