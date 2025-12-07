// prompts.js

export const jsonInstruction = ` IMPORTANT: Ensure your response is ONLY a valid JSON object. All strings must be enclosed in double quotes. Any double quotes or backslashes within a string value must be properly escaped. Do not wrap the JSON in markdown code fences.`;

/**
 * Constructs the master prompts for generating Psychology Articles.
 * * @param {string} type - 'blueprint' or 'fullArticle'.
 * @param {object} context - Data for prompt construction.
 * @returns {string} The fully constructed prompt.
 */
export function getPsychologyArticlePrompt(type, context) {
    const {
        topic = '',
        persona = 'Science Journalist',
        tone = 'Casual',
        additionalContext = '',
        blueprintMarkdown = '', 
        fullHierarchyPath = [],
        researchLinks = [] 
    } = context;

    let fullSubject = topic;
    let personaContext = '';

    // -- Persona Mapping --
    switch (persona) {
        case 'Science Journalist':
            personaContext = `Persona: You are a top-tier science journalist (like in popular science magazines). Your goal is to make complex topics fascinating and easy to understand for a general audience. Use storytelling and clear analogies.`;
            break;
        case 'Psychology Teacher':
            personaContext = `Persona: You are an engaging High School Psychology Teacher. You explain concepts clearly using relatable examples from daily life. You are patient and encouraging.`;
            break;
        case 'Life Coach':
            personaContext = `Persona: You are a supportive Life Coach. You focus on how this psychological concept applies to the user's personal growth, relationships, and well-being.`;
            break;
        default:
            personaContext = `Persona: You are a helpful guide explaining psychology simply.`;
    }

    const commonInstructions = `
${personaContext}
Audience & Tone: Write for a "${tone}" audience. 
- **CRITICAL:** Avoid academic jargon. If you must use a technical term, define it immediately in plain English.
- Use short paragraphs and bullet points for readability.
- Use metaphors and real-world scenarios.
Primary Subject: "${fullSubject}".
Additional Constraints: ${additionalContext || 'None'}.
    `;

    // -- BLUEPRINT GENERATION (Sections 1-4) --
    if (type === 'blueprint') {
        return `
        //-- MASTER INSTRUCTION: DRAFT ARTICLE BLUEPRINT --//
        Generate the first half (Sections 1-4) of an easy-to-read guide on "${topic}".
        ${commonInstructions}

        //-- FORMATTING RULES --//
        1. Start with a catchy Introduction (no header) that hooks the reader.
        2. Use '###' (H3) for main section headers. 
        3. Do NOT use H1 (#) or H2 (##) tags.
        4. Return ONLY the markdown.

        //-- REQUIRED SECTIONS --//

        ### 1. What is "${topic}"?
        - A simple, plain-English definition.
        - Why does this matter to a normal person?

        ### 2. Where did this idea come from?
        - A brief, interesting history (mention key figures like Freud or Skinner only if necessary for the story).
        - How has our understanding changed?

        ### 3. The Core Concept Explained
        - Explain the theory using a strong Analogy or Metaphor.
        - Break it down into simple steps or principles.

        ### 4. Key Terms to Know
        - A "Cheat Sheet" of 3-4 terms related to this topic, defined simply.
        `;
    }

    // -- FULL ARTICLE COMPLETION (Sections 5-10) --
    if (type === 'fullArticle') {
        
        const linksMarkdown = researchLinks.length > 0
            ? researchLinks.map(item => `- [${item.title}](${item.link}): ${item.snippet}`).join('\n')
            : 'No live research links provided. Rely on your internal knowledge base.';

        return `
        //-- MASTER INSTRUCTION: COMPLETE THE GUIDE --//
        You have ALREADY created the blueprint (Sections 1-4). Your task is to write the rest of the guide (Sections 5-10).
        
        //-- CONTEXT: EXISTING BLUEPRINT --//
        ${blueprintMarkdown}
        
        ${commonInstructions}

        //-- LIVE RESEARCH CONTEXT --//
        Use these search results for "Recent Findings" and "Resources":
        ${linksMarkdown}

        //-- FORMATTING RULES --//
        1. Use '###' (H3) for main section headers.
        2. Do NOT use H1 (#) or H2 (##) tags.
        3. Return ONLY the markdown for sections 5-10.

        //-- REQUIRED SECTIONS --//

        ### 5. How it Works in Real Life
        - Give concrete examples of this concept in action (at work, in relationships, or at home).

        ### 6. Case Study / Story
        - A short, illustrative story (fictional or historical) showing this concept.

        ### 7. What's Happening in the Brain?
        - A *simplified* look at the biology. Mention brain areas only if it helps understand the "Why".
        - Keep it "Science Lite".

        ### 8. Common Myths vs. Facts
        - Debunk 2-3 common misunderstandings about this topic.

        ### 9. Takeaways
        - A bulleted summary of the most important points.

        ### 10. Further Reading & Resources
        - List relevant books or articles based on the "Live Research Context".
        `;
    }

    return '';
}

export function getRefinementPrompt(originalText, refinementRequest) {
    return `
    Task: Rewrite the text below based on the user's request.
    Original Text: ${originalText}
    Request: "${refinementRequest}"
    Guideline: Keep it simple, clear, and engaging.
    `;
}

export function getExplanatoryArticlePrompt(type, context) {
    // Unchanged for now, can be simplified later if needed
    const { topicTitle = '', introductionText = '' } = context;
    if (type === 'introduction') {
        return `Write a catchy, single-paragraph intro for a beginner's guide to "${topicTitle}". Hook the reader. Return raw text.`;
    }
    if (type === 'expansion') {
        return `
        Write the main body of a simple guide explaining "${topicTitle}".
        Context (Intro): "${introductionText}"
        Focus on: Practical examples and simple explanations.
        Structure: Use narrative paragraphs.
        Return only the raw text.
        `;
    }
    return '';
}
