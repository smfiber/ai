import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        hljs: any;
    }
}

interface ScriptBlockProps {
    script: string;
}

const ScriptBlock: React.FC<ScriptBlockProps> = ({ script }) => {
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (codeRef.current && window.hljs) {
            window.hljs.highlightElement(codeRef.current);
        }
    }, [script]);

    return (
        <pre className="p-4 bg-gray-900 h-full">
            <code ref={codeRef} className="language-powershell code-font text-gray-200">
                {script}
            </code>
        </pre>
    );
};

export default ScriptBlock;
