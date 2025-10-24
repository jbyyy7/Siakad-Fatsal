
import React, { useState, useEffect } from 'react';
import { TeachingJournal, User, Class, Subject } from '../../types';
// FIX: Fix import path for dataService
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
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!journal;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const classes = await dataService.getClasses({ teacherId: user.id });
        setTeacherClasses(classes);

        if (user.schoolId) {
            const subjects = await dataService.getSubjects({ schoolId: user.schoolId });
            setSchoolSubjects(subjects);
        }

        if (journal) {
          setFormData({
            date: journal.date,
            classId: journal.classId,
            subjectId: journal.subjectId,
            topic: journal.topic,
          });
        } else if (classes.length > 0) {
            // Pre-fill with first class if creating
            setFormData(prev => ({...prev, classId: classes[0].id}));
        }

      } catch (error) {
        console.error("Failed to fetch data for journal form", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [journal, user.id, user.schoolId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const journalData = {
        teacherId: user.id,
        ...formData
    };
    
    try {
        if (isEditMode) {
            await dataService.updateTeachingJournal(journal!.id, journalData);
        } else {
            await dataService.createTeachingJournal(journalData);
        }
        await onSave();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch(error: any) {
        alert(`Gagal menyimpan jurnal: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

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
      <div className="grid grid-cols-2 gap-4">
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
              <option value="">Pilih Kelas</option>
              {teacherClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Pilih Mapel</option>
              {schoolSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
      </div>
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Topik / Materi yang Diajarkan</label>
        <textarea
          id="topic"
          name="topic"
          rows={3}
          value={formData.topic}
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

export default JournalForm;
