// prompts.js

export const jsonInstruction = ` IMPORTANT: Ensure your response is ONLY a valid JSON object. All strings must be enclosed in double quotes. Any double quotes or backslashes within a string value must be properly escaped. Do not wrap the JSON in markdown code fences.`;

/**
 * Constructs the master prompts for generating Academic Psychology Articles.
 * Replaces the old IT-focused 'getMasterGuidePrompt'.
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
        
        // Extract persona from hierarchy if available (for browsing mode)
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

        //-- REQUIRED OUTPUT --//
        Generate ONLY the following 4 sections in Markdown format:

        ### 1. Abstract & Introduction
        - Define "${topic}" clearly.
        - State the scope of this article and why this topic is significant in the field of psychology.

        ### 2. Historical Context & Origins
        - Who were the pioneers of this concept? (e.g., Freud, Skinner, Piaget, etc., if applicable).
        - How has the understanding of this topic evolved over time?

        ### 3. Key Theories & Models
        - Describe the primary psychological theories or models that explain "${topic}".
        - Explain the theoretical framework.

        ### 4. Core Concepts & Terminology
        - Define specific terms essential to understanding "${topic}".
        - Explain the fundamental variables or psychological mechanisms involved.

        Format: Use '###' for headers. Return ONLY the markdown.
        `;
    }

    // -- FULL ARTICLE COMPLETION (Sections 5-10) --
    if (type === 'fullArticle') {
        
        const linksMarkdown = researchLinks.length > 0
            ? researchLinks.map(item => `- [${item.title}](${item.link}): ${item.snippet}`).join('\n')
            : 'No live research links provided. Rely on your internal knowledge base.';

        return `
        //-- MASTER INSTRUCTION: COMPLETE THE ACADEMIC ARTICLE --//
        You have ALREADY created the blueprint (Sections 1-4). Your task is to write the remaining detailed sections (5-10) to complete the paper.
        
        //-- CONTEXT: EXISTING BLUEPRINT --//
        ${blueprintMarkdown}
        
        ${commonInstructions}

        //-- LIVE RESEARCH CONTEXT --//
        Use the following real-world search results to inform your writing (especially for "Recent Research" and "References"):
        ${linksMarkdown}

        //-- REQUIRED OUTPUT: SECTIONS 5-10 --//
        Generate ONLY the markdown for the following sections. Be rigorous, cited, and detailed.

        ### 5. Methodology & Clinical Application
        - How is this studied in a lab setting? 
        - OR: How is this applied in therapy/clinical practice?
        - Describe standard assessment tools or interventions.

        ### 6. Case Studies or Real-World Examples
        - Provide 1-2 detailed examples or case vignettes that illustrate "${topic}" in action.
        - Analyze the example using the theories mentioned earlier.

        ### 7. Biological Underpinnings (Neuroscience)
        - What is happening in the brain? Discuss relevant brain structures, neurotransmitters, or physiological responses associated with "${topic}".

        ### 8. Criticisms & Debates
        - What are the major criticisms of the prevailing theories regarding "${topic}"?
        - Are there cultural biases or replication issues?

        ### 9. Conclusion
        - Synthesize the main points.
        - Suggest future directions for research.

        ### 10. References & Further Reading
        - Based on the "Live Research Context" provided above, list the most relevant sources.
        - Format as a list of links with brief descriptions of why they are valuable.
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
    - Maintain the academic or professional tone unless asked to change it.
    - Ensure psychological accuracy.
    - Return ONLY the revised markdown text.
    `;
}

/**
 * Prompt for the "Explanatory Article" modal (Alternative flow)
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
        Structure: Use narrative paragraphs (not numbered lists). Use bold text for key terms.
        Return only the raw text.
        `;
    }
    if (type === 'review') {
        return `
        Review and polish this psychology article. Integrate citations where possible.
        
        Intro: "${introductionText}"
        Body: "${expansionText}"
        
        Available Sources:
        ${sources}
        
        Task: Merge into a cohesive piece. Add inline citations [1] where sources support claims. Add a "### References" section at the end matching the citations.
        Return ONLY the final markdown.
        `;
    }
    return '';
}
