// FIX: Implemented the InputGradesPage component which was a placeholder.
import React, { useState } from 'react';
import Card from '../Card';
import { MOCK_USERS } from '../../constants';
import { User, UserRole } from '../../types';

const InputGradesPage: React.FC = () => {
    const [selectedClass, setSelectedClass] = useState('ma-10a');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('Matematika');
    const [score, setScore] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const studentsInClass = MOCK_USERS.filter(u => u.role === UserRole.STUDENT && u.schoolId === 'ma_fs');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({
            class: selectedClass,
            studentId: selectedStudent,
            subject: selectedSubject,
            score: score,
        });
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            // reset form
            setSelectedStudent('');
            setScore('');
        }, 2000);
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Input Nilai Siswa</h2>
            <Card>
                <form onSubmit={handleSave} className="space-y-6 p-4">
                    <div>
                        <label htmlFor="class" className="block text-sm font-medium text-gray-700">Pilih Kelas</label>
                        <select id="class" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500">
                            <option value="ma-10a">MA - Kelas 10-A</option>
                            <option value="ma-10b">MA - Kelas 10-B</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="student" className="block text-sm font-medium text-gray-700">Pilih Siswa</label>
                        <select id="student" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500">
                           <option value="" disabled>-- Pilih seorang siswa --</option>
                           {studentsInClass.map(student => (
                               <option key={student.id} value={student.id}>{student.name}</option>
                           ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                        <select id="subject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500">
                            <option>Matematika</option>
                            <option>Fisika</option>
                            <option>Kimia</option>
                            <option>Biologi</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="score" className="block text-sm font-medium text-gray-700">Nilai (0-100)</label>
                        <input
                            type="number"
                            id="score"
                            value={score}
                            onChange={e => setScore(e.target.value)}
                            min="0"
                            max="100"
                            required
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>
                    
                    <div className="flex items-center">
                        <button type="submit" className="px-5 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                            Simpan Nilai
                        </button>
                        {isSaved && <span className="ml-4 text-sm text-green-600">Nilai berhasil disimpan!</span>}
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default InputGradesPage;
