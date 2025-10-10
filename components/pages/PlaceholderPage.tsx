import React from 'react';
import Card from '../Card';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <Card>
      <div className="text-center py-16 px-6">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-brand-100 rounded-full animate-pulse"></div>
          <AcademicCapIcon className="relative mx-auto h-24 w-24 text-brand-500" />
        </div>
        <h2 className="mt-8 text-3xl font-extrabold text-gray-900 tracking-tight">Segera Hadir: {title}</h2>
        <p className="mt-4 max-w-xl mx-auto text-lg text-gray-600">
          Tim kami sedang bekerja keras untuk membangun fitur ini. Pantau terus untuk pembaruan selanjutnya!
        </p>
      </div>
    </Card>
  );
};

export default PlaceholderPage;