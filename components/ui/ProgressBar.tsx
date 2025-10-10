import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '' }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div className="bg-brand-600 h-2.5 rounded-full" style={{ width: `${safeValue}%` }}></div>
    </div>
  );
};

export default ProgressBar;
