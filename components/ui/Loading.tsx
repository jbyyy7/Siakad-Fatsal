import React from 'react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  center?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  text = 'Memuat data...', 
  size = 'md',
  center = true 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = center 
    ? 'flex justify-center items-center p-8' 
    : 'flex items-center';

  return (
    <div className={containerClasses}>
      <div className={`animate-spin rounded-full border-b-2 border-brand-600 ${sizeClasses[size]}`}></div>
      {text && <span className="ml-3 text-gray-600">{text}</span>}
    </div>
  );
};

export default Loading;
