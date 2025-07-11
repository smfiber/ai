import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-4xl relative max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold leading-none"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-white mb-4 flex-shrink-0">{title}</h2>
                <div className="overflow-y-auto pr-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
