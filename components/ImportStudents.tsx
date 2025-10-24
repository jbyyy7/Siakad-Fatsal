import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { parseExcelFile, downloadStudentImportTemplate } from '../utils/excelUtils';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabaseClient';
import { Class, User } from '../types';

type RawRow = Record<string, unknown>;
type MappedRow = { 
  full_name?: string; 
  email?: string; 
  phone?: string; 
  class_name?: string;
  nis?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  address?: string;
  blood_type?: string;
};

const REQUIRED_FIELDS = ['full_name', 'email', 'nis'];

export default function ImportStudents() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [errors, setErrors] = useState<(string | null)[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, running: false });
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadClasses();
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

  const loadClasses = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

      if (currentUser?.role !== 'Admin' && currentUser?.schoolId) {
        query = query.eq('school_id', currentUser.schoolId);
      }

      const { data } = await query;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const validateRow = (row: MappedRow, index: number): string | null => {
    // Required fields
    const missing = REQUIRED_FIELDS.filter((f) => !row[f as keyof MappedRow]);
    if (missing.length) return `Field wajib tidak ada: ${missing.join(', ')}`;
    
    // Email validation
    if (row.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(row.email))) {
      return 'Format email tidak valid';
    }
    
    // Parent email validation
    if (row.parent_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(row.parent_email))) {
      return 'Format email orang tua tidak valid';
    }
    
    // NIS validation (unique check will be done server-side)
    if (row.nis && !/^[0-9]+$/.test(String(row.nis))) {
      return 'NIS harus berupa angka';
    }
    
    // Phone validation
    if (row.phone && !/^[0-9+\-\s()]+$/.test(String(row.phone))) {
      return 'Format nomor telepon tidak valid';
    }
    
    if (row.parent_phone && !/^[0-9+\-\s()]+$/.test(String(row.parent_phone))) {
      return 'Format nomor telepon orang tua tidak valid';
    }
    
    // Date validation
    if (row.date_of_birth) {
      const date = new Date(row.date_of_birth);
      if (isNaN(date.getTime())) {
        return 'Format tanggal lahir tidak valid (gunakan YYYY-MM-DD)';
      }
    }
    
    // Blood type validation
    if (row.blood_type && !['A', 'B', 'AB', 'O', 'A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'].includes(row.blood_type.toUpperCase())) {
      return 'Golongan darah tidak valid (A/B/AB/O dengan +/-)';
    }
    
    // Check for duplicate NIS in the same batch
    const duplicateNIS = mappedRows.findIndex((r, i) => i !== index && r.nis === row.nis && row.nis);
    if (duplicateNIS !== -1) {
      return `NIS duplikat dengan baris ${duplicateNIS + 1}`;
    }
    
    // Check for duplicate email in the same batch
    const duplicateEmail = mappedRows.findIndex((r, i) => i !== index && r.email === row.email && row.email);
    if (duplicateEmail !== -1) {
      return `Email duplikat dengan baris ${duplicateEmail + 1}`;
    }
    
    return null;
  };

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File terlalu besar. Maksimal 10MB');
      return;
    }
    
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Format file tidak valid. Gunakan Excel (.xlsx, .xls) atau CSV');
      return;
    }

    parseExcelFile<RawRow>(file)
      .then((json) => {
        setRawRows(json || []);
        const hdrs = (json[0] && Object.keys(json[0])) || [];
        setHeaders(hdrs);
        
        // Auto-detect column mapping
        const guess: Record<string, string> = {};
        hdrs.forEach((h) => {
          const key = h.toLowerCase().replace(/\s+/g, '_');
          if (['name', 'fullname', 'full_name', 'nama'].some((k) => key.includes(k))) guess['full_name'] = h;
          if (['email', 'e-mail', 'surel'].some((k) => key.includes(k))) guess['email'] = h;
          if (['phone', 'tel', 'telepon', 'hp'].some((k) => key.includes(k))) guess['phone'] = h;
          if (['class', 'kelas'].some((k) => key.includes(k))) guess['class_name'] = h;
          if (['nis', 'nisn', 'nomor_induk'].some((k) => key.includes(k))) guess['nis'] = h;
          if (['parent', 'orang_tua', 'ortu', 'wali'].some((k) => key.includes(k)) && !key.includes('email') && !key.includes('phone')) guess['parent_name'] = h;
          if (['parent_email', 'email_orang_tua', 'email_ortu'].some((k) => key.includes(k))) guess['parent_email'] = h;
          if (['parent_phone', 'phone_orang_tua', 'hp_ortu', 'telepon_ortu'].some((k) => key.includes(k))) guess['parent_phone'] = h;
          if (['birth_date', 'tanggal_lahir', 'tgl_lahir', 'date_of_birth'].some((k) => key.includes(k))) guess['date_of_birth'] = h;
          if (['birth_place', 'tempat_lahir', 'place_of_birth'].some((k) => key.includes(k))) guess['place_of_birth'] = h;
          if (['address', 'alamat'].some((k) => key.includes(k))) guess['address'] = h;
          if (['blood', 'gol_darah', 'golongan_darah', 'blood_type'].some((k) => key.includes(k))) guess['blood_type'] = h;
        });
        setMapping(guess);
        toast.success(`✅ ${json.length} baris berhasil dibaca`);
      })
      .catch((error) => {
        logger.error('Failed to parse Excel file', error);
        toast.error('Gagal membaca file: ' + (error.message || 'Unknown error'));
      });
  }

  function mapRows() {
    const mapped: MappedRow[] = rawRows.map((r) => ({
      full_name: mapping['full_name'] ? String(r[mapping['full_name']] || '').trim() : undefined,
      email: mapping['email'] ? String(r[mapping['email']] || '').trim().toLowerCase() : undefined,
      phone: mapping['phone'] ? String(r[mapping['phone']] || '').trim() : undefined,
      class_name: mapping['class_name'] ? String(r[mapping['class_name']] || '').trim() : undefined,
      nis: mapping['nis'] ? String(r[mapping['nis']] || '').trim() : undefined,
      parent_name: mapping['parent_name'] ? String(r[mapping['parent_name']] || '').trim() : undefined,
      parent_email: mapping['parent_email'] ? String(r[mapping['parent_email']] || '').trim().toLowerCase() : undefined,
      parent_phone: mapping['parent_phone'] ? String(r[mapping['parent_phone']] || '').trim() : undefined,
      date_of_birth: mapping['date_of_birth'] ? String(r[mapping['date_of_birth']] || '').trim() : undefined,
      place_of_birth: mapping['place_of_birth'] ? String(r[mapping['place_of_birth']] || '').trim() : undefined,
      address: mapping['address'] ? String(r[mapping['address']] || '').trim() : undefined,
      blood_type: mapping['blood_type'] ? String(r[mapping['blood_type']] || '').trim().toUpperCase() : undefined,
    }));
    setMappedRows(mapped);
    
    // Run validation
    const errs = mapped.map((row, index) => validateRow(row, index));
    setErrors(errs);
    setShowValidation(true);
    
    const validCount = errs.filter(e => e === null).length;
    const errorCount = errs.filter(e => e !== null).length;
    
    toast.success(`✅ Validasi selesai: ${validCount} valid, ${errorCount} error`);
  }

  async function submit() {
    if (!selectedClass) {
      toast.error('⚠️ Pilih kelas terlebih dahulu');
      return;
    }
    
    const validRows = mappedRows.map((r, i) => ({ row: r, idx: i })).filter((x) => errors[x.idx] == null);
    if (!validRows.length) {
      toast.error('❌ Tidak ada baris valid untuk diimpor');
      return;
    }
    
    const batchSize = 20;
    setProgress({ done: 0, total: validRows.length, running: true });
    
    for (let i = 0; i < validRows.length; i += batchSize) {
      const slice = validRows.slice(i, i + batchSize);
      const batch = slice.map((v) => ({
        ...v.row,
        class_id: selectedClass,
        school_id: currentUser?.schoolId
      }));
      
      try {
        const res = await fetch('/api/import-students', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ rows: batch }),
        });
        const json = await res.json();
        
        if (!res.ok) {
          toast.error('❌ Batch import gagal: ' + (json?.error || res.statusText));
          break;
        }
        
        const { results } = json as { results: Array<any> };
        results.forEach((r, idx) => {
          const globalIndex = slice[idx].idx ?? (i + idx);
          setErrors((prev) => {
            const arr = [...prev];
            arr[globalIndex] = r.ok ? null : r.error || 'server error';
            return arr;
          });
        });
        
        setProgress((p) => ({ ...p, done: p.done + batch.length }));
      } catch (err: any) {
        toast.error(String(err?.message || err));
        break;
      }
    }
    
    setProgress((p) => ({ ...p, running: false }));
    const finalErrors = errors.filter(e => e === null);
    toast.success(`✅ Import selesai: ${finalErrors.length} berhasil dari ${validRows.length}`);
  }

  async function retryRow(index: number) {
    const row = mappedRows[index];
    if (!row) return;
    try {
      const res = await fetch('/api/import-students', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows: [row] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      const r = json.results?.[0];
      setErrors((prev) => {
        const arr = [...prev];
        arr[index] = r?.ok ? null : r?.error || 'server error';
        return arr;
      });
      if (r?.ok) toast.success(`Row ${index + 1} imported`);
    } catch (err: any) {
      setErrors((prev) => {
        const arr = [...prev];
        arr[index] = String(err?.message || err);
        return arr;
      });
      toast.error(String(err?.message || err));
    }
  }

  async function retryAllFailures() {
    const failedIdx = errors.map((e, i) => (e ? i : -1)).filter((i) => i >= 0);
    if (failedIdx.length === 0) return toast.error('No failures to retry');
    for (const i of failedIdx) {
      await retryRow(i);
    }
  }

  async function retrySelected() {
    const idx = Object.keys(selectedRows).map((k) => Number(k)).filter((k) => selectedRows[k]);
    if (idx.length === 0) return toast.error('No rows selected');
    for (const i of idx) {
      await retryRow(i);
    }
  }

  function downloadFailedCSV() {
    const failed: Array<Record<string, any>> = [];
    errors.forEach((err, i) => {
      if (err) {
        failed.push({
          full_name: mappedRows[i]?.full_name || '',
          email: mappedRows[i]?.email || '',
          phone: mappedRows[i]?.phone || '',
          class_name: mappedRows[i]?.class_name || '',
          error: err,
        });
      }
    });
    if (!failed.length) return toast.error('No failed rows to download');
    const csv = [Object.keys(failed[0]).join(',')]
      .concat(failed.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_imports.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded failed rows');
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Import Students (Excel/CSV)</h3>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => downloadStudentImportTemplate()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download Template
        </button>
        <label className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
          Choose File
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleFile} 
            className="hidden" 
          />
        </label>
      </div>

      {headers.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-300 mb-2">Map columns from your file to SIAKAD fields:</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {['full_name', 'email', 'phone', 'class_name'].map((field) => (
              <div key={field}>
                <label className="block text-xs text-gray-200">{field}</label>
                <select className="w-full bg-white text-black p-1" value={mapping[field] || ''} onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}>
                  <option value="">-- none --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button className="btn btn-secondary" onClick={mapRows}>Preview Mapping</button>
            <button className="btn btn-primary" onClick={submit} disabled={progress.running || mappedRows.length === 0}>Start Import</button>
            <button className="btn btn-ghost ml-auto" onClick={retryAllFailures}>Retry All Failures</button>
            <button className="btn btn-ghost" onClick={downloadFailedCSV}>Download Failed CSV</button>
            <button className="btn btn-outline" onClick={retrySelected}>Retry Selected</button>
          </div>

          {mappedRows.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-300">Preview (first 100 rows)</div>
              <table className="w-full table-auto text-sm mt-2">
                <thead>
                  <tr>
                    <th className="text-left">Sel</th>
                    <th className="text-left">#</th>
                    <th className="text-left">Full Name</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Phone</th>
                    <th className="text-left">Class</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 100).map((r, i) => (
                    <tr key={i} className={errors[i] ? 'bg-red-100' : ''}>
                      <td>
                        <input type="checkbox" checked={!!selectedRows[i]} onChange={(e) => setSelectedRows((s) => ({ ...s, [i]: e.target.checked }))} />
                      </td>
                      <td>{i + 1}</td>
                      <td>
                        {editingRow === i ? (
                          <input className="w-full" value={r.full_name || ''} onChange={(e) => setMappedRows((prev) => { const arr = [...prev]; arr[i] = { ...arr[i], full_name: e.target.value }; return arr; })} />
                        ) : (
                          r.full_name
                        )}
                      </td>
                      <td>
                        {editingRow === i ? (
                          <input className="w-full" value={r.email || ''} onChange={(e) => setMappedRows((prev) => { const arr = [...prev]; arr[i] = { ...arr[i], email: e.target.value }; return arr; })} />
                        ) : (
                          r.email
                        )}
                      </td>
                      <td>
                        {editingRow === i ? (
                          <input className="w-full" value={r.phone || ''} onChange={(e) => setMappedRows((prev) => { const arr = [...prev]; arr[i] = { ...arr[i], phone: e.target.value }; return arr; })} />
                        ) : (
                          r.phone
                        )}
                      </td>
                      <td>
                        {editingRow === i ? (
                          <input className="w-full" value={r.class_name || ''} onChange={(e) => setMappedRows((prev) => { const arr = [...prev]; arr[i] = { ...arr[i], class_name: e.target.value }; return arr; })} />
                        ) : (
                          r.class_name
                        )}
                      </td>
                      <td>{errors[i] ? <span className="text-red-600">{errors[i]}</span> : <span className="text-green-600">OK</span>}</td>
                      <td>
                        {editingRow === i ? (
                          <>
                            <button className="btn btn-sm btn-primary mr-2" onClick={() => setEditingRow(null)}>Save</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditingRow(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-sm btn-secondary mr-2" onClick={() => setEditingRow(i)}>Edit</button>
                            <button className="btn btn-sm btn-primary" onClick={() => retryRow(i)}>Retry</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {progress.total > 0 && (
            <div className="mt-3 text-sm">
              Progress: {progress.done}/{progress.total} {progress.running ? '(running)' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
