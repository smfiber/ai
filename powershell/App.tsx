import React, { useState, useCallback } from 'react';
import { Mode, Sender, type ChatMessage } from './types';
import { TARGET_ENVIRONMENTS, BASE_META_PROMPT, APP_VERSION } from './constants';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import Modal from './components/Modal';
import { generateScript, explainScript } from './services/geminiService';

const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>(Mode.Generate);
    const [targetEnvironment, setTargetEnvironment] = useState<string>(TARGET_ENVIRONMENTS[0]);
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [generatedScript, setGeneratedScript] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExplanationLoading, setIsExplanationLoading] = useState<boolean>(false);
    const [explanation, setExplanation] = useState<string>('');
    const [isPromptsModalOpen, setIsPromptsModalOpen] = useState<boolean>(false);
    const [isExplanationModalOpen, setIsExplanationModalOpen] = useState<boolean>(false);

    const handlePromptSubmit = useCallback(async (userPrompt: string) => {
        setIsLoading(true);
        setGeneratedScript('// Generating script... Please wait.');
        const newConversation: ChatMessage[] = [...conversation, { sender: Sender.User, text: userPrompt }];
        setConversation(newConversation);

        try {
            const script = await generateScript(userPrompt, mode, targetEnvironment);
            setGeneratedScript(script);
            setConversation(prev => [...prev, { sender: Sender.AI, text: 'Script generated successfully.' }]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setGeneratedScript(`// Error: ${errorMessage}`);
            setConversation(prev => [...prev, { sender: Sender.Error, text: `Failed to generate script. ${errorMessage}` }]);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [conversation, mode, targetEnvironment]);

    const handleExplainScript = useCallback(async () => {
        if (!generatedScript || generatedScript.startsWith('//')) return;

        setIsExplanationLoading(true);
        setIsExplanationModalOpen(true);
        setExplanation('');

        try {
            const explanationHtml = await explainScript(generatedScript);
            setExplanation(explanationHtml);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setExplanation(`<p class="text-red-400"><strong>Error:</strong> ${errorMessage}</p>`);
            console.error(error);
        } finally {
            setIsExplanationLoading(false);
        }
    }, [generatedScript]);
    
    const PromptsModalContent: React.FC = () => (
        <div className="text-gray-300 text-sm space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Base Meta Prompt</h3>
                <p className="text-gray-400 mb-2">This foundational prompt guides the AI to follow PowerShell best practices for every request.</p>
                <pre className="bg-gray-900 p-3 rounded-lg whitespace-pre-wrap code-font max-h-96 overflow-y-auto">{BASE_META_PROMPT}</pre>
            </div>
             <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Task-Specific Instructions</h3>
                <p className="text-gray-400 mb-2">Depending on the selected mode, one of the following instructions is appended to the base prompt.</p>
                 <div className="space-y-3">
                    <details className="bg-gray-900 p-3 rounded-lg">
                        <summary className="font-semibold text-gray-200 cursor-pointer">Generate New Script</summary>
                        <pre className="mt-2 text-gray-300 text-sm whitespace-pre-wrap code-font">
{`
Environment Context: The script should be compatible with: {{targetEnvironment}}

Task: Generate New Script

Generate a PowerShell script based on the following user request:

User Input:
\`\`\`
{{userPrompt}}
\`\`\`

Provide only the PowerShell code within a single markdown code block. Do not include explanations.
`}
                        </pre>
                    </details>
                    <details className="bg-gray-900 p-3 rounded-lg">
                        <summary className="font-semibold text-gray-200 cursor-pointer">Refactor Existing Script</summary>
                        <pre className="mt-2 text-gray-300 text-sm whitespace-pre-wrap code-font">
{`
Environment Context: The script should be compatible with: {{targetEnvironment}}

Task: Refactor Existing Script

Refactor the provided PowerShell script based on the following instructions:

User Input:
\`\`\`
{{userPrompt}}
\`\`\`

Provide only the PowerShell code within a single markdown code block. Do not include explanations.
`}
                        </pre>
                    </details>
                 </div>
            </div>
        </div>
    );

    return (
        <div id="app" className="flex flex-col h-screen bg-gray-900">
            <Header onShowPrompts={() => setIsPromptsModalOpen(true)} version={APP_VERSION} />
            <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
                <InputPanel
                    mode={mode}
                    setMode={setMode}
                    targetEnvironment={targetEnvironment}
                    setTargetEnvironment={setTargetEnvironment}
                    conversation={conversation}
                    onPromptSubmit={handlePromptSubmit}
                    isLoading={isLoading}
                />
                <OutputPanel
                    script={generatedScript}
                    onExplain={handleExplainScript}
                />
            </main>

            <Modal
                isOpen={isPromptsModalOpen}
                onClose={() => setIsPromptsModalOpen(false)}
                title="System Prompts"
            >
                <PromptsModalContent />
            </Modal>
            
            <Modal
                isOpen={isExplanationModalOpen}
                onClose={() => setIsExplanationModalOpen(false)}
                title="Script Explanation (AI-Generated)"
            >
                {isExplanationLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Generating explanation... this may take a moment.</p>
                    </div>
                ) : (
                    <div
                        className="prose prose-invert max-w-none prose-pre:bg-gray-900 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: explanation }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default App;
