import React, { Fragment } from 'react';
import { XIcon } from '../icons/XIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <Fragment>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose} aria-hidden="true"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto my-8 transform transition-all animate-fade-in-up max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600" aria-label="Close modal">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
          {footer && (
            <div className="flex justify-end p-4 bg-gray-50 border-t rounded-b-lg flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default Modal;
