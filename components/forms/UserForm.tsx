import React, { useState, useEffect } from 'react';
import { User, School, UserRole } from '../../types';

interface UserFormProps {
  user: User | null;
  schools: School[];
  onClose: () => void;
  onSave: (formData: any) => Promise<void>;
}

const UserForm: React.FC<UserFormProps> = ({ user, schools, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    identityNumber: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    schoolId: '',
    avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
    // New fields
    placeOfBirth: '',
    dateOfBirth: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    religion: 'Islam',
    address: '',
    phoneNumber: '',
    parentName: '',
    parentPhoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        identityNumber: user.identityNumber || '',
        email: user.email || '',
        password: '', // Password is not edited here for security
        role: user.role || UserRole.STUDENT,
        schoolId: user.schoolId || '',
        avatarUrl: user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`,
        placeOfBirth: user.placeOfBirth || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || 'Laki-laki',
        religion: user.religion || 'Islam',
        address: user.address || '',
        phoneNumber: user.phoneNumber || '',
        parentName: user.parentName || '',
        parentPhoneNumber: user.parentPhoneNumber || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const dataToSave = { ...formData };
    if (isEditMode) {
      // @ts-ignore
      delete dataToSave.password; // Don't send empty password on edit
      // @ts-ignore
      delete dataToSave.email; // Email cannot be changed
    }
    
    await onSave(dataToSave);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Section: Data Diri */}
      <fieldset className="space-y-4 border-t pt-4">
        <legend className="text-lg font-semibold text-gray-800 -mt-8 bg-white px-2">Data Diri</legend>
        <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700">Tempat Lahir</label>
                <input type="text" id="placeOfBirth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                </select>
            </div>
            <div>
                <label htmlFor="religion" className="block text-sm font-medium text-gray-700">Agama</label>
                <select id="religion" name="religion" value={formData.religion} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option>Islam</option>
                    <option>Kristen</option>
                    <option>Katolik</option>
                    <option>Hindu</option>
                    <option>Buddha</option>
                    <option>Konghucu</option>
                    <option>Lainnya</option>
                </select>
            </div>
        </div>
         <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat</label>
            <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={2} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
        </div>
        <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
      </fieldset>

      {/* Section: Informasi Akademik */}
      <fieldset className="space-y-4 border-t pt-4">
        <legend className="text-lg font-semibold text-gray-800 -mt-8 bg-white px-2">Informasi Akademik & Login</legend>
        <div>
          <label htmlFor="identityNumber" className="block text-sm font-medium text-gray-700">Nomor Induk (NIS/NIP)</label>
          <input type="text" id="identityNumber" name="identityNumber" value={formData.identityNumber} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
         <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Peran</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700">Sekolah</label>
              <select id="schoolId" name="schoolId" value={formData.schoolId} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">Tidak ada/Yayasan</option>
                {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </div>
        </div>
         <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={isEditMode} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
        </div>
        {!isEditMode && (
          <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Kata Sandi Awal</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Minimal 6 karakter" />
          </div>
        )}
      </fieldset>
      
      {/* Section: Data Orang Tua */}
      <fieldset className="space-y-4 border-t pt-4">
        <legend className="text-lg font-semibold text-gray-800 -mt-8 bg-white px-2">Data Orang Tua</legend>
        <div>
            <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">Nama Orang Tua / Wali</label>
            <input type="text" id="parentName" name="parentName" value={formData.parentName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
         <div>
            <label htmlFor="parentPhoneNumber" className="block text-sm font-medium text-gray-700">Nomor Telepon Orang Tua / Wali</label>
            <input type="tel" id="parentPhoneNumber" name="parentPhoneNumber" value={formData.parentPhoneNumber} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
      </fieldset>

      <div className="flex justify-end pt-4 space-x-2">
        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
          Batal
        </button>
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400">
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
