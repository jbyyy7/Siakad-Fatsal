// FIX: Implemented the GradesPage component which was a placeholder.
import React from 'react';
import Card from '../Card';
import { User } from '../../types';
import { MOCK_GRADES } from '../../constants';
import { ChartBarIcon } from '../icons/ChartBarIcon';

interface GradesPageProps {
  user: User;
}

const GradesPage: React.FC<GradesPageProps> = ({ user }) => {
    const myGrades = MOCK_GRADES[user.id] || [];
    const averageScore = myGrades.length > 0 
        ? (myGrades.reduce((acc, curr) => acc + curr.score, 0) / myGrades.length).toFixed(1)
        : 'N/A';
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Transkrip Nilai - {user.name}</h2>
            <div className="mb-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">Rata-rata Nilai Keseluruhan</h3>
                        <p className="text-3xl font-bold text-brand-700">{averageScore}</p>
                    </div>
                </Card>
            </div>
            <Card title="Daftar Nilai" icon={ChartBarIcon}>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Mata Pelajaran</th>
                                <th scope="col" className="px-6 py-3 text-center">Nilai Angka</th>
                                <th scope="col" className="px-6 py-3 text-center">Nilai Huruf</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myGrades.map(grade => (
                                <tr key={grade.subject} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{grade.subject}</td>
                                    <td className="px-6 py-4 text-center">{grade.score}</td>
                                    <td className="px-6 py-4 text-center font-bold">
                                         <span className={`px-3 py-1 text-xs rounded-full ${
                                             grade.score >= 85 ? 'bg-green-100 text-green-800' :
                                             grade.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                             'bg-red-100 text-red-800'
                                         }`}>
                                            {grade.grade}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </Card>
        </div>
    );
};

export default GradesPage;
