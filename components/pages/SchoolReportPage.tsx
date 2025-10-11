
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { User } from '../../types';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SchoolReportPageProps {
  user: User;
}

const SchoolReportPage: React.FC<SchoolReportPageProps> = ({ user }) => {
  const [gradeData, setGradeData] = useState<{ subject: string; avg: number; }[]>([]);
  const [attendanceData, setAttendanceData] = useState<{ month: string; percentage: number; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user.schoolId) return;

    const fetchData = async () => {
      try {
        const [grades, attendance] = await Promise.all([
          dataService.getAverageGradesBySubject(user.schoolId!),
          dataService.getAttendanceTrend(user.schoolId!)
        ]);
        setGradeData(grades);
        setAttendanceData(attendance);
      } catch (error) {
        console.error("Failed to fetch school report data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.schoolId]);
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Laporan Sekolah - {user.schoolName}</h2>
      {isLoading ? <p>Memuat laporan...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Rata-rata Nilai per Mata Pelajaran">
                <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                          <BarChart data={gradeData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="subject" />
                              <YAxis domain={[60,100]}/>
                              <Tooltip />
                              <Bar dataKey="avg" fill="#3e7cf8" name="Rata-rata"/>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
            </Card>
            <Card title="Tren Tingkat Kehadiran">
                  <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                          <LineChart data={attendanceData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis domain={[90, 100]} unit="%"/>
                              <Tooltip />
                              <Line type="monotone" dataKey="percentage" stroke="#3064eb" strokeWidth={2} name="Kehadiran"/>
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
            </Card>
        </div>
      )}
    </div>
  );
};

export default SchoolReportPage;
