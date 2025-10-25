import React from 'react';

interface ChevronUpIconProps {
    className?: string;
}

export const ChevronUpIcon: React.FC<ChevronUpIconProps> = ({ className }) => {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
    );
};
