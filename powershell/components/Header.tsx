import React from 'react';

interface HeaderProps {
    onShowPrompts: () => void;
    version: string;
}

const Header: React.FC<HeaderProps> = ({ onShowPrompts, version }) => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between shadow-lg z-20 flex-shrink-0">
            <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9.75 6.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5Z" />
                </svg>
                <h1 className="text-xl font-bold text-white">
                    PowerShell ScriptSmith AI
                    <span className="text-xs font-mono text-blue-400/80 ml-2">v{version}</span>
                </h1>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={onShowPrompts}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors"
                >
                    View Prompts
                </button>
            </div>
        </header>
    );
};

export default Header;
