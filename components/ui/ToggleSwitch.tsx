import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, label }) => {
  return (
    <div className="flex items-center">
      <button
        type="button"
        className={`${enabled ? 'bg-brand-600' : 'bg-gray-200'}
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
        onClick={() => onChange(!enabled)}
        role="switch"
        aria-checked={enabled}
      >
        <span
          aria-hidden="true"
          className={`${enabled ? 'translate-x-5' : 'translate-x-0'}
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
      {label && <span className="ml-3 text-sm font-medium text-gray-700" onClick={() => onChange(!enabled)}>{label}</span>}
    </div>
  );
};

export default ToggleSwitch;
