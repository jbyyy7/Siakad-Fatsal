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
    avatarUrl: 'https://i.pravatar.cc/150',
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
        avatarUrl: user.avatarUrl || 'https://i.pravatar.cc/150',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
       <div>
        <label htmlFor="identityNumber" className="block text-sm font-medium text-gray-700">Nomor Induk (NIS/NIP)</label>
        <input
          type="text"
          id="identityNumber"
          name="identityNumber"
          value={formData.identityNumber}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
       <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isEditMode}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
        />
      </div>
       {!isEditMode && (
         <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Kata Sandi</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Minimal 6 karakter"
            />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Peran</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700">Sekolah</label>
            <select
              id="schoolId"
              name="schoolId"
              value={formData.schoolId}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Tidak ada/Yayasan</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
      </div>

      <div className="flex justify-end pt-4 space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;