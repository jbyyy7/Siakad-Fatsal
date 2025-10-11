import React, { useState, useEffect } from 'react';
import { Class, School, User, UserRole } from '../../types';
import { dataService } from '../../services/dataService';

interface ClassFormProps {
  classData: Class | null;
  onClose: () => void;
  onSave: (formData: any) => Promise<void>;
}

const ClassForm: React.FC<ClassFormProps> = ({ classData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    schoolId: '',
    teacherId: '',
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const [schoolsData, teachersData] = await Promise.all([
            dataService.getSchools(),
            dataService.getUsers({ role: UserRole.TEACHER })
        ]);
        setSchools(schoolsData);
        setTeachers(teachersData);

        if (classData) {
            setFormData({
                name: classData.name || '',
                schoolId: classData.schoolId || '',
                teacherId: classData.teacherId || '',
            });
        }
    };
    fetchData();
  }, [classData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
  };

  const filteredTeachers = teachers.filter(t => t.schoolId === formData.schoolId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Kelas</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          placeholder="e.g., MA Kelas 10-A"
        />
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
            <option key={school.id} value={school.id}>{school.name}</option>
          ))}
        </select>
      </div>
       <div>
        <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700">Wali Kelas</label>
        <select
          id="teacherId"
          name="teacherId"
          value={formData.teacherId}
          onChange={handleChange}
          disabled={!formData.schoolId}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
        >
          <option value="">Pilih Wali Kelas</option>
          {filteredTeachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
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

export default ClassForm;
