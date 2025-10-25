import React, { useState, useEffect, useRef } from 'react';
import { User, School, UserRole } from '../../types';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';

type UserFormData = Omit<User, 'id' | 'createdAt'> & { password?: string };

interface UserFormProps {
  user: User | null;
  schools: School[];
  onClose: () => void;
  onSave: (formData: Partial<UserFormData>) => Promise<void>;
}

const UserForm: React.FC<UserFormProps> = ({ user, schools, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    identityNumber: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    schoolId: '',
    avatarUrl: '', // Empty by default, user must upload
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
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const emailDebounce = useRef<number | undefined>(undefined);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        avatarUrl: user.avatarUrl || '',
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
      toast.success('Foto berhasil diupload');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Gagal mengupload foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') {
      setEmailExists(null);
      setCheckingEmail(true);
      if (emailDebounce.current) window.clearTimeout(emailDebounce.current);
      emailDebounce.current = window.setTimeout(() => checkEmail(value), 600);
    }
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // role-based validation: students require parent info
  if (formData.role === UserRole.STUDENT && !formData.parentName) {
      toast.error('Siswa harus mencantumkan nama orang tua/wali');
      setIsLoading(false);
      return;
    }
    // Prevent creating when email already exists
    if (!isEditMode && emailExists) {
      toast.error('Email sudah terdaftar, gunakan email lain');
      setIsLoading(false);
      return;
    }
    const dataToSave = { ...formData };
    if (isEditMode) {
      // @ts-expect-error - Delete password field on edit mode
      delete dataToSave.password; // Don't send empty password on edit
      // @ts-expect-error - Delete email field on edit mode
      delete dataToSave.email; // Email cannot be changed
    }
    
    await onSave(dataToSave);
    toast.success(isEditMode ? 'Perubahan tersimpan' : 'Pengguna berhasil dibuat');
    setIsLoading(false);
  };

  async function checkEmail(email: string) {
    if (!email) {
      setEmailExists(null);
      setCheckingEmail(false);
      return;
    }
    try {
      const resp = await fetch('/api/check-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const json = await resp.json();
      setEmailExists(!!json.exists);
      if (json.exists) toast.error('Email sudah terdaftar');
    } catch (e) {
      console.error('email check failed', e);
    } finally {
      setCheckingEmail(false);
    }
  }

  function generatePassword() {
    const pw = Math.random().toString(36).slice(2, 10) + 'A1!';
    setFormData(prev => ({ ...prev, password: pw }));
    setPasswordStrength(calculatePasswordStrength(pw));
  }

  function calculatePasswordStrength(pw: string) {
    let score = 0;
    if (!pw) return 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score; // 0-4
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Section: Foto Profil */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-800">Foto Profil</legend>
        <div className="flex items-center gap-6">
          <div className="relative">
            {formData.avatarUrl ? (
              <img 
                src={formData.avatarUrl} 
                alt="Avatar preview" 
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {uploadingAvatar ? 'Mengupload...' : 'Upload Foto'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Format: JPG, PNG, atau GIF. Maksimal 2MB.
            </p>
          </div>
        </div>
      </fieldset>

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
              <select 
                id="schoolId" 
                name="schoolId" 
                value={formData.schoolId} 
                onChange={handleChange} 
                required 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="">Pilih Sekolah</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={isEditMode} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            {checkingEmail && <span className="absolute right-2 top-2 text-sm text-gray-500">Memeriksa...</span>}
            {emailExists && <span className="absolute right-2 top-2 text-sm text-red-600">Terdaftar</span>}
            {emailExists === false && <span className="absolute right-2 top-2 text-sm text-green-600">Tersedia</span>}
          </div>
        </div>
        {!isEditMode && (
          <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Kata Sandi Awal</label>
              <div className="flex items-center gap-2">
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Minimal 6 karakter" />
                <button type="button" onClick={generatePassword} className="px-2 py-1 bg-gray-100 rounded">Generate</button>
              </div>
              <div className="mt-1 text-sm">
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div style={{ width: `${(passwordStrength / 4) * 100}%` }} className={`h-2 rounded ${passwordStrength <=1 ? 'bg-red-500' : passwordStrength===2 ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Kekuatan: {['Lemah','Cukup','Baik','Kuat'][Math.max(0, passwordStrength-1)] || 'Lemah'}</div>
              </div>
          </div>
        )}
      </fieldset>
      
      {/* Section: Data Orang Tua (only for Students) */}
      {formData.role === UserRole.STUDENT && (
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
      )}

      <div className="flex justify-end pt-4 space-x-2">
        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
          Batal
        </button>
        <button type="button" onClick={() => setIsPreviewOpen(true)} disabled={isLoading} className="px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200">
          Preview
        </button>
        <button type="submit" disabled={isLoading || (!isEditMode && emailExists === true)} className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400">
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
      {isPreviewOpen && (
        <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={isEditMode ? 'Preview Perubahan' : 'Preview Pengguna Baru'} footer={<>
          <button onClick={() => setIsPreviewOpen(false)} className="px-4 py-2 bg-gray-200 rounded mr-2">Kembali</button>
          <button onClick={async () => { setIsPreviewOpen(false); await handleSubmit(new Event('submit') as any); }} className="px-4 py-2 bg-brand-600 text-white rounded">Konfirmasi & Simpan</button>
        </>}>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <img src={formData.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full" />
              <div>
                <div className="font-semibold">{formData.name}</div>
                <div className="text-sm text-gray-600">{formData.email}</div>
                <div className="text-sm text-gray-600">{formData.identityNumber}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Peran</div>
              <div className="text-sm">{formData.role}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Sekolah</div>
              <div className="text-sm">{schools.find((s: School) => s.id === formData.schoolId)?.name || 'Tidak ada'}</div>
            </div>
            {formData.role === UserRole.STUDENT && (
              <div>
                <div className="text-sm font-medium">Orang Tua / Wali</div>
                <div className="text-sm">{formData.parentName} — {formData.parentPhoneNumber}</div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </form>
  );
};

export default UserForm;
