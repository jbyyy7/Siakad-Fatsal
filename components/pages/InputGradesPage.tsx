import React, { useState, useEffect, useMemo } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, Subject, Class } from '../../types';

interface InputGradesPageProps {
  user: User;
}

const InputGradesPage: React.FC<InputGradesPageProps> = ({ user }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [grades, setGrades] = useState<Record<string, number | ''>>({});
  const [isLoading, setIsLoading] = useState({ classes: true, students: false, subjects: false });

  // Fetch classes taught by the teacher
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(prev => ({ ...prev, classes: true }));
      try {
        const teacherClasses = await dataService.getClasses({ teacherId: user.id });
        setClasses(teacherClasses);
        if (teacherClasses.length > 0) {
          setSelectedClassId(teacherClasses[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch teacher's classes:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, classes: false }));
      }
    };
    fetchClasses();
  }, [user.id]);

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);

  // Fetch students and subjects when a class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchDataForClass = async () => {
      setIsLoading(prev => ({ ...prev, students: true, subjects: true }));
      try {
        const [studentsData, subjectsData] = await Promise.all([
          dataService.getStudentsInClass(selectedClass.id),
          dataService.getSubjects({ schoolId: selectedClass.schoolId }),
        ]);
        setStudents(studentsData);
        setSubjects(subjectsData);
        if (subjectsData.length > 0) {
          setSelectedSubjectId(subjectsData[0].id);
        } else {
          setSelectedSubjectId('');
        }
        setGrades({}); // Reset grades when class changes
      } catch (error) {
        console.error("Failed to fetch data for class:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, students: false, subjects: false }));
      }
    };

    fetchDataForClass();
  }, [selectedClass]);

  const handleGradeChange = (studentId: string, score: string) => {
    const numericScore = score === '' ? '' : Math.max(0, Math.min(100, parseInt(score, 10)));
    setGrades(prev => ({ ...prev, [studentId]: numericScore }));
  };
  
  const handleSave = () => {
    console.log("Saving grades:", { classId: selectedClassId, subjectId: selectedSubjectId, grades });
    alert("Nilai berhasil disimpan (simulasi).");
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Input Nilai Siswa</h2>
      <Card>
        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                 <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">Pilih Kelas</label>
                 <select 
                    id="class-select" 
                    value={selectedClassId} 
                    onChange={e => setSelectedClassId(e.target.value)}
                    disabled={isLoading.classes}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                 >
                     {isLoading.classes ? <option>Memuat kelas...</option> : 
                        classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                     }
                 </select>
            </div>
             <div>
                 <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700">Pilih Mata Pelajaran</label>
                 <select 
                    id="subject-select" 
                    value={selectedSubjectId} 
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    disabled={isLoading.subjects || !selectedClassId}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                 >
                     {isLoading.subjects ? <option>Memuat mapel...</option> :
                        subjects.length > 0 ?
                        subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>) :
                        <option>Tidak ada mapel</option>
                     }
                 </select>
            </div>
        </div>
         <div className="overflow-x-auto">
            {isLoading.students ? <p className="p-4 text-center">Memuat siswa...</p> : (
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Nama Siswa</th>
                        <th className="px-6 py-3 w-40">Input Nilai (0-100)</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                         <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                             <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                             <td className="px-6 py-4">
                                 <input 
                                     type="number" 
                                     min="0"
                                     max="100"
                                     value={grades[student.id] || ''}
                                     onChange={e => handleGradeChange(student.id, e.target.value)}
                                     className="w-full p-2 border border-gray-300 rounded-md text-center"
                                     disabled={!selectedSubjectId}
                                 />
                             </td>
                         </tr>
                    ))}
                </tbody>
            </table>
            )}
         </div>
          <div className="p-4 border-t text-right">
              <button 
                onClick={handleSave} 
                disabled={isLoading.students || !selectedSubjectId || students.length === 0}
                className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:bg-brand-400"
              >
                  Simpan Nilai
              </button>
          </div>
      </Card>
    </div>
  );
};

export default InputGradesPage;