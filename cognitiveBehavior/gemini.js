export async function generateCBTContent(apiKey, topic, moduleContext) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `
    Role: Expert Cognitive Behavioral Therapist.
    Task: Write a structured educational lesson for a student.
    Module Context: ${moduleContext}
    Specific Topic: ${topic}
    
    Format requirements:
    - Use Markdown (Headers, bolding, bullet points).
    - Explain the concept clearly.
    - Provide a realistic example.
    - End with a short 'Self-Reflection' exercise.
    `;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
