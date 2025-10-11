
import React, { useState, useEffect } from 'react';
import { TeachingJournal, Class, Subject, User } from '../../types';
import { dataService } from '../../services/dataService';

interface JournalFormProps {
  journal: TeachingJournal | null;
  user: User;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const JournalForm: React.FC<JournalFormProps> = ({ journal, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    classId: '',
    subjectId: '',
    topic: '',
  });

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const isEditMode = !!journal;

  // Fetch classes and subjects for the form
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const teacherClasses = await dataService.getClasses({ teacherId: user.id });
        setClasses(teacherClasses);

        if (journal) {
           setFormData({
                date: journal.date,
                classId: journal.classId,
                subjectId: journal.subjectId,
                topic: journal.topic,
           });
        } else if (teacherClasses.length > 0) {
            // Set default class
            setFormData(prev => ({ ...prev, classId: teacherClasses[0].id }));
        }

      } catch (error) {
        console.error("Failed to fetch form data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchDropdownData();
  }, [user.id, journal]);
  
  // Fetch subjects when class changes
  useEffect(() => {
    if (!formData.classId) {
        setSubjects([]);
        return;
    };

    const selectedClass = classes.find(c => c.id === formData.classId);
    if (!selectedClass) return;

    const fetchSubjects = async () => {
        try {
            const schoolSubjects = await dataService.getSubjects({ schoolId: selectedClass.schoolId });
            setSubjects(schoolSubjects);
            // Only set default subject if not in edit mode or if the original subject is not in the list
            if (!isEditMode || !schoolSubjects.some(s => s.id === formData.subjectId)) {
                setFormData(prev => ({...prev, subjectId: schoolSubjects[0]?.id || ''}));
            }
        } catch (error) {
             console.error("Failed to fetch subjects for class:", error);
        }
    };
    fetchSubjects();

  }, [formData.classId, classes, isEditMode]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.subjectId || !formData.topic.trim()) {
      alert("Harap lengkapi semua field.");
      return;
    }
    setIsLoading(true);
    try {
        if (isEditMode) {
            await dataService.updateTeachingJournal(journal.id, {
                classId: formData.classId,
                subjectId: formData.subjectId,
                date: formData.date,
                topic: formData.topic,
            });
        } else {
             await dataService.createTeachingJournal({
                teacherId: user.id,
                classId: formData.classId,
                subjectId: formData.subjectId,
                date: formData.date,
                topic: formData.topic,
            });
        }
        await onSave();
    } catch (error) {
        console.error("Failed to save journal:", error);
        alert("Gagal menyimpan jurnal.");
    } finally {
        setIsLoading(false);
    }
  };
  
  if (isDataLoading) {
      return <p>Memuat data form...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label htmlFor="classId" className="block text-sm font-medium text-gray-700">Kelas</label>
        <select
          id="classId"
          name="classId"
          value={formData.classId}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        >
          {classes.length === 0 && <option value="">Tidak ada kelas yang diajar</option>}
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
       <div>
        <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
        <select
          id="subjectId"
          name="subjectId"
          value={formData.subjectId}
          onChange={handleChange}
          required
          disabled={!formData.classId || subjects.length === 0}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
        >
          {subjects.length === 0 && <option value="">Pilih kelas terlebih dahulu</option>}
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Materi yang Diajarkan</label>
        <textarea
          id="topic"
          name="topic"
          rows={4}
          value={formData.topic}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          placeholder="Contoh: Bab 3 - Persamaan Linear Dua Variabel"
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

export default JournalForm;
