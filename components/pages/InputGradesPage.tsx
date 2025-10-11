import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { User, Subject, UserRole } from '../../types';

interface InputGradesPageProps {
  user: User;
}

const InputGradesPage: React.FC<InputGradesPageProps> = ({ user }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState('MA Kelas 10-A');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [grades, setGrades] = useState<Record<string, number | ''>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user.schoolId) return;
      try {
        const [studentsData, subjectsData] = await Promise.all([
          dataService.getUsers({ role: UserRole.STUDENT, schoolId: user.schoolId }),
          dataService.getSubjects(),
        ]);
        // In a real app, you would filter students by selectedClass
        setStudents(studentsData.filter(s => s.level === selectedClass));
        setSubjects(subjectsData);
        if (subjectsData.length > 0) {
          setSelectedSubject(subjectsData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch data for grades page:", error);
      }
    };
    fetchData();
  }, [user.schoolId, selectedClass]);

  const handleGradeChange = (studentId: string, score: string) => {
    const numericScore = score === '' ? '' : Math.max(0, Math.min(100, parseInt(score, 10)));
    setGrades(prev => ({ ...prev, [studentId]: numericScore }));
  };
  
  const handleSave = () => {
    console.log("Saving grades:", { class: selectedClass, subject: selectedSubject, grades });
    alert("Nilai berhasil disimpan (simulasi).");
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Input Nilai Siswa</h2>
      <Card>
        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                 <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">Pilih Kelas</label>
                 <select 
                    id="class-select" 
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                 >
                     <option>MA Kelas 10-A</option>
                     <option>MA Kelas 10-B</option>
                     <option>MA Kelas 11-A</option>
                 </select>
            </div>
             <div>
                 <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700">Pilih Mata Pelajaran</label>
                 <select 
                    id="subject-select" 
                    value={selectedSubject} 
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                 >
                     {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
            </div>
        </div>
         <div className="overflow-x-auto">
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
                                 />
                             </td>
                         </tr>
                    ))}
                </tbody>
            </table>
         </div>
          <div className="p-4 border-t text-right">
              <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                  Simpan Nilai
              </button>
          </div>
      </Card>
    </div>
  );
};

export default InputGradesPage;
