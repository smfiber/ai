// gemini.js

/**
 * Calls the Gemini 1.5 Flash API to generate CBT content.
 */
export async function generateCBTContent(apiKey, topic, moduleContext) {
    
    // Using gemini-1.5-flash for speed and efficiency
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // The "System Instruction" built into the prompt
    const promptText = `
    You are an expert Clinical Psychologist and CBT Therapist.
    Your task is to write a structured educational lesson for a user practicing self-improvement.
    
    CONTEXT:
    Module: ${moduleContext}
    Topic: ${topic}
    
    INSTRUCTIONS:
    1. Write in a professional, empathetic, and educational tone.
    2. Use Markdown formatting (## Headers, **Bold**, *Italics*).
    3. Structure the article:
       - **Definition**: What is this concept?
       - **The Psychology**: Why does this happen?
       - **Real World Example**: A relatable scenario.
       - **Technique**: A specific CBT exercise to address it.
    4. Do not be conversational (no "Hello!", "How are you?"). Just the content.
    `;

    const payload = {
        contents: [{
            parts: [{ text: promptText }]
        }]
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract text from Gemini response structure
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("No content returned from Gemini.");
        }

    } catch (error) {
        console.error("Gemini Generation Failed:", error);
        throw error; 
    }
}
