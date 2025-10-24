import React from 'react';

interface EmptyStateProps {
  message?: string;
  submessage?: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = 'Belum ada data',
  submessage = 'Klik tombol "Tambah" untuk membuat data baru',
  icon
}) => {
  return (
    <div className="text-center py-12">
      {icon && <div className="flex justify-center mb-4 text-gray-400">{icon}</div>}
      <p className="text-gray-500 text-lg mb-2">{message}</p>
      {submessage && <p className="text-gray-400 text-sm">{submessage}</p>}
    </div>
  );
};

export default EmptyState;
