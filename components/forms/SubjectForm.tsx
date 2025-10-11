import React, { useState, useEffect } from 'react';
import { Subject, School } from '../../types';

interface SubjectFormProps {
  subject: Subject | null;
  schools: School[];
  onClose: () => void;
  onSave: (formData: { name: string, schoolId: string }) => Promise<void>;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ subject, schools, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', schoolId: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subject) {
      setFormData({ name: subject.name, schoolId: subject.schoolId || '' });
    } else {
      // Default to the first school if available
      setFormData({ name: '', schoolId: schools.length > 0 ? schools[0].id : '' });
    }
  }, [subject, schools]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.schoolId) {
        alert("Nama mata pelajaran dan sekolah harus diisi.");
        return;
    };
    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            <option key={school.id} value={school.id}>{school.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Mata Pelajaran</label>
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

export default SubjectForm;