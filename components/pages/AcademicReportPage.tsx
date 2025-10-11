
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';

const AcademicReportPage: React.FC = () => {
  const [data, setData] = useState<{ school: string, 'Rata-rata Nilai': number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const performanceData = await dataService.getSchoolPerformance();
        setData(performanceData);
      } catch (error) {
        console.error("Failed to fetch academic report data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Laporan Akademik Yayasan</h2>
      <Card title="Perbandingan Rata-rata Nilai Antar Sekolah">
        <div style={{ width: '100%', height: 400 }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Memuat data laporan...</p>
            </div>
          ) : (
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
          )}
        </div>
      </Card>
    </div>
  );
};

export default AcademicReportPage;
