import React from 'react';
import Card from '../Card';
import { User } from '../../types';

interface AdminAttendancePageProps {
    user: User;
}

const AdminAttendancePage: React.FC<AdminAttendancePageProps> = ({ user }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pantau Absensi Keseluruhan</h2>
            <Card>
                <div className="p-4 text-center">
                    <p className="text-gray-600">Fitur pemantauan absensi untuk Admin sedang dalam pengembangan.</p>
                </div>
            </Card>
        </div>
    );
};

export default AdminAttendancePage;
