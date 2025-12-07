// prompts.js

export const jsonInstruction = ` IMPORTANT: Ensure your response is ONLY a valid JSON object. All strings must be enclosed in double quotes. Any double quotes or backslashes within a string value must be properly escaped. Do not wrap the JSON in markdown code fences.`;

/**
 * Constructs the master prompts for generating Academic Psychology Articles.
 * * @param {string} type - 'blueprint' or 'fullArticle'.
 * @param {object} context - Data for prompt construction.
 * @returns {string} The fully constructed prompt.
 */
export function getPsychologyArticlePrompt(type, context) {
    const {
        topic = '',
        persona = 'Academic Researcher',
        tone = 'Professional',
        additionalContext = '',
        blueprintMarkdown = '', // Only used for fullArticle
        fullHierarchyPath = [],
        researchLinks = [] // Used for citation/reference integration in fullArticle
    } = context;

    let fullSubject = topic;
    let personaContext = '';

    // -- Context Building --
    if (fullHierarchyPath && Array.isArray(fullHierarchyPath) && fullHierarchyPath.length > 0) {
        const pathString = fullHierarchyPath.map(p => p.title || p).join(' -> ');
        fullSubject = `${topic} (Context: ${pathString})`;
        
        // Extract persona from hierarchy if available
        const finalCategory = fullHierarchyPath[fullHierarchyPath.length - 1];
        if (finalCategory && finalCategory.initialPrompt) {
            const match = finalCategory.initialPrompt.match(/Persona:(.*?)(Objective:|Instructions:|$)/is);
            if (match && match[1]) {
                personaContext = `Persona: You are ${match[1].trim()}.`;
            }
        }
    }
    
    // Fallback or Workshop Persona
    if (!personaContext) {
        personaContext = `Persona: You are an expert ${persona}.`;
    }

    const commonInstructions = `
${personaContext}
Audience & Tone: Write for a "${tone}" audience.
Primary Subject: "${fullSubject}".
Additional Constraints: ${additionalContext || 'None'}.
    `;

    // -- BLUEPRINT GENERATION (Sections 1-4) --
    if (type === 'blueprint') {
        return `
        //-- MASTER INSTRUCTION: GENERATE RESEARCH ARTICLE BLUEPRINT --//
        Generate the foundational sections (1-4) for a comprehensive psychology article on "${topic}".
        ${commonInstructions}

        //-- FORMATTING RULES --//
        1. Start with a brief standard introduction paragraph (no header).
        2. Use '###' (H3) for all main section headers. 
        3. Do NOT use H1 (#) or H2 (##) tags.
        4. Return ONLY the markdown.

        //-- REQUIRED SECTIONS --//

        ### 1. Abstract & Introduction
        - Define "${topic}" clearly.
        - State the scope of this article and why this topic is significant.

        ### 2. Historical Context & Origins
        - Who were the pioneers? (e.g., Freud, Skinner, Piaget).
        - How has the understanding evolved?

        ### 3. Key Theories & Models
        - Describe the primary psychological theories.
        - Explain the theoretical framework.

        ### 4. Core Concepts & Terminology
        - Define specific terms essential to understanding "${topic}".
        `;
    }

    // -- FULL ARTICLE COMPLETION (Sections 5-10) --
    if (type === 'fullArticle') {
        
        const linksMarkdown = researchLinks.length > 0
            ? researchLinks.map(item => `- [${item.title}](${item.link}): ${item.snippet}`).join('\n')
            : 'No live research links provided. Rely on your internal knowledge base.';

        return `
        //-- MASTER INSTRUCTION: COMPLETE THE ACADEMIC ARTICLE --//
        You have ALREADY created the blueprint (Sections 1-4). Your task is to write the remaining detailed sections (5-10).
        
        //-- CONTEXT: EXISTING BLUEPRINT --//
        ${blueprintMarkdown}
        
        ${commonInstructions}

        //-- LIVE RESEARCH CONTEXT --//
        Use these search results for "Recent Research" and "References":
        ${linksMarkdown}

        //-- FORMATTING RULES --//
        1. Use '###' (H3) for all main section headers.
        2. Do NOT use H1 (#) or H2 (##) tags.
        3. Return ONLY the markdown for sections 5-10.

        //-- REQUIRED SECTIONS --//

        ### 5. Methodology & Clinical Application
        - How is this studied in a lab? 
        - OR: How is this applied in therapy?

        ### 6. Case Studies or Real-World Examples
        - Provide 1-2 detailed examples or case vignettes.

        ### 7. Biological Underpinnings (Neuroscience)
        - Discuss relevant brain structures or neurotransmitters.

        ### 8. Criticisms & Debates
        - What are the major criticisms or cultural biases?

        ### 9. Conclusion
        - Synthesize main points and suggest future directions.

        ### 10. References & Further Reading
        - List relevant sources based on the "Live Research Context".
        - Format as a list of links.
        `;
    }

    return '';
}

/**
 * prompt for refining content (Editing/Polishing)
 */
export function getRefinementPrompt(originalText, refinementRequest) {
    return `
    Persona: You are a Senior Editor for a Psychology Journal.
    Task: Revise the text below based on the user's specific directive.
    
    //-- ORIGINAL TEXT --//
    ${originalText}
    
    //-- REVISION DIRECTIVE --//
    "${refinementRequest}"
    
    //-- GUIDELINES --//
    - Maintain the academic or professional tone.
    - Ensure psychological accuracy.
    - Return ONLY the revised markdown text.
    `;
}

/**
 * Prompt for the "Explanatory Article" modal
 */
export function getExplanatoryArticlePrompt(type, context) {
    const { topicTitle = '', introductionText = '', expansionText = '', sources = '' } = context;

    if (type === 'introduction') {
        return `Write a compelling, single-paragraph introduction for a psychology article about "${topicTitle}". Define it clearly and hook the reader. Return only the raw text.`;
    }
    if (type === 'expansion') {
        return `
        Write the main body of an article explaining "${topicTitle}".
        Context (Intro): "${introductionText}"
        Focus on: Psychological mechanisms, behavioral impacts, and theoretical significance.
        Structure: Use narrative paragraphs. Use bold text for key terms.
        Return only the raw text.
        `;
    }
    return '';
}
