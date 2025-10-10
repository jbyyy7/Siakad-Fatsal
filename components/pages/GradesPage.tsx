// FIX: Implemented the GradesPage component which was a placeholder.
import React from 'react';
import Card from '../Card';
import { MOCK_GRADES } from '../../constants';
import { ChartBarIcon } from '../icons/ChartBarIcon';

const GradesPage: React.FC = () => {
    // Assuming the logged in student is 'siswa_ma_01' for demonstration
    const myGrades = MOCK_GRADES['siswa_ma_01'] || [];

    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
        if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
        if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Transkrip Nilai</h2>
            <Card title="Nilai Semester Ini" icon={ChartBarIcon}>
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
                                    <td className="px-6 py-4 text-center font-semibold text-gray-700">{grade.score}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColor(grade.grade)}`}>
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
