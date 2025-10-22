/**
 * Excel utility using exceljs (secure alternative to xlsx)
 * Provides consistent Excel import/export functionality
 */

import ExcelJS from 'exceljs';
import { StudentImportRow, ImportValidationError } from '../types';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Parse Excel/CSV file to JSON
 */
export async function parseExcelFile<T = Record<string, unknown>>(
  file: File
): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  
  if (file.name.endsWith('.csv')) {
    // For CSV, use CSV parser directly
    const text = await file.text();
    const rows: T[] = [];
    const lines = text.split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/^"/, '').replace(/"$/, '')) || [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/^"/, '').replace(/"$/, ''));
      const row: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row as T);
    }
    return rows;
  }
  
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in file');
  }

  const rows: T[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row is headers
      row.eachCell((cell) => {
        headers.push(String(cell.value || '').trim());
      });
    } else {
      // Data rows
      const rowData: Record<string, unknown> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData as T);
      }
    }
  });

  return rows;
}

/**
 * Export data to Excel file
 */
export async function exportToExcel<T = Record<string, unknown>>(
  data: T[],
  columns: ExcelColumn[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  // Set columns
  worksheet.columns = columns;

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Auto-fit columns (approximate)
  worksheet.columns.forEach((column) => {
    if (!column.width) {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLength = String(cell.value || '').length;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    }
  });

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Validate student import data
 */
export function validateStudentImport(
  rows: StudentImportRow[]
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  const seenEmails = new Set<string>();
  const seenIdentityNumbers = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel is 1-indexed and has header row

    // Required fields
    if (!row.identityNumber?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'identityNumber',
        message: 'Nomor induk wajib diisi',
      });
    } else {
      // Check duplicates
      if (seenIdentityNumbers.has(row.identityNumber)) {
        errors.push({
          row: rowNumber,
          field: 'identityNumber',
          message: 'Nomor induk duplikat dalam file',
          value: row.identityNumber,
        });
      }
      seenIdentityNumbers.add(row.identityNumber);
    }

    if (!row.name?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Nama wajib diisi',
      });
    }

    if (!row.email?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Email wajib diisi',
      });
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Format email tidak valid',
          value: row.email,
        });
      }
      // Check duplicates
      if (seenEmails.has(row.email)) {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Email duplikat dalam file',
          value: row.email,
        });
      }
      seenEmails.add(row.email);
    }

    // Optional field validations
    if (row.gender && !['Laki-laki', 'Perempuan'].includes(row.gender)) {
      errors.push({
        row: rowNumber,
        field: 'gender',
        message: 'Jenis kelamin harus "Laki-laki" atau "Perempuan"',
        value: row.gender,
      });
    }

    if (row.dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.dateOfBirth)) {
        errors.push({
          row: rowNumber,
          field: 'dateOfBirth',
          message: 'Format tanggal lahir harus YYYY-MM-DD',
          value: row.dateOfBirth,
        });
      }
    }

    // Email validation for parent
    if (row.parentPhoneNumber && row.parentPhoneNumber.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.parentPhoneNumber)) {
        errors.push({
          row: rowNumber,
          field: 'parentPhoneNumber',
          message: 'Format email orang tua tidak valid',
          value: row.parentPhoneNumber,
        });
      }
    }
  });

  return errors;
}

/**
 * Create Excel template for student import
 */
export async function downloadStudentImportTemplate(): Promise<void> {
  const columns: ExcelColumn[] = [
    { header: 'Nomor Induk', key: 'identityNumber', width: 15 },
    { header: 'Nama Lengkap', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Tempat Lahir', key: 'placeOfBirth', width: 20 },
    { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'dateOfBirth', width: 20 },
    { header: 'Jenis Kelamin', key: 'gender', width: 15 },
    { header: 'Agama', key: 'religion', width: 15 },
    { header: 'Alamat', key: 'address', width: 30 },
    { header: 'No. Telepon', key: 'phoneNumber', width: 15 },
    { header: 'Nama Orang Tua', key: 'parentName', width: 25 },
    { header: 'No. Telepon/Email Orang Tua', key: 'parentPhoneNumber', width: 25 },
  ];

  const sampleData: StudentImportRow[] = [
    {
      identityNumber: '2024001',
      name: 'Ahmad Zaki',
      email: 'ahmad.zaki@example.com',
      placeOfBirth: 'Jakarta',
      dateOfBirth: '2010-05-15',
      gender: 'Laki-laki',
      religion: 'Islam',
      address: 'Jl. Merdeka No. 123',
      phoneNumber: '081234567890',
      parentName: 'Budi Santoso',
      parentPhoneNumber: '081234567891',
    },
    {
      identityNumber: '2024002',
      name: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@example.com',
      placeOfBirth: 'Bandung',
      dateOfBirth: '2010-08-20',
      gender: 'Perempuan',
      religion: 'Islam',
      address: 'Jl. Sudirman No. 456',
      phoneNumber: '081234567892',
      parentName: 'Asep Rahman',
      parentPhoneNumber: 'asep.rahman@example.com',
    },
  ];

  await exportToExcel(sampleData, columns, 'template_import_siswa');
}
