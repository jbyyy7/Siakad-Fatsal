import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { parseExcelFile, downloadStudentImportTemplate } from '../utils/excelUtils';
import { logger } from '../utils/logger';

type RawRow = Record<string, unknown>;
type MappedRow = { full_name?: string; email?: string; phone?: string; class_name?: string };

const REQUIRED_FIELDS = ['full_name', 'email'];

export default function ImportStudents() {
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [errors, setErrors] = useState<(string | null)[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, running: false });
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File terlalu besar. Maksimal 5MB');
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
        const guess: Record<string, string> = {};
        hdrs.forEach((h) => {
          const key = h.toLowerCase().replace(/\s+/g, '_');
          if (['name', 'fullname', 'full_name'].some((k) => key.includes(k))) guess['full_name'] = h;
          if (['email'].some((k) => key.includes(k))) guess['email'] = h;
          if (['phone', 'tel'].some((k) => key.includes(k))) guess['phone'] = h;
          if (['class', 'kelas'].some((k) => key.includes(k))) guess['class_name'] = h;
        });
        setMapping(guess);
        toast.success(`${json.length} baris berhasil dibaca`);
      })
      .catch((error) => {
        logger.error('Failed to parse Excel file', error);
        toast.error('Gagal membaca file: ' + (error.message || 'Unknown error'));
      });
  }

  function mapRows() {
    const mapped: MappedRow[] = rawRows.map((r) => ({
      full_name: mapping['full_name'] ? String(r[mapping['full_name']] || '') : undefined,
      email: mapping['email'] ? String(r[mapping['email']] || '') : undefined,
      phone: mapping['phone'] ? String(r[mapping['phone']] || '') : undefined,
      class_name: mapping['class_name'] ? String(r[mapping['class_name']] || '') : undefined,
    }));
    setMappedRows(mapped);
    const errs = mapped.map((row) => {
      const missing = REQUIRED_FIELDS.filter((f) => !row[f as keyof MappedRow]);
      if (missing.length) return `Missing fields: ${missing.join(', ')}`;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(row.email))) return 'Invalid email';
      return null;
    });
    setErrors(errs);
  }

  async function submit() {
    const validRows = mappedRows.map((r, i) => ({ row: r, idx: i })).filter((x) => errors[x.idx] == null);
    if (!validRows.length) return toast.error('No valid rows to import');
    const batchSize = 20;
    setProgress({ done: 0, total: validRows.length, running: true });
    for (let i = 0; i < validRows.length; i += batchSize) {
      const slice = validRows.slice(i, i + batchSize);
      const batch = slice.map((v) => v.row);
      try {
        const res = await fetch('/api/import-students', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ rows: batch }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error('Batch import failed: ' + (json?.error || res.statusText));
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
    toast.success('Import finished');
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
