import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../Card';

const data = [
  { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.5 },
  { school: 'MTS Fathus Salafi', 'Rata-rata Nilai': 82.1 },
  { school: 'MI Fathus Salafi', 'Rata-rata Nilai': 88.3 },
];

const AcademicReportPage: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Laporan Akademik Yayasan</h2>
      <Card title="Perbandingan Rata-rata Nilai Antar Sekolah">
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="school" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Rata-rata Nilai" fill="#3e7cf8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default AcademicReportPage;
