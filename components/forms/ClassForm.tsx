import React, { useState, useEffect, useMemo } from 'react';
import { Class, School, User } from '../../types';

type ClassFormData = Omit<Class, 'id'> & { studentIds?: string[] };

interface ClassFormProps {
  classData: (Partial<Class> & { studentIds?: string[] }) | null;
  schools: School[];
  allTeachers: User[];
  allStudents: User[];
  onClose: () => void;
  onSave: (formData: ClassFormData) => Promise<void>;
  initialSchoolId?: string;
}

const ClassForm: React.FC<ClassFormProps> = ({ classData, schools, allTeachers, allStudents, onClose, onSave, initialSchoolId }) => {
  const [formData, setFormData] = useState({
    name: '',
    schoolId: '',
    homeroomTeacherId: '',
    studentIds: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        schoolId: classData.schoolId || '',
        homeroomTeacherId: classData.homeroomTeacherId || '',
        studentIds: classData.studentIds || [],
      });
    } else if (initialSchoolId) {
      setFormData(prev => ({ ...prev, schoolId: initialSchoolId }));
    }
  }, [classData, initialSchoolId]);

  const availableTeachers = useMemo(() => {
    if (!formData.schoolId) return [];
    return allTeachers.filter(t => t.schoolId === formData.schoolId);
  }, [formData.schoolId, allTeachers]);

  const availableStudents = useMemo(() => {
    if (!formData.schoolId) return [];
    return allStudents.filter(s => s.schoolId === formData.schoolId);
  }, [formData.schoolId, allStudents]);

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSchoolId = e.currentTarget.value;
    setFormData(prev => ({
      ...prev,
      schoolId: newSchoolId,
      homeroomTeacherId: '', // Reset teacher and students when school changes
      studentIds: [],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // FIX: Use spread operator for a more robust way to convert HTMLCollection to array, resolving potential TS inference issues.
    const selectedIds = [...e.currentTarget.selectedOptions].map(option => option.value);
    setFormData(prev => ({ ...prev, studentIds: selectedIds }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.schoolId) {
        alert("Nama kelas dan sekolah harus diisi.");
        return;
    }
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
          onChange={handleSchoolChange}
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Kelas</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={!formData.schoolId}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
        />
      </div>
      <div>
        <label htmlFor="homeroomTeacherId" className="block text-sm font-medium text-gray-700">Wali Kelas</label>
        <select
          id="homeroomTeacherId"
          name="homeroomTeacherId"
          value={formData.homeroomTeacherId}
          onChange={handleChange}
          disabled={!formData.schoolId}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
        >
          <option value="">Pilih Wali Kelas (Opsional)</option>
          {availableTeachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>
       <div>
            <label htmlFor="studentIds" className="block text-sm font-medium text-gray-700">Siswa di Kelas (tahan Ctrl/Cmd untuk memilih lebih dari satu)</label>
            <select
                id="studentIds"
                name="studentIds"
                multiple
                value={formData.studentIds}
                onChange={handleStudentSelect}
                disabled={!formData.schoolId}
                className="mt-1 block w-full h-40 p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
            >
                {availableStudents.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                ))}
            </select>
        </div>

      <div className="flex justify-end pt-4 space-x-2">
        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
          Batal
        </button>
        <button type="submit" disabled={isLoading || !formData.schoolId} className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400">
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
