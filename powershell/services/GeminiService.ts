import { GoogleGenAI } from "@google/genai";
import { marked } from "marked";
import { BASE_META_PROMPT } from '../constants';
import { Mode } from '../types';

// IMPORTANT: This key is read from environment variables.
// Ensure the `API_KEY` environment variable is set in your deployment environment.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function constructPrompt(userPrompt: string, mode: Mode, environment: string): string {
    const environmentContext = `Environment Context: The script should be compatible with: ${environment}\n\n`;
    const taskInstruction = mode === Mode.Generate 
        ? 'Generate a PowerShell script based on the following user request:'
        : 'Refactor the provided PowerShell script based on the following instructions:';
    
    return `
${BASE_META_PROMPT}

${environmentContext}
Task: ${mode === Mode.Generate ? 'Generate New Script' : 'Refactor Existing Script'}

${taskInstruction}

User Input:
\`\`\`
${userPrompt}
\`\`\`

Provide only the PowerShell code within a single markdown code block. Do not include explanations.
`;
}

export async function generateScript(userPrompt: string, mode: Mode, environment: string): Promise<string> {
    const fullPrompt = constructPrompt(userPrompt, mode, environment);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
    });
    
    const rawText = response.text;
    
    if (!rawText) {
        throw new Error('No content received from API for script generation.');
    }
    
    const match = rawText.match(/```powershell\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : rawText.trim();
}

export async function explainScript(script: string): Promise<string> {
    const explanationPrompt = `You are an expert PowerShell scripting assistant. Analyze the following PowerShell script and provide a detailed, line-by-line explanation of how it works. Structure your explanation clearly using markdown.

\`\`\`powershell
${script}
\`\`\`
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: explanationPrompt,
    });

    const rawText = response.text;
    
    if (!rawText) {
      throw new Error('No explanation content received from API.');
    }
    
    // Use marked to convert markdown explanation to HTML
    return marked.parse(rawText) as string;
}
