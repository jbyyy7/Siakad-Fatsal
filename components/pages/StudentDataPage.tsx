

import React, { useState, useMemo, useEffect } from 'react';
import Card from '../Card';
import { User, UserRole, Class } from '../../types';
import { dataService } from '../../services/dataService';
import { InformationCircleIcon } from '../icons/InformationCircleIcon';
import Modal from '../ui/Modal';
import StudentDetailModal from '../ui/StudentDetailModal';

interface StudentDataPageProps {
  user: User;
}

// Define an extended type for the student data to include class details
interface StudentWithDetails extends User {
    className?: string;
    homeroomTeacherName?: string;
}

const StudentDataPage: React.FC<StudentDataPageProps> = ({ user }) => {
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [memberships, setMemberships] = useState<{ student_id: string, class_id: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);

  useEffect(() => {
    if (!user.schoolId) {
        setIsLoading(false);
        return;
    };
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
    const [studentsData, classesData, membershipsData] = await Promise.all([
      dataService.getUsers({ role: UserRole.STUDENT, schoolId: user.schoolId }),
      dataService.getClasses({ schoolId: user.schoolId }),
      user.schoolId ? dataService.getClassMemberships(user.schoolId) : Promise.resolve([])
    ]);
        setAllStudents(studentsData);
        setClasses(classesData);
        setMemberships(membershipsData);
      } catch (error) {
        console.error("Failed to fetch detailed student data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
  }, [user.schoolId]);

  const studentsWithDetails: StudentWithDetails[] = useMemo(() => {
    const classMap = new Map(classes.map(c => [c.id, c]));
    const studentClassMap = new Map(memberships.map(m => [m.student_id, m.class_id]));

    return allStudents
        .map(student => {
            const classId = studentClassMap.get(student.id);
            const studentClass = classId ? classMap.get(classId) : undefined;
            return {
                ...student,
                className: (studentClass as Class)?.name,
                homeroomTeacherName: (studentClass as Class)?.homeroomTeacherName
            };
        });
  }, [allStudents, classes, memberships]);

  const filteredStudents = useMemo(() => {
    return studentsWithDetails.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [studentsWithDetails, searchTerm]);
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Siswa - {user.schoolName}</h2>
       <Card>
        <div className="p-4 border-b">
            <input 
                type="text"
                placeholder="Cari nama siswa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <p className="p-4">Memuat data siswa...</p> : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">NIS</th>
                  <th className="px-6 py-3">Kelas</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          <div className="flex items-center">
                              <img src={student.avatarUrl} alt={student.name} className="h-8 w-8 rounded-full mr-3 object-cover"/>
                              {student.name}
                          </div>
                      </td>
                    <td className="px-6 py-4">{student.identityNumber}</td>
                    <td className="px-6 py-4">{student.className || '-'}</td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => setSelectedStudent(student)}
                            className="p-1 text-brand-600 hover:text-brand-800"
                            aria-label={`Lihat detail ${student.name}`}
                        >
                            <InformationCircleIcon className="h-5 w-5"/>
                        </button>
                    </td>
                  </tr>
                ))}
                 {filteredStudents.length === 0 && !isLoading && (
                    <tr>
                        <td colSpan={4} className="text-center py-5 text-gray-500">Tidak ada siswa yang cocok dengan pencarian.</td>
                    </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      
      {selectedStudent && (
        <Modal
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
            title={`Detail Siswa: ${selectedStudent.name}`}
        >
            <StudentDetailModal student={selectedStudent} />
        </Modal>
      )}
    </div>
  );
};

export default StudentDataPage;
