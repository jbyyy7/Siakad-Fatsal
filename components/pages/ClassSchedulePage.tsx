
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { CalendarIcon } from '../icons/CalendarIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { dataService } from '../../services/dataService';
import { User } from '../../types'; // Assuming user prop is passed for context

interface ClassSchedulePageProps {
    // This component would ideally get the user to know which schedule to fetch
    // For now, we hardcode it as a placeholder for a real implementation
    // user: User;
}

const ClassSchedulePage: React.FC<ClassSchedulePageProps> = () => {
    const [scheduleData, setScheduleData] = useState<Record<string, {time: string, subject: string}[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                // Placeholder: In a real app, user.level and user.schoolId would be dynamic
                const data = await dataService.getClassSchedule('MA Kelas 10-A', 'ma_fs');
                setScheduleData(data);
            } catch (error) {
                console.error("Failed to fetch class schedule:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSchedule();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Jadwal Pelajaran - MA Kelas 10-A</h2>
                 <button
                    onClick={() => window.print()}
                    className="no-print flex items-center px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Cetak Jadwal
                </button>
            </div>
            
            <div id="printable-schedule" className="printable-area">
                <div className="hidden print-header">
                    <h1>Jadwal Pelajaran</h1>
                    <p>MA Fathus Salafi - Kelas 10-A</p>
                </div>
                <Card title="Jadwal Mingguan" icon={CalendarIcon}>
                    {isLoading ? <p>Memuat jadwal...</p> : (
                        <div className="space-y-6">
                            {Object.entries(scheduleData).map(([day, classes]) => (
                                <div key={day}>
                                    <h3 className="text-lg font-semibold text-brand-800 border-b-2 border-brand-200 pb-1 mb-3">{day}</h3>
                                    {/* FIX: Add type guard to ensure `classes` is an array before accessing properties. */}
                                    {Array.isArray(classes) && classes.length > 0 ? (
                                        <ul className="space-y-2">
                                            {/* FIX: The `map` method is now safe to call due to the type guard above. */}
                                            {classes.map((cls, index) => (
                                                <li key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                                                    <span className="font-bold text-gray-700 w-32">{cls.time}</span>
                                                    <span className="text-gray-600">{cls.subject}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">Tidak ada jadwal.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ClassSchedulePage;