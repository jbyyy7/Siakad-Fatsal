// FIX: Implemented the ClassSchedulePage component which was a placeholder.
import React from 'react';
import Card from '../Card';
import { CalendarIcon } from '../icons/CalendarIcon';

const scheduleData = {
    'Senin': [{ time: '07:30 - 09:00', subject: 'Matematika' }, { time: '10:00 - 11:30', subject: 'Bahasa Indonesia' }],
    'Selasa': [{ time: '07:30 - 09:00', subject: 'Fisika' }, { time: '10:00 - 11:30', subject: 'Bahasa Inggris' }],
    'Rabu': [{ time: '07:30 - 09:00', subject: 'Kimia' }, { time: '10:00 - 11:30', subject: 'Biologi' }],
    'Kamis': [{ time: '07:30 - 09:00', subject: 'Sejarah' }, { time: '10:00 - 11:30', subject: 'Pendidikan Agama' }],
    'Jumat': [{ time: '07:30 - 09:00', subject: 'Olahraga' }, { time: '10:00 - 11:30', subject: 'Seni Budaya' }],
};

const ClassSchedulePage: React.FC = () => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Jadwal Pelajaran - MA Kelas 10-A</h2>
            <Card title="Jadwal Mingguan" icon={CalendarIcon}>
                <div className="space-y-6">
                    {Object.entries(scheduleData).map(([day, classes]) => (
                        <div key={day}>
                            <h3 className="text-lg font-semibold text-brand-800 border-b-2 border-brand-200 pb-1 mb-3">{day}</h3>
                            <ul className="space-y-2">
                                {classes.map((cls, index) => (
                                    <li key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                                        <span className="font-bold text-gray-700 w-32">{cls.time}</span>
                                        <span className="text-gray-600">{cls.subject}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default ClassSchedulePage;
