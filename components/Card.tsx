import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', icon: Icon }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className="p-4 border-b border-gray-200 flex items-center">
          {Icon && <Icon className="h-6 w-6 text-brand-600 mr-3" />}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;
