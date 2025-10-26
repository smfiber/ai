// Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {

    // --- Global App State & DOM Elements ---
    let appKeys = {
        geminiApiKey: null,
        gCloudClientId: null,
        firebaseConfig: null
    };

    // Firebase instance
    let db;
    let fetchedTechnologies = [];

    // API Key Form Elements
    const apiKeyFormContainer = document.getElementById("api-key-form-container");
    const appContent = document.getElementById("app-content");
    const saveKeysButton = document.getElementById("save-keys-button");
    const geminiApiKeyInput = document.getElementById("gemini-api-key");
    const gCloudClientIdInput = document.getElementById("gcloud-client-id");
    const firebaseConfigInput = document.getElementById("firebase-config");

    // Module 1 (Problem Finder) Elements
    const systemSelect = document.getElementById("system-select");
    const taskSelect = document.getElementById("task-select");
    const problemSelect = document.getElementById("problem-select");
    const impactSelect = document.getElementById("impact-select");
    const generateBackstoryButton = document.getElementById("generate-backstory-button");
    const clearFinderButton = document.getElementById("clear-finder-button");
    const generatedBackstoryOutput = document.getElementById("generated-backstory-output");
    const generatedBackstoryTextarea = document.getElementById("generated-backstory-textarea");

    // Module 2 (Idea Generator) Elements
    const technologySelect = document.getElementById("technology-select");
    const categorySelect = document.getElementById("category-select"); // Added
    const generateAiIdeasButton = document.getElementById("generate-ai-ideas-button");
    const clearAiIdeasButton = document.getElementById("clear-ai-ideas-button");
    const generatedAiIdeasOutput = document.getElementById("generated-ai-ideas-output");
    const generatedAiIdeasTextarea = document.getElementById("generated-ai-ideas-textarea");


    // Module 3 (Story Converter) Elements
    const backstoryInput = document.getElementById("backstory-input");
    const convertStoryButton = document.getElementById("convert-story-button");
    const clearConverterButton = document.getElementById("clear-converter-button");
    const userStoryOutput = document.getElementById("user-story-output");
    const storyAsA = document.getElementById("story-as-a");
    const storyIWant = document.getElementById("story-i-want");
    const storySoThat = document.getElementById("story-so-that");
    const storyPreviewText = document.getElementById("story-preview-text");


    // --- Data for Modules ---

    const problemFinderData = {
        systems: [
            // This is now populated from Firestore
        ],
        tasks: [
            "Provisioning a new (VM, user, share)",
            "Running monthly patching",
            "Troubleshooting a performance issue",
            "Performing a backup or restore",
            "Running a compliance/audit report",
            "Hardware maintenance/firmware updates",
            "Certificate renewal"
        ],
        problems: [
            "It's 100% manual",
            "It's slow and blocks other work",
            "It's error-prone / easy to miss a step",
            "It requires logging into multiple systems",
            "The documentation is missing or wrong",
            "It fails silently without alerts",
            "It's overly complex"
        ],
        impacts: [
            "wastes X hours per week/month",
            "creates a security or compliance risk",
            "could cause an outage or downtime",
            "leads to alert fatigue",
            "is frustrating for me and my team",
            "prevents us from working on project goals",
            "results in inconsistent configurations"
        ]
    };

    // New data for Module 2 categories
    const ideaGeneratorCategories = [
        "Preventative Maintenance",
        "Security & Hardening",
        "Automation & Efficiency",
        "Reporting & Auditing",
        "Performance & Monitoring",
        "Configuration Cleanup"
    ];


    // --- Helper Functions ---

    /**
     * Initializes the Firebase app and Firestore.
     * @param {object} firebaseConfig - The Firebase config object.
     */
    function initializeFirebase(firebaseConfig) {
        try {
            // Check if app is already initialized
            if (firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.firestore();
            console.log("Firebase initialized successfully.");
            
            // Now that Firebase is ready, fetch the technologies
            fetchTechnologiesFromFirestore();

        } catch (e) {
            console.error("Error initializing Firebase: ", e);
            alert("Could not initialize Firebase. Please check your config and console for errors.");
        }
    }

    /**
     * Fetches the list of technologies from the Firestore 'technologies' collection.
     */
    async function fetchTechnologiesFromFirestore() {
        if (!db) {
            console.error("Firestore is not initialized.");
            return;
        }

        try {
            const querySnapshot = await db.collection("technologies").orderBy("name").get();
            fetchedTechnologies = querySnapshot.docs.map(doc => doc.data().name);
            
            // Clear placeholder and populate select (Module 1)
            systemSelect.innerHTML = '<option value="" disabled selected>-- Select a system --</option>';
            populateSelect(systemSelect, fetchedTechnologies);

            // Clear placeholder and populate select (Module 2)
            technologySelect.innerHTML = '<option value="" disabled selected>-- Select a technology --</option>';
            populateSelect(technologySelect, fetchedTechnologies);

            console.log("Fetched technologies:", fetchedTechnologies);

        } catch (e) {
            console.error("Error fetching technologies from Firestore: ", e);
            systemSelect.innerHTML = '<option value="" disabled selected>-- Error loading systems --</option>';
            technologySelect.innerHTML = '<option value="" disabled selected>-- Error loading systems --</option>';
            alert("Could not fetch technology list from Firestore. Please check permissions and console.");
        }
    }
    
    /**
     * Calls the Gemini API to generate content.
     * @param {string} prompt - The prompt to send to the API.
     */
    async function callGeminiAPI(prompt) {
        if (!appKeys.geminiApiKey) {
            alert("Gemini API key is not set.");
            return;
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${appKeys.geminiApiKey}`;

        generatedAiIdeasTextarea.value = "Generating... Please wait.";
        generatedAiIdeasOutput.style.display = "block";
        clearAiIdeasButton.style.display = "inline-flex";
        generateAiIdeasButton.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
            }

            const data = await response.json();
            const generatedText = data.candidates[0].content.parts[0].text;
            generatedAiIdeasTextarea.value = generatedText.trim();

        } catch (e) {
            console.error("Error calling Gemini API:", e);
            generatedAiIdeasTextarea.value = `Error generating content. Please check the console.\n\n${e.message}`;
        } finally {
            // Re-enable button only if both selects are still valid
            generateAiIdeasButton.disabled = (technologySelect.value === "" || categorySelect.value === "");
        }
    }

    /**
     * Populates a <select> element with options.
     * @param {HTMLSelectElement} selectElement - The <select> element to populate.
     * @param {string[]} options - An array of strings for the options.
     */
    function populateSelect(selectElement, options) {
        options.forEach(option => {
            const opt = document.createElement("option");
            opt.value = option;
            opt.textContent = option;
            selectElement.appendChild(opt);
        });
    }

    /**
     * Updates the preview text in Module 3.
     */
    function updateStoryPreview() {
        const asA = storyAsA.value || "[Role]";
        const iWant = storyIWant.value || "[Goal]";
        const soThat = soThat.value || "[Benefit]";
        storyPreviewText.innerHTML = `<strong>As a</strong> ${asA}, <strong>I want</strong> ${iWant}, <strong>so that</strong> ${soThat}.`;
    }

    // --- Initialization ---

    /**
     * Main initialization function
     */
    function init() {
        // --- API Key Form Logic ---
        
        saveKeysButton.addEventListener("click", () => {
            const fbConfigRaw = firebaseConfigInput.value;
            let fbConfigParsed;

            // Simple validation
            if (!geminiApiKeyInput.value || !gCloudClientIdInput.value || !fbConfigRaw) {
                alert("Please fill out all API key and config fields.");
                return;
            }

            // Try to parse Firebase config to ensure it's valid JSON/Object
            try {
                // This will handle either a JSON string or a JS object literal
                fbConfigParsed = (new Function(`return ${fbConfigRaw}`))();
                if (typeof fbConfigParsed !== 'object' || fbConfigParsed === null) {
                    throw new Error("Config is not a valid object.");
                }
            } catch (e) {
                alert("The Firebase Web App Config is not valid. Please paste the full object, e.g., { apiKey: '...', ... }");
                return;
            }

            // Save to global state variable (for this session only)
            appKeys.geminiApiKey = geminiApiKeyInput.value;
            appKeys.gCloudClientId = gCloudClientIdInput.value;
            appKeys.firebaseConfig = fbConfigParsed; // Save the parsed object

            // Hide form, show app
            apiKeyFormContainer.style.display = "none";
            appContent.style.display = "block";
                
            // Initialize Firebase
            initializeFirebase(appKeys.firebaseConfig);
        });


        // --- Module 1: Problem Finder Logic ---
        populateSelect(taskSelect, problemFinderData.tasks);
        populateSelect(problemSelect, problemFinderData.problems);
        populateSelect(impactSelect, problemFinderData.impacts);

        const finderInputs = [systemSelect, taskSelect, problemSelect, impactSelect];
        
        // Enable/disable 'Generate' button based on form completion
        finderInputs.forEach(input => {
            input.addEventListener("change", () => {
                const allFilled = finderInputs.every(i => i.value !== "");
                generateBackstoryButton.disabled = !allFilled;
            });
        });

        generateBackstoryButton.addEventListener("click", () => {
            const system = systemSelect.value;
            const task = taskSelect.value;
            const problem = problemSelect.value;
            const impact = impactSelect.value;
            
            const backstory = `The task of "${task}" on our "${system}" is a problem. The main issue is that "${problem}". This ${impact}.`;
            
            generatedBackstoryTextarea.value = backstory;
            generatedBackstoryOutput.style.display = "block";
        });

        clearFinderButton.addEventListener("click", () => {
            finderInputs.forEach(input => input.selectedIndex = 0);
            generateBackstoryButton.disabled = true;
            generatedBackstoryOutput.style.display = "none";
            generatedBackstoryTextarea.value = "";
        });


        // --- Module 2: Idea Generator Logic ---
        
        // Populate the new category dropdown
        populateSelect(categorySelect, ideaGeneratorCategories);

        // Add listeners for new dropdowns
        const module2Selects = [technologySelect, categorySelect];
        module2Selects.forEach(select => {
            select.addEventListener("change", () => {
                const allFilled = module2Selects.every(s => s.value !== "");
                generateAiIdeasButton.disabled = !allFilled;
            });
        });

        generateAiIdeasButton.addEventListener("click", () => {
            const selectedTech = technologySelect.value;
            const selectedCategory = categorySelect.value;
            
            if (!selectedTech || !selectedCategory) {
                alert("Please select both a technology and a category.");
                return;
            }
            if (fetchedTechnologies.length === 0) {
                alert("Technology list is still loading or is empty. Please wait or check Firestore.");
                return;
            }

            const prompt = `
                I am a Server Administrator. 
                My goal is to find new operational tasks for my backlog.
                
                Please generate 5-7 distinct task ideas related to the following criteria:
                -   Technology: "${selectedTech}"
                -   Category: "${selectedCategory}"

                For each idea:
                1.  Start with a clear **Task:** (e.g., "Task: Implement GPO block inheritance...").
                2.  Follow it with the **Pain Point:** this task solves (e.g., "Pain Point: Prevents conflicting policies...").
                3.  Keep the entire idea (Task + Pain Point) to 2-3 sentences.
                
                Do not number the list. Separate each idea with a blank line.
            `;
            
            callGeminiAPI(prompt.trim());
        });

        clearAiIdeasButton.addEventListener("click", () => {
            generatedAiIdeasTextarea.value = "";
            generatedAiIdeasOutput.style.display = "none";
            clearAiIdeasButton.style.display = "none";
            technologySelect.selectedIndex = 0; // Reset dropdowns
            categorySelect.selectedIndex = 0;
            generateAiIdeasButton.disabled = true; // Disable button
        });


        // --- Module 3: Story Converter Logic ---
        
        // Enable/disable 'Convert' button
        backstoryInput.addEventListener("input", () => {
            convertStoryButton.disabled = backstoryInput.value.trim() === "";
        });

        convertStoryButton.addEventListener("click", () => {
            userStoryOutput.style.display = "block";
            updateStoryPreview(); // Initial preview update
        });

        // Real-time preview update
        [storyAsA, storyIWant, storySoThat].forEach(input => {
            input.addEventListener("input", updateStoryPreview);
        });

        clearConverterButton.addEventListener("click", ()=> {
            backstoryInput.value = "";
            storyAsA.value = "Server Administrator";
            storyIWant.value = "";
            storySoThat.value = "";
            userStoryOutput.style.display = "none";
            convertStoryButton.disabled = true;
        });

    } // End of init()

    // Run the app
    init();

}); // End of DOMContentLoaded
