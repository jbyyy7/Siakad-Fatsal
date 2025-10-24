import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { AcademicYear, Semester, Class, Subject, User, ReportCard, ReportCardSubject } from '../../types';

export default function ReportCardManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Report Card Data
  const [reportCard, setReportCard] = useState<any>(null);
  const [subjectScores, setSubjectScores] = useState<{[key: string]: any}>({});
  const [attendance, setAttendance] = useState({
    totalDays: 0,
    presentDays: 0,
    sickDays: 0,
    permissionDays: 0,
    absentDays: 0
  });
  const [comments, setComments] = useState({
    attitude: '',
    achievement: '',
    homeroom: '',
    principal: ''
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAcademicYears();
      loadClasses();
      loadSubjects();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedAcademicYear) {
      loadSemesters();
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedStudent && selectedSemester && selectedClass) {
      loadReportCard();
    }
  }, [selectedStudent, selectedSemester, selectedClass]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadAcademicYears = async () => {
    try {
      let query = supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (currentUser?.role !== 'Admin' && currentUser?.schoolId) {
        query = query.eq('school_id', currentUser.schoolId);
      }

      const { data } = await query;
      setAcademicYears(data || []);
      
      // Auto-select active year
      const activeYear = data?.find(y => y.is_active);
      if (activeYear) {
        setSelectedAcademicYear(activeYear.id);
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
    }
  };

  const loadSemesters = async () => {
    try {
      const { data } = await supabase
        .from('semesters')
        .select('*')
        .eq('academic_year_id', selectedAcademicYear)
        .order('semester_number', { ascending: true });
      
      setSemesters(data || []);
      
      // Auto-select active semester
      const activeSem = data?.find(s => s.is_active);
      if (activeSem) {
        setSelectedSemester(activeSem.id);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
    }
  };

  const loadClasses = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

      if (currentUser?.role === 'Teacher') {
        // Load classes where this teacher is homeroom teacher
        query = query.eq('homeroom_teacher_id', currentUser.id);
      } else if (currentUser?.role !== 'Admin' && currentUser?.schoolId) {
        query = query.eq('school_id', currentUser.schoolId);
      }

      const { data } = await query;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      let query = supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (currentUser?.role !== 'Admin' && currentUser?.schoolId) {
        query = query.eq('school_id', currentUser.schoolId);
      }

      const { data } = await query;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('role', 'Student')
        .order('full_name', { ascending: true });
      
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadReportCard = async () => {
    setLoading(true);
    try {
      // Check if report card exists
      const { data: existingCard } = await supabase
        .from('report_cards')
        .select(`
          *,
          report_card_subjects(*),
          report_card_comments(*)
        `)
        .eq('student_id', selectedStudent)
        .eq('semester_id', selectedSemester)
        .eq('class_id', selectedClass)
        .single();

      if (existingCard) {
        setReportCard(existingCard);
        
        // Load subject scores
        const scoresMap: any = {};
        existingCard.report_card_subjects?.forEach((sub: any) => {
          scoresMap[sub.subject_id] = {
            knowledge_score: sub.knowledge_score,
            skill_score: sub.skill_score,
            description: sub.description
          };
        });
        setSubjectScores(scoresMap);

        // Load attendance
        setAttendance({
          totalDays: existingCard.total_days || 0,
          presentDays: existingCard.present_days || 0,
          sickDays: existingCard.sick_days || 0,
          permissionDays: existingCard.permission_days || 0,
          absentDays: existingCard.absent_days || 0
        });

        // Load comments
        const commentsMap: any = {
          attitude: '',
          achievement: '',
          homeroom: '',
          principal: ''
        };
        existingCard.report_card_comments?.forEach((c: any) => {
          commentsMap[c.comment_type.toLowerCase()] = c.comment;
        });
        setComments(commentsMap);
      } else {
        // Initialize empty form
        setReportCard(null);
        setSubjectScores({});
        setAttendance({
          totalDays: 0,
          presentDays: 0,
          sickDays: 0,
          permissionDays: 0,
          absentDays: 0
        });
        setComments({
          attitude: '',
          achievement: '',
          homeroom: '',
          principal: ''
        });
      }
    } catch (error) {
      console.error('Error loading report card:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalScore = (knowledgeScore: number, skillScore: number) => {
    return Math.round((knowledgeScore + skillScore) / 2);
  };

  const getGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  };

  const handleSubjectScoreChange = (subjectId: string, field: string, value: any) => {
    setSubjectScores(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  const handleSave = async (status: 'Draft' | 'Published') => {
    if (!selectedStudent || !selectedSemester || !selectedClass) {
      setMessage('⚠️ Pilih semester, kelas, dan siswa terlebih dahulu');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const student = students.find(s => s.id === selectedStudent);
      if (!student) throw new Error('Student not found');

      // Calculate totals
      const subjectIds = Object.keys(subjectScores);
      let totalScore = 0;
      let count = 0;

      subjectIds.forEach(subjectId => {
        const scores = subjectScores[subjectId];
        if (scores?.knowledge_score && scores?.skill_score) {
          const finalScore = calculateFinalScore(scores.knowledge_score, scores.skill_score);
          totalScore += finalScore;
          count++;
        }
      });

      const averageScore = count > 0 ? Math.round(totalScore / count) : 0;

      // Get rank (simplified - in production, query all students in class)
      const rank = 1;
      const totalStudents = students.length;

      // Upsert report card
      const reportCardData = {
        student_id: selectedStudent,
        class_id: selectedClass,
        semester_id: selectedSemester,
        student_name: student.full_name,
        student_nis: student.nis,
        class_name: classes.find(c => c.id === selectedClass)?.name || '',
        total_days: attendance.totalDays,
        present_days: attendance.presentDays,
        sick_days: attendance.sickDays,
        permission_days: attendance.permissionDays,
        absent_days: attendance.absentDays,
        total_score: totalScore,
        average_score: averageScore,
        rank: rank,
        total_students: totalStudents,
        status: status,
        homeroom_teacher_name: currentUser?.full_name || '',
        principal_name: '' // To be filled by principal
      };

      let reportCardId = reportCard?.id;

      if (reportCard) {
        // Update existing
        await supabase
          .from('report_cards')
          .update(reportCardData)
          .eq('id', reportCard.id);
      } else {
        // Insert new
        const { data: newCard } = await supabase
          .from('report_cards')
          .insert([reportCardData])
          .select()
          .single();
        reportCardId = newCard?.id;
      }

      if (!reportCardId) throw new Error('Failed to get report card ID');

      // Delete existing subjects and comments
      await supabase.from('report_card_subjects').delete().eq('report_card_id', reportCardId);
      await supabase.from('report_card_comments').delete().eq('report_card_id', reportCardId);

      // Insert subject scores
      const subjectRecords = subjectIds
        .filter(subjectId => {
          const scores = subjectScores[subjectId];
          return scores?.knowledge_score && scores?.skill_score;
        })
        .map(subjectId => {
          const scores = subjectScores[subjectId];
          const finalScore = calculateFinalScore(scores.knowledge_score, scores.skill_score);
          const grade = getGrade(finalScore);
          const subject = subjects.find(s => s.id === subjectId);

          return {
            report_card_id: reportCardId,
            subject_id: subjectId,
            subject_name: subject?.name || '',
            knowledge_score: scores.knowledge_score,
            skill_score: scores.skill_score,
            final_score: finalScore,
            grade: grade,
            description: scores.description || ''
          };
        });

      if (subjectRecords.length > 0) {
        await supabase.from('report_card_subjects').insert(subjectRecords);
      }

      // Insert comments
      const commentRecords = [
        { report_card_id: reportCardId, comment_type: 'Attitude', comment: comments.attitude, commented_by: currentUser?.id },
        { report_card_id: reportCardId, comment_type: 'Achievement', comment: comments.achievement, commented_by: currentUser?.id },
        { report_card_id: reportCardId, comment_type: 'Homeroom', comment: comments.homeroom, commented_by: currentUser?.id },
        { report_card_id: reportCardId, comment_type: 'Principal', comment: comments.principal, commented_by: currentUser?.id }
      ].filter(c => c.comment);

      if (commentRecords.length > 0) {
        await supabase.from('report_card_comments').insert(commentRecords);
      }

      setMessage(`✅ Rapor berhasil disimpan sebagai ${status}`);
      
      // Reload report card
      await loadReportCard();

      // TODO: Send notification if published
      if (status === 'Published') {
        // Call WhatsApp service
        console.log('📨 Sending notification to parents...');
      }

    } catch (error) {
      console.error('Error saving report card:', error);
      setMessage('❌ Gagal menyimpan rapor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">📋 Kelola Rapor Siswa</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Tahun Ajaran</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Tahun Ajaran</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_active && '✓'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!selectedAcademicYear}
            >
              <option value="">Pilih Semester</option>
              {semesters.map(sem => (
                <option key={sem.id} value={sem.id}>
                  {sem.name} {sem.is_active && '✓'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Kelas</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Siswa</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!selectedClass}
            >
              <option value="">Pilih Siswa</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name} - {student.nis}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
          }`}>
            {message}
          </div>
        )}

        {loading && <div className="text-center py-8">⏳ Memuat data...</div>}

        {!loading && selectedStudent && selectedSemester && (
          <>
            {/* Attendance Section */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">📅 Kehadiran</h2>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Hari</label>
                  <input
                    type="number"
                    value={attendance.totalDays}
                    onChange={(e) => setAttendance({...attendance, totalDays: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-green-700">Hadir</label>
                  <input
                    type="number"
                    value={attendance.presentDays}
                    onChange={(e) => setAttendance({...attendance, presentDays: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-yellow-700">Sakit</label>
                  <input
                    type="number"
                    value={attendance.sickDays}
                    onChange={(e) => setAttendance({...attendance, sickDays: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-700">Izin</label>
                  <input
                    type="number"
                    value={attendance.permissionDays}
                    onChange={(e) => setAttendance({...attendance, permissionDays: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-red-700">Alpa</label>
                  <input
                    type="number"
                    value={attendance.absentDays}
                    onChange={(e) => setAttendance({...attendance, absentDays: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Subject Scores */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">📚 Nilai Mata Pelajaran</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">Mata Pelajaran</th>
                      <th className="border p-2 w-24">Pengetahuan</th>
                      <th className="border p-2 w-24">Keterampilan</th>
                      <th className="border p-2 w-24">Nilai Akhir</th>
                      <th className="border p-2 w-16">Grade</th>
                      <th className="border p-2">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map(subject => {
                      const scores = subjectScores[subject.id] || {};
                      const knowledge = scores.knowledge_score || 0;
                      const skill = scores.skill_score || 0;
                      const finalScore = knowledge && skill ? calculateFinalScore(knowledge, skill) : 0;
                      const grade = finalScore ? getGrade(finalScore) : '-';

                      return (
                        <tr key={subject.id} className="hover:bg-gray-50">
                          <td className="border p-2 font-medium">{subject.name}</td>
                          <td className="border p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={knowledge || ''}
                              onChange={(e) => handleSubjectScoreChange(subject.id, 'knowledge_score', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="0-100"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={skill || ''}
                              onChange={(e) => handleSubjectScoreChange(subject.id, 'skill_score', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="0-100"
                            />
                          </td>
                          <td className="border p-2 text-center font-bold">
                            {finalScore || '-'}
                          </td>
                          <td className="border p-2 text-center font-bold text-lg">
                            {grade}
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              value={scores.description || ''}
                              onChange={(e) => handleSubjectScoreChange(subject.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="Deskripsi capaian..."
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comments */}
            <div className="mb-6 space-y-4">
              <h2 className="text-lg font-semibold">💬 Catatan & Komentar</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Catatan Sikap</label>
                <textarea
                  value={comments.attitude}
                  onChange={(e) => setComments({...comments, attitude: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Catatan mengenai sikap dan perilaku siswa..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Catatan Prestasi</label>
                <textarea
                  value={comments.achievement}
                  onChange={(e) => setComments({...comments, achievement: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Catatan mengenai prestasi dan pencapaian siswa..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Catatan Wali Kelas</label>
                <textarea
                  value={comments.homeroom}
                  onChange={(e) => setComments({...comments, homeroom: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Catatan dari wali kelas..."
                />
              </div>

              {currentUser?.role === 'Kepala Sekolah' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Catatan Kepala Sekolah</label>
                  <textarea
                    value={comments.principal}
                    onChange={(e) => setComments({...comments, principal: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    placeholder="Catatan dari kepala sekolah..."
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleSave('Draft')}
                disabled={saving}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300"
              >
                {saving ? '⏳ Menyimpan...' : '💾 Simpan Draft'}
              </button>
              <button
                onClick={() => handleSave('Published')}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? '⏳ Menyimpan...' : '📤 Publikasikan Rapor'}
              </button>
            </div>

            {reportCard && (
              <div className="mt-4 text-sm text-gray-600">
                Status: <span className="font-semibold">{reportCard.status}</span> | 
                Terakhir diubah: {new Date(reportCard.updated_at).toLocaleString('id-ID')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
