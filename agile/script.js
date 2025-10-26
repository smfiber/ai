// Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {

    // --- Global App State & DOM Elements ---
    let appKeys = {
        geminiApiKey: null,
        gCloudClientId: null,
        firebaseConfig: null
    };

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
    const categoryButtonsContainer = document.getElementById("category-buttons-container");
    const promptListContainer = document.getElementById("prompt-list-container");

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
            "Active Directory",
            "VMware/ESXi Host",
            "HPE ProLiant Server",
            "Windows File Server",
            "Certificate Authority",
            "Backup System (e.g., Veeam)",
            "Monitoring System",
            "A specific PowerShell script"
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

    const ideaGeneratorData = {
        "Automation (PowerShell, etc.)": [
            "What's a manual task you do every single day or week?",
            "What report do you have to build by hand for your manager?",
            "What task involves copy-pasting from a spreadsheet into a console?",
            "What process involves updating more than 3 systems to make one change?",
            "What's the 'dumb' task that everyone on the team hates doing?"
        ],
        "Core Services (AD, DNS, CAs)": [
            "What's a common Active Directory cleanup task (stale users, old computers) that gets skipped?",
            "Is our Certificate Authority maintenance (e.g., CRL publishing) automated?",
            "When was the last time we audited DHCP scopes or DNS records for old entries?",
            "What AD group policy is causing the most help desk tickets?"
        ],
        "Hardware & Virtualization (VMware, HPE)": [
            "Which physical server are you most worried about failing?",
            "When provisioning a new VM, what's the most time-consuming *manual* step?",
            "Are there 'zombie' VMs (unused but still on) we could find and reclaim?",
            "Is our host firmware/driver-level patching a manual nightmare?",
            "Are all our ESXi host configurations standardized?"
        ],
        "Security, Patching & Compliance": [
            "What's the biggest bottleneck on 'Patch Tuesday'?",
            "Which systems are the hardest to patch without causing user downtime?",
            "Is there a manual compliance check you have to perform for an audit?",
            "Where are we not enforcing 'least privilege' properly?",
            "Do we have an automated way to check for local admin accounts on servers?"
        ],
        "Monitoring & Performance": [
            "What problem do you always learn about from users *before* your monitoring tools?",
            "Which server is always running low on [disk space / RAM / CPU]?",
            "What alert do you get that you always ignore (alert fatigue)?",
            "What system is everyone complaining about being 'slow'?",
            "What critical process has *no* monitoring on it at all?"
        ]
    };


    // --- Helper Functions ---

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
        
        // Try to load keys from localStorage
        const savedKeys = localStorage.getItem("appKeys");
        if (savedKeys) {
            try {
                appKeys = JSON.parse(savedKeys);
                // Check if all keys are present
                if (appKeys.geminiApiKey && appKeys.gCloudClientId && appKeys.firebaseConfig) {
                    // If keys are valid, hide form and show app
                    apiKeyFormContainer.style.display = "none";
                    appContent.style.display = "block";
                    // Initialize Firebase here (we'll add this later)
                    // initializeFirebase(appKeys.firebaseConfig); 
                } else {
                    // Populate form with any saved (but incomplete) keys
                    populateKeyForm();
                }
            } catch (e) {
                console.error("Failed to parse saved keys:", e);
                localStorage.removeItem("appKeys");
            }
        }

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

            // Save to global state
            appKeys.geminiApiKey = geminiApiKeyInput.value;
            appKeys.gCloudClientId = gCloudClientIdInput.value;
            appKeys.firebaseConfig = fbConfigParsed; // Save the parsed object

            // Save to localStorage
            try {
                localStorage.setItem("appKeys", JSON.stringify(appKeys));
                
                // Hide form, show app
                apiKeyFormContainer.style.display = "none";
                appContent.style.display = "block";
                
                // Initialize Firebase
                // initializeFirebase(appKeys.firebaseConfig);
                alert("Keys saved and app initialized!");

            } catch (e) {
                console.error("Failed to save keys:", e);
                alert("Error saving keys. See console for details.");
            }
        });

        function populateKeyForm() {
            geminiApiKeyInput.value = appKeys.geminiApiKey || "";
            gCloudClientIdInput.value = appKeys.gCloudClientId || "";
            // Stringify the config object for the textarea
            if (appKeys.firebaseConfig) {
                try {
                    firebaseConfigInput.value = JSON.stringify(appKeys.firebaseConfig, null, 2);
                } catch {
                    firebaseConfigInput.value = "";
                }
            }
        }


        // --- Module 1: Problem Finder Logic ---
        populateSelect(systemSelect, problemFinderData.systems);
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
        const categories = Object.keys(ideaGeneratorData);
        categories.forEach(category => {
            const button = document.createElement("button");
            button.className = "category-button";
            button.textContent = category;
            button.dataset.category = category;
            categoryButtonsContainer.appendChild(button);
        });

        categoryButtonsContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("category-button")) {
                const selectedCategory = e.target.dataset.category;
                
                // Toggle active class on buttons
                document.querySelectorAll(".category-button").forEach(btn => {
                    btn.classList.remove("active");
                });
                e.target.classList.add("active");

                // Generate and display prompts
                const prompts = ideaGeneratorData[selectedCategory];
                promptListContainer.innerHTML = `
                    <h3>Prompts for "${selectedCategory}"</h3>
                    <ul>
                        ${prompts.map(prompt => `<li>${prompt}</li>`).join("")}
                    </ul>
                    <button class="clear-button" id="hide-prompts-button">Hide Prompts</button>
                `;
                promptListContainer.style.display = "block";
                
                // Add event listener to the new "Hide Prompts" button
                document.getElementById("hide-prompts-button").addEventListener("click", () => {
                    promptListContainer.style.display = "none";
                    e.target.classList.remove("active");
                });
            }
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

        clearConverterButton.addEventListener("click", () => {
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
