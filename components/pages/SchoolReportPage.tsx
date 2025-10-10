import React from 'react';
import Card from '../Card';
import { User } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SchoolReportPageProps {
  user: User;
}

const gradeData = [
    { subject: 'Matematika', avg: 82 },
    { subject: 'B. Indo', avg: 88 },
    { subject: 'Fisika', avg: 79 },
    { subject: 'Kimia', avg: 85 },
    { subject: 'Biologi', avg: 81 },
];

const attendanceData = [
    { month: 'Jan', percentage: 98 },
    { month: 'Feb', percentage: 97 },
    { month: 'Mar', percentage: 95 },
    { month: 'Apr', percentage: 98 },
    { month: 'Mei', percentage: 96 },
    { month: 'Jun', percentage: 99 },
];

const SchoolReportPage: React.FC<SchoolReportPageProps> = ({ user }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Laporan Sekolah - {user.schoolName}</h2>
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
    </div>
  );
};

export default SchoolReportPage;
