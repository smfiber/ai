import React from 'react';
import ScriptBlock from './ScriptBlock';

interface OutputPanelProps {
    script: string;
    onExplain: () => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ script, onExplain }) => {
    const showActions = script && !script.startsWith('//');

    const copyScript = async () => {
        if (!script) return;
        try {
            await navigator.clipboard.writeText(script);
            alert('Script copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy script: ', err);
            alert('Failed to copy script.');
        }
    };

    const downloadScript = () => {
        if (!script) return;
        const blob = new Blob([script], { type: 'text/powershell' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'generated_script.ps1';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="w-full md:w-2/3 flex flex-col bg-gray-800/50 relative">
            {showActions && (
                <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm z-10 p-2 flex justify-end space-x-2">
                    <button onClick={copyScript} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors">Copy</button>
                    <button onClick={downloadScript} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors">Download (.ps1)</button>
                    <button onClick={onExplain} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors">Explain Script</button>
                </div>
            )}
            <div className="flex-grow overflow-auto">
                {script ? (
                    <ScriptBlock script={script} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-6">
                        <svg className="w-16 h-16 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9.75 6.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5Z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-400">Your generated script will appear here</h3>
                        <p className="mt-2 max-w-md">Select a mode, describe your needs or paste a script, and send.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OutputPanel;
