import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { AcademicYear, Semester, User, School } from '../../types';

export default function AcademicYearManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  const [showYearForm, setShowYearForm] = useState(false);
  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  
  const [yearForm, setYearForm] = useState({
    schoolId: '',
    name: '',
    startDate: '',
    endDate: '',
    isActive: false
  });

  const [semesterForm, setSemesterForm] = useState({
    academicYearId: '',
    name: '',
    semesterNumber: 1,
    startDate: '',
    endDate: '',
    isActive: false
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadSchools();
      loadAcademicYears();
    }
  }, [currentUser]);

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

  const loadSchools = async () => {
    try {
      if (currentUser?.role === 'Admin') {
        const { data } = await supabase.from('schools').select('*').order('name');
        setSchools(data || []);
      } else if (currentUser?.schoolId) {
        const { data } = await supabase
          .from('schools')
          .select('*')
          .eq('id', currentUser.schoolId)
          .single();
        setSchools(data ? [data] : []);
        setYearForm(prev => ({ ...prev, schoolId: currentUser.schoolId! }));
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };

  const loadAcademicYears = async () => {
    setLoading(true);
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
      
      // Load semesters for all years
      if (data && data.length > 0) {
        const yearIds = data.map(y => y.id);
        const { data: semData } = await supabase
          .from('semesters')
          .select('*')
          .in('academic_year_id', yearIds)
          .order('semester_number', { ascending: true });
        setSemesters(semData || []);
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveYear = async () => {
    if (!yearForm.name || !yearForm.startDate || !yearForm.endDate) {
      setMessage('⚠️ Mohon lengkapi semua field');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // If setting this as active, deactivate others
      if (yearForm.isActive) {
        await supabase
          .from('academic_years')
          .update({ is_active: false })
          .eq('school_id', yearForm.schoolId);
      }

      if (editingYear) {
        // Update
        await supabase
          .from('academic_years')
          .update({
            name: yearForm.name,
            start_date: yearForm.startDate,
            end_date: yearForm.endDate,
            is_active: yearForm.isActive
          })
          .eq('id', editingYear.id);
        setMessage('✅ Tahun ajaran berhasil diperbarui');
      } else {
        // Insert
        await supabase
          .from('academic_years')
          .insert([{
            school_id: yearForm.schoolId,
            name: yearForm.name,
            start_date: yearForm.startDate,
            end_date: yearForm.endDate,
            is_active: yearForm.isActive
          }]);
        setMessage('✅ Tahun ajaran berhasil ditambahkan');
      }

      await loadAcademicYears();
      resetYearForm();
    } catch (error) {
      console.error('Error saving academic year:', error);
      setMessage('❌ Gagal menyimpan tahun ajaran');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSemester = async () => {
    if (!semesterForm.academicYearId || !semesterForm.name || !semesterForm.startDate || !semesterForm.endDate) {
      setMessage('⚠️ Mohon lengkapi semua field');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // If setting this as active, deactivate others in same year
      if (semesterForm.isActive) {
        await supabase
          .from('semesters')
          .update({ is_active: false })
          .eq('academic_year_id', semesterForm.academicYearId);
      }

      if (editingSemester) {
        // Update
        await supabase
          .from('semesters')
          .update({
            name: semesterForm.name,
            semester_number: semesterForm.semesterNumber,
            start_date: semesterForm.startDate,
            end_date: semesterForm.endDate,
            is_active: semesterForm.isActive
          })
          .eq('id', editingSemester.id);
        setMessage('✅ Semester berhasil diperbarui');
      } else {
        // Insert
        await supabase
          .from('semesters')
          .insert([{
            academic_year_id: semesterForm.academicYearId,
            name: semesterForm.name,
            semester_number: semesterForm.semesterNumber,
            start_date: semesterForm.startDate,
            end_date: semesterForm.endDate,
            is_active: semesterForm.isActive
          }]);
        setMessage('✅ Semester berhasil ditambahkan');
      }

      await loadAcademicYears();
      resetSemesterForm();
    } catch (error) {
      console.error('Error saving semester:', error);
      setMessage('❌ Gagal menyimpan semester');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = async (id: string) => {
    if (!confirm('Hapus tahun ajaran ini? Data semester dan rapor terkait akan terpengaruh.')) return;

    try {
      await supabase.from('academic_years').delete().eq('id', id);
      setMessage('✅ Tahun ajaran berhasil dihapus');
      await loadAcademicYears();
    } catch (error) {
      console.error('Error deleting academic year:', error);
      setMessage('❌ Gagal menghapus tahun ajaran');
    }
  };

  const handleDeleteSemester = async (id: string) => {
    if (!confirm('Hapus semester ini? Data rapor terkait akan terpengaruh.')) return;

    try {
      await supabase.from('semesters').delete().eq('id', id);
      setMessage('✅ Semester berhasil dihapus');
      await loadAcademicYears();
    } catch (error) {
      console.error('Error deleting semester:', error);
      setMessage('❌ Gagal menghapus semester');
    }
  };

  const handleEditYear = (year: AcademicYear) => {
    setEditingYear(year);
    setYearForm({
      schoolId: year.schoolId,
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      isActive: year.isActive
    });
    setShowYearForm(true);
  };

  const handleEditSemester = (semester: Semester) => {
    setEditingSemester(semester);
    setSemesterForm({
      academicYearId: semester.academicYearId,
      name: semester.name,
      semesterNumber: semester.semesterNumber,
      startDate: semester.startDate,
      endDate: semester.endDate,
      isActive: semester.isActive
    });
    setShowSemesterForm(true);
  };

  const resetYearForm = () => {
    setYearForm({
      schoolId: currentUser?.schoolId || '',
      name: '',
      startDate: '',
      endDate: '',
      isActive: false
    });
    setEditingYear(null);
    setShowYearForm(false);
  };

  const resetSemesterForm = () => {
    setSemesterForm({
      academicYearId: '',
      name: '',
      semesterNumber: 1,
      startDate: '',
      endDate: '',
      isActive: false
    });
    setEditingSemester(null);
    setShowSemesterForm(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📅 Kelola Tahun Ajaran & Semester</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowYearForm(!showYearForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Tambah Tahun Ajaran
            </button>
            <button
              onClick={() => setShowSemesterForm(!showSemesterForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ➕ Tambah Semester
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 
            message.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' : 
            'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Year Form */}
        {showYearForm && (
          <div className="mb-6 p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">
              {editingYear ? '✏️ Edit Tahun Ajaran' : '➕ Tambah Tahun Ajaran Baru'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentUser?.role === 'Admin' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Sekolah *</label>
                  <select
                    value={yearForm.schoolId}
                    onChange={(e) => setYearForm({...yearForm, schoolId: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Pilih Sekolah</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Nama Tahun Ajaran * (contoh: 2024/2025)</label>
                <input
                  type="text"
                  value={yearForm.name}
                  onChange={(e) => setYearForm({...yearForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="2024/2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tanggal Mulai *</label>
                <input
                  type="date"
                  value={yearForm.startDate}
                  onChange={(e) => setYearForm({...yearForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tanggal Selesai *</label>
                <input
                  type="date"
                  value={yearForm.endDate}
                  onChange={(e) => setYearForm({...yearForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={yearForm.isActive}
                  onChange={(e) => setYearForm({...yearForm, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Aktifkan tahun ajaran ini</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveYear}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? '⏳ Menyimpan...' : '💾 Simpan'}
              </button>
              <button
                onClick={resetYearForm}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ❌ Batal
              </button>
            </div>
          </div>
        )}

        {/* Semester Form */}
        {showSemesterForm && (
          <div className="mb-6 p-6 border-2 border-green-200 rounded-lg bg-green-50">
            <h2 className="text-xl font-semibold mb-4">
              {editingSemester ? '✏️ Edit Semester' : '➕ Tambah Semester Baru'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tahun Ajaran *</label>
                <select
                  value={semesterForm.academicYearId}
                  onChange={(e) => setSemesterForm({...semesterForm, academicYearId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>
                      {year.name} {year.isActive && '(Aktif)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nama Semester * (contoh: Semester 1 - 2024/2025)</label>
                <input
                  type="text"
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm({...semesterForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Semester 1 - 2024/2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nomor Semester *</label>
                <select
                  value={semesterForm.semesterNumber}
                  onChange={(e) => setSemesterForm({...semesterForm, semesterNumber: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={1}>Semester 1 (Ganjil)</option>
                  <option value={2}>Semester 2 (Genap)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tanggal Mulai *</label>
                <input
                  type="date"
                  value={semesterForm.startDate}
                  onChange={(e) => setSemesterForm({...semesterForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tanggal Selesai *</label>
                <input
                  type="date"
                  value={semesterForm.endDate}
                  onChange={(e) => setSemesterForm({...semesterForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={semesterForm.isActive}
                  onChange={(e) => setSemesterForm({...semesterForm, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Aktifkan semester ini</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveSemester}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
              >
                {loading ? '⏳ Menyimpan...' : '💾 Simpan'}
              </button>
              <button
                onClick={resetSemesterForm}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ❌ Batal
              </button>
            </div>
          </div>
        )}

        {/* Academic Years List */}
        {loading && <div className="text-center py-8">⏳ Memuat data...</div>}

        {!loading && academicYears.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">📋 Belum ada tahun ajaran</p>
            <p className="text-gray-500 text-sm mt-2">Klik tombol "Tambah Tahun Ajaran" untuk membuat yang pertama</p>
          </div>
        )}

        {!loading && academicYears.length > 0 && (
          <div className="space-y-6">
            {academicYears.map(year => {
              const yearSemesters = semesters.filter(s => s.academicYearId === year.id);
              
              return (
                <div key={year.id} className="border-2 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {year.name}
                        {year.isActive && <span className="text-sm px-3 py-1 bg-green-500 text-white rounded-full">✓ Aktif</span>}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(year.startDate).toLocaleDateString('id-ID')} - {new Date(year.endDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditYear(year)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteYear(year.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>

                  {/* Semesters under this year */}
                  {yearSemesters.length > 0 && (
                    <div className="mt-4 pl-4 border-l-4 border-blue-300 space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700 mb-3">Semester:</h4>
                      {yearSemesters.map(semester => (
                        <div key={semester.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <span className="font-medium">{semester.name}</span>
                            {semester.isActive && <span className="ml-2 text-xs px-2 py-1 bg-green-500 text-white rounded-full">✓ Aktif</span>}
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(semester.startDate).toLocaleDateString('id-ID')} - {new Date(semester.endDate).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSemester(semester)}
                              className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteSemester(semester.id)}
                              className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {yearSemesters.length === 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded">
                      ⚠️ Belum ada semester untuk tahun ajaran ini
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
