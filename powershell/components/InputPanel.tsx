import React, { useState, useEffect, useRef } from 'react';
import { Mode, Sender, type ChatMessage } from '../types';
import { TARGET_ENVIRONMENTS } from '../constants';

interface InputPanelProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
    targetEnvironment: string;
    setTargetEnvironment: (env: string) => void;
    conversation: ChatMessage[];
    onPromptSubmit: (prompt: string) => void;
    isLoading: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({
    mode,
    setMode,
    targetEnvironment,
    setTargetEnvironment,
    conversation,
    onPromptSubmit,
    isLoading
}) => {
    const [prompt, setPrompt] = useState('');
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [conversation]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isLoading) {
            onPromptSubmit(prompt);
            setPrompt('');
        }
    };

    const promptPlaceholder = mode === Mode.Generate
        ? "Describe your desired script..."
        : "Paste a script to refactor, then describe the desired changes...";

    const promptRows = mode === Mode.Generate ? 2 : 6;

    return (
        <div className="w-full md:w-1/3 flex flex-col bg-gray-900 border-r border-gray-700">
            <div className="p-4 border-b border-gray-700 space-y-4 flex-shrink-0">
                <div>
                    <label className="text-lg font-semibold text-gray-200">Mode</label>
                    <div className="mt-2 flex bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setMode(Mode.Generate)}
                            className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${mode === Mode.Generate ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                        >
                            Generate New
                        </button>
                        <button
                            onClick={() => setMode(Mode.Refactor)}
                            className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${mode === Mode.Refactor ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                        >
                            Refactor Existing
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="target-env" className="text-lg font-semibold text-gray-200">Target Environment</label>
                    <select
                        id="target-env"
                        value={targetEnvironment}
                        onChange={(e) => setTargetEnvironment(e.target.value)}
                        className="mt-2 w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {TARGET_ENVIRONMENTS.map(env => <option key={env}>{env}</option>)}
                    </select>
                </div>
            </div>
            <div ref={chatHistoryRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                {conversation.map((msg, index) => (
                    <div key={index} className={`max-w-xl p-3 rounded-lg ${
                        msg.sender === Sender.User ? 'bg-blue-900/50 text-blue-100 self-end ml-auto' :
                        msg.sender === Sender.AI ? 'bg-gray-700/50 text-gray-300 self-start' :
                        'bg-red-900/50 text-red-200 self-start'
                    }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex items-start space-x-2">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={promptPlaceholder}
                        rows={promptRows}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition-all duration-200"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold p-3 rounded-lg transition-colors duration-200 flex-shrink-0 self-end"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086L2.279 16.76a.75.75 0 0 0 .95.826l16-5.333a.75.75 0 0 0 0-1.418l-16-5.333Z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InputPanel;
