// Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {

    // --- Global App State & DOM Elements ---
    let appKeys = {
        geminiApiKey: null,
        gCloudClientId: null,
        firebaseConfig: null
    };

    // Firebase instances
    let db;
    let auth;
    // Data is now stored as an array of technology objects
    // e.g., { id: "...", name: "...", functions: ["...", "..."] }
    let fetchedTechnologies = [];

    // Modal & Scrim Elements
    const appScrim = document.getElementById("app-scrim");
    const apiKeyModal = document.getElementById("api-key-modal");
    const dataCrudModal = document.getElementById("data-crud-modal");
    
    // API Key Form Elements
    const apiKeyFormContainer = document.getElementById("api-key-form-container");
    const saveKeysButton = document.getElementById("save-keys-button");
    const geminiApiKeyInput = document.getElementById("gemini-api-key");
    const gCloudClientIdInput = document.getElementById("gcloud-client-id");
    const firebaseConfigInput = document.getElementById("firebase-config");
    const googleSignInButton = document.getElementById("google-signin-button");

    // Main App Content
    const appContent = document.getElementById("app-content");
    const userInfoDisplay = document.getElementById("user-info");
    const userEmailDisplay = document.getElementById("user-email");
    const signOutButton = document.getElementById("sign-out-button");


    // CRUD Modal Elements
    const manageDataButton = document.getElementById("manage-data-button");
    const closeCrudModalButton = document.getElementById("close-crud-modal-button");
    const newItemNameInput = document.getElementById("new-item-name");
    const addTechnologyButton = document.getElementById("add-technology-button");
    const addFunctionTechSelect = document.getElementById("add-function-tech-select");
    const newFunctionNameInput = document.getElementById("new-function-name");
    const addFunctionButton = document.getElementById("add-function-button");
    const technologiesList = document.getElementById("technologies-list");

    // Module 2 (Idea Generator) Elements
    const technologySelect = document.getElementById("technology-select");
    const categorySelect = document.getElementById("category-select"); // This ID is re-used for "Team Function"
    const generateAiIdeasButton = document.getElementById("generate-ai-ideas-button");
    const clearAiIdeasButton = document.getElementById("clear-ai-ideas-button");
    const generatedAiIdeasOutput = document.getElementById("generated-ai-ideas-output");
    const generatedAiIdeasHtml = document.getElementById("generated-ai-ideas-html");


    // Module 3 (Story Converter) Elements
    const backstoryInput = document.getElementById("backstory-input");
    const convertStoryButton = document.getElementById("convert-story-button");
    const clearConverterButton = document.getElementById("clear-converter-button");
    const userStoryOutput = document.getElementById("user-story-output");
    const storyAsA = document.getElementById("story-as-a");
    const storyIWant = document.getElementById("story-i-want");
    const storySoThat = document.getElementById("story-so-that");
    const storyPreviewText = document.getElementById("story-preview-text");


    // --- Helper Functions ---

    /**
     * Initializes the Firebase app, Firestore, and Auth.
     * @param {object} firebaseConfig - The Firebase config object.
     */
    function initializeFirebase(firebaseConfig) {
        try {
            // Check if app is already initialized
            if (firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.firestore();
            auth = firebase.auth();
            console.log("Firebase initialized successfully.");
            
            // Now that Firebase is ready, set up auth listeners
            setupAuthListeners();
            // Enable the sign-in button
            googleSignInButton.disabled = false;

        } catch (e) {
            console.error("Error initializing Firebase: ", e);
            alert("Could not initialize Firebase. Please check your config and console for errors.");
        }
    }

    /**
     * Sets up the Firebase Auth state change listener.
     */
    function setupAuthListeners() {
        if (!auth) return;

        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                console.log("User signed in:", user.email);
                // Hide modal and scrim, show app content
                apiKeyModal.style.display = "none";
                appScrim.style.display = "none";
                appContent.style.display = "block";
                manageDataButton.style.display = "block";
                
                // Show user info
                userEmailDisplay.textContent = user.email;
                userInfoDisplay.style.display = "flex";

                // Fetch Firestore data *after* user is logged in
                refreshAllData();

            } else {
                // User is signed out
                console.log("User signed out.");
                // Show modal and scrim, hide app content
                apiKeyModal.style.display = "flex";
                appScrim.style.display = "block";
                appContent.style.display = "none";
                manageDataButton.style.display = "none";
                
                // Hide user info
                userInfoDisplay.style.display = "none";
                userEmailDisplay.textContent = "";

                // Clear any fetched data
                fetchedTechnologies = [];
                populateSelect(technologySelect, [], "-- Login to load systems --");
                populateSelect(categorySelect, [], "-- Login to load functions --", true); // Disable function select
                populateCrudList(technologiesList, []);
                populateSelect(addFunctionTechSelect, [], "-- Select a technology --");
            }
        });
    }

    /**
     * Fetches and repopulates all data from Firestore.
     */
    async function refreshAllData() {
        await fetchTechnologiesFromFirestore();
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
            fetchedTechnologies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Populate app dropdowns
            populateSelect(technologySelect, fetchedTechnologies, "-- Select a technology --");
            // Populate CRUD list
            populateCrudList(technologiesList, fetchedTechnologies);
            // Populate CRUD modal dropdown
            populateSelect(addFunctionTechSelect, fetchedTechnologies, "-- Select a technology --");
            
            console.log("Fetched technologies:", fetchedTechnologies);

        } catch (e) {
            console.error("Error fetching technologies from Firestore: ", e);
            technologySelect.innerHTML = '<option value="" disabled selected>-- Error loading systems --</option>';
            // Do not alert, console error is sufficient
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

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${appKeys.geminiApiKey}`;

        generatedAiIdeasHtml.innerHTML = "<p>Generating... Please wait.</p>";
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
            
            // --- New logic for individual ideas and copy buttons ---
            generatedAiIdeasHtml.innerHTML = ""; // Clear "Generating..."
            
            // Split ideas by one or more blank lines
            const ideas = generatedText.trim().split(/\n\s*\n/);
            
            ideas.forEach(ideaText => {
                const ideaDiv = document.createElement("div");
                ideaDiv.className = "generated-idea-item";
                
                // Use marked.parse for the idea text
                const ideaHtml = marked.parse(ideaText.trim());
                
                // Add the copy button
                ideaDiv.innerHTML = `
                    <button class="copy-button individual-copy-button" title="Copy to clipboard">
                        <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        <span>Copy</span>
                    </button>
                    <div class="idea-content">${ideaHtml}</div>
                `;
                
                generatedAiIdeasHtml.appendChild(ideaDiv);
            });


        } catch (e) {
            console.error("Error calling Gemini API:", e);
            generatedAiIdeasHtml.innerHTML = `<p>Error generating content. Please check the console.</p><p><strong>${e.message}</strong></p>`;
        } finally {
            // Re-enable button only if both selects are still valid
            generateAiIdeasButton.disabled = (technologySelect.value === "" || categorySelect.value === "");
        }
    }

    /**
     * Populates a <select> element with options from an array of objects.
     * @param {HTMLSelectElement} selectElement - The <select> element to populate.
     * @param {object[]} options - An array of objects, e.g., { id: "...", name: "..." } or simple strings.
     * @param {string} placeholder - The placeholder text (e.g., "-- Select an option --").
     * @param {boolean} [disabled=false] - Whether to disable the select element.
     */
    function populateSelect(selectElement, options, placeholder, disabled = false) {
        selectElement.innerHTML = `<option value="" disabled selected>${placeholder}</option>`; // Clear old options
        selectElement.disabled = disabled;
        
        options.forEach(option => {
            const opt = document.createElement("option");
            
            if (typeof option === 'string') {
                opt.value = option;
                opt.textContent = option;
            } else {
                // Assumes object with { id: "...", name: "..." }
                // We use the ID for value in the CRUD select, but name for the main app
                if (selectElement.id === 'add-function-tech-select') {
                    opt.value = option.id; // Use Firestore ID for the CRUD selector
                } else {
                    opt.value = option.name; // Use name for main app selectors
                }
                opt.textContent = option.name;
            }
            selectElement.appendChild(opt);
        });
    }

    /**
     * Populates the <ul> in the CRUD modal with technologies and their nested functions.
     * @param {HTMLUListElement} listElement - The <ul> element to populate.
     * @param {object[]} data - The array of technology objects.
     */
    function populateCrudList(listElement, data) {
        listElement.innerHTML = ""; // Clear old list
        if (data.length === 0) {
            listElement.innerHTML = "<li>No technologies defined.</li>";
            return;
        }

        data.forEach(tech => {
            const li = document.createElement("li");
            
            // Create sublist of functions
            let functionsHtml = '<ul class="function-sublist">';
            if (tech.functions && tech.functions.length > 0) {
                tech.functions.forEach(funcName => {
                    functionsHtml += `
                        <li>
                            <span>${funcName}</span>
                            <div class="item-controls">
                                <button class="delete-button delete-function-button" 
                                        data-tech-id="${tech.id}" 
                                        data-func-name="${funcName}">Delete</button>
                            </div>
                        </li>
                    `;
                });
            } else {
                functionsHtml += '<li><small>No functions added yet.</small></li>';
            }
            functionsHtml += '</ul>';

            // Create the main technology list item
            li.innerHTML = `
                <div class="technology-item-header">
                    <span>${tech.name}</span>
                    <div class="item-controls">
                        <button class="edit-button edit-tech-button" 
                                data-id="${tech.id}" 
                                data-name="${tech.name}">Edit</button>
                        <button class="delete-button delete-tech-button" 
                                data-id="${tech.id}" 
                                data-name="${tech.name}">Delete</button>
                    </div>
                </div>
                ${functionsHtml}
            `;
            listElement.appendChild(li);
        });
    }

    /**
     * Updates the preview text in Module 3.
     */
    function updateStoryPreview() {
        const asA = storyAsA.value || "[Role]";
        const iWant = storyIWant.value || "[Goal]";
        const soThat = storySoThat.value || "[Benefit]";
        storyPreviewText.innerHTML = `<strong>As a</strong> ${asA}, <strong>I want</strong> ${iWant}, <strong>so that</strong> ${soThat}.`;
    }

    // --- Auth Functions ---
    
    /**
     * Handles the Google Sign-In popup flow.
     */
    function handleGoogleSignIn() {
        if (!auth) {
            alert("Firebase Auth is not initialized.");
            return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch((error) => {
            console.error("Google Sign-In Error:", error);
            alert(`Could not sign in with Google. Error: ${error.message}`);
        });
    }

    /**
     * Handles the user sign-out flow.
     */
    function handleSignOut() {
        if (auth) {
            auth.signOut();
        }
    }


    // --- CRUD Functions ---

    /**
     * Adds a new technology document to Firestore.
     */
    async function handleAddTechnology() {
        const name = newItemNameInput.value.trim();
        if (!name) {
            alert("Please enter a technology name.");
            return;
        }
        if (!db) {
            alert("Firestore is not initialized.");
            return;
        }

        const newTechnology = { 
            name: name,
            functions: [] // Initialize with an empty functions array
        };

        try {
            await db.collection("technologies").add(newTechnology);
            console.log(`Added technology "${name}"`);
            newItemNameInput.value = ""; // Clear input
            await fetchTechnologiesFromFirestore(); // Refresh all data
        } catch (e) {
            console.error("Error adding technology: ", e);
            alert(`Could not add technology. Error: ${e.message}`);
        }
    }

    /**
     * Adds a new function string to a technology's 'functions' array.
     */
    async function handleAddFunction() {
        const techId = addFunctionTechSelect.value;
        const funcName = newFunctionNameInput.value.trim();

        if (!techId || !funcName) {
            alert("Please select a technology and enter a function name.");
            return;
        }
        if (!db) {
            alert("Firestore is not initialized.");
            return;
        }

        const techRef = db.collection("technologies").doc(techId);

        try {
            await techRef.update({
                functions: firebase.firestore.FieldValue.arrayUnion(funcName)
            });
            console.log(`Added function "${funcName}" to tech ID "${techId}"`);
            newFunctionNameInput.value = ""; // Clear input
            addFunctionTechSelect.selectedIndex = 0;
            addFunctionButton.disabled = true;
            await fetchTechnologiesFromFirestore(); // Refresh all data
        } catch (e) {
            console.error("Error adding function: ", e);
            alert(`Could not add function. Error: ${e.message}`);
        }
    }

    /**
     * Updates an existing technology's name in Firestore.
     * @param {string} id - The document ID.
     * @param {string} oldName - The current name (for the prompt).
     */
    async function handleEditTechnology(id, oldName) {
        const newName = prompt(`Enter a new name for "${oldName}":`, oldName);
        if (!newName || newName.trim() === "" || newName === oldName) {
            return; // User cancelled or didn't change the name
        }
        if (!db) {
            alert("Firestore is not initialized.");
            return;
        }

        try {
            await db.collection("technologies").doc(id).update({ name: newName.trim() });
            console.log(`Updated "${oldName}" to "${newName}"`);
            await fetchTechnologiesFromFirestore(); // Refresh all data
        } catch (e) {
            console.error("Error updating technology: ", e);
            alert(`Could not update technology. Error: ${e.message}`);
        }
    }

    /**
     * Deletes a technology document from Firestore.
     * @param {string} id - The document ID.
     * @param {string} name - The item name (for confirmation).
     */
    async function handleDeleteTechnology(id, name) {
        if (!confirm(`Are you sure you want to delete the TECHNOLOGY "${name}"?\nThis will also delete ALL of its associated functions.`)) {
            return;
        }
        if (!db) {
            alert("Firestore is not initialized.");
            return;
        }

        try {
            await db.collection("technologies").doc(id).delete();
            console.log(`Deleted technology "${name}"`);
            await fetchTechnologiesFromFirestore(); // Refresh all data
        } catch (e) {
            console.error("Error deleting technology: ", e);
            alert(`Could not delete technology. Error: ${e.message}`);
        }
    }

    /**
     * Deletes a function string from a technology's 'functions' array.
     * @param {string} techId - The technology document ID.
     * @param {string} funcName - The function name string to remove.
     */
    async function handleDeleteFunction(techId, funcName) {
        if (!confirm(`Are you sure you want to delete the FUNCTION "${funcName}"?`)) {
            return;
        }
        if (!db) {
            alert("Firestore is not initialized.");
            return;
        }

        const techRef = db.collection("technologies").doc(techId);

        try {
            await techRef.update({
                functions: firebase.firestore.FieldValue.arrayRemove(funcName)
            });
            console.log(`Deleted function "${funcName}" from tech ID "${techId}"`);
            await fetchTechnologiesFromFirestore(); // Refresh all data
        } catch (e) {
            console.error("Error deleting function: ", e);
            alert(`Could not delete function. Error: ${e.message}`);
        }
    }


    // --- Initialization ---

    /**
     * Main initialization function
     */
    function init() {
        // --- API Key Form Logic ---
        // App starts with API modal visible and scrim visible
        appScrim.style.display = "block";
        apiKeyModal.style.display = "flex";
        
        saveKeysButton.addEventListener("click", () => {
            const fbConfigRaw = firebaseConfigInput.value;
            let fbConfigParsed;

            // Simple validation
            if (!geminiApiKeyInput.value || !gCloudClientIdInput.value || !fbConfigRaw) {
                alert("Please fill out all API key and config fields.");
                return;
            }

            // Try to parse Firebase config
            try {
                fbConfigParsed = (new Function(`return ${fbConfigRaw}`))();
                if (typeof fbConfigParsed !== 'object' || fbConfigParsed === null) {
                    throw new Error("Config is not a valid object.");
                }
            } catch (e) {
                alert("The Firebase Web App Config is not valid. Please paste the full object, e.g., { apiKey: '...', ... }");
                return;
            }

            // Save to global state variable
            appKeys.geminiApiKey = geminiApiKeyInput.value;
            appKeys.gCloudClientId = gCloudClientIdInput.value;
            appKeys.firebaseConfig = fbConfigParsed;

            // DO NOT hide modal. Instead, initialize Firebase which enables the sign-in button.
            // The auth listener will hide the modal upon successful sign-in.
            initializeFirebase(appKeys.firebaseConfig);
        });

        // --- Auth Button Listeners ---
        googleSignInButton.addEventListener("click", handleGoogleSignIn);
        signOutButton.addEventListener("click", handleSignOut);


        // --- CRUD Modal Logic ---
        manageDataButton.addEventListener("click", () => {
            dataCrudModal.style.display = "flex";
            appScrim.style.display = "block";
        });

        closeCrudModalButton.addEventListener("click", () => {
            dataCrudModal.style.display = "none";
            appScrim.style.display = "none";
        });

        addTechnologyButton.addEventListener("click", handleAddTechnology);
        addFunctionButton.addEventListener("click", handleAddFunction);

        // Enable "Add Function" button only when both fields are filled
        [addFunctionTechSelect, newFunctionNameInput].forEach(el => {
            el.addEventListener("input", () => {
                const allFilled = addFunctionTechSelect.value !== "" && newFunctionNameInput.value.trim() !== "";
                addFunctionButton.disabled = !allFilled;
            });
        });

        // Event delegation for Edit/Delete buttons in the tech list
        technologiesList.addEventListener("click", (e) => {
            const target = e.target.closest("button"); // Find the button clicked
            if (!target) return; // Didn't click a button

            if (target.classList.contains("edit-tech-button")) {
                handleEditTechnology(target.dataset.id, target.dataset.name);
            } else if (target.classList.contains("delete-tech-button")) {
                handleDeleteTechnology(target.dataset.id, target.dataset.name);
            } else if (target.classList.contains("delete-function-button")) {
                handleDeleteFunction(target.dataset.techId, target.dataset.funcName);
            }
        });


        // --- Module 1: (REMOVED) ---


        // --- Module 2: Idea Generator Logic ---
        // NEW: Add filtering logic for Team Functions based on selected Tech
        technologySelect.addEventListener("change", () => {
            const selectedTechName = technologySelect.value;
            
            // Find the selected technology object from the fetched data
            const selectedTech = fetchedTechnologies.find(t => t.name === selectedTechName);

            let functions = [];
            if (selectedTech && selectedTech.functions) {
                functions = selectedTech.functions;
            }
            
            // Re-populate the category select with the functions
            const placeholder = functions.length > 0 ? "-- Select a function --" : "-- No functions defined --";
            populateSelect(categorySelect, functions, placeholder, functions.length === 0); // Enable/disable
            
            // Check button state
            generateAiIdeasButton.disabled = true; // Always disable on tech change, wait for func selection
        });

        categorySelect.addEventListener("change", () => {
             // Check button state
            generateAiIdeasButton.disabled = (technologySelect.value === "" || categorySelect.value === "");
        });

        generateAiIdeasButton.addEventListener("click", () => {
            const selectedTech = technologySelect.value;
            const selectedFunction = categorySelect.value;
            
            if (!selectedTech || !selectedFunction) {
                alert("Please select both a technology and a team function.");
                return;
            }

            const prompt = `
                I am a Server Administrator on the core infrastructure team.
                My goal is to find new operational tasks for my backlog.
                
                Please generate 5-7 distinct task ideas related to the following criteria:
                -   Technology: "${selectedTech}"
                -   My Team's Function: "${selectedFunction}"

                For each idea:
                1.  Start with a clear **Task:** (e.g., "Task: Audit stale GPOs...").
                2.  Follow it with the **Pain Point:** this task solves (e.g., "Pain Point: Reduces logon time...").
                3.  Keep the entire idea (Task + Pain Point) to 2-3 sentences.
                
                IMPORTANT: My team does NOT handle enterprise security, backups, or end-user device management. Please exclude ideas related to those specific areas and focus only on my team's function as it relates to the technology.

                Do not number the list. Separate each idea with a blank line.
            `;
            
            callGeminiAPI(prompt.trim());
        });

        clearAiIdeasButton.addEventListener("click", () => {
            generatedAiIdeasHtml.innerHTML = "";
            generatedAiIdeasOutput.style.display = "none";
            clearAiIdeasButton.style.display = "none";
            technologySelect.selectedIndex = 0; // Reset dropdowns
            
            // Reset and disable the category select
            populateSelect(categorySelect, [], "-- Select a technology first --", true);
            
            generateAiIdeasButton.disabled = true; // Disable button
        });

        // Event delegation for individual copy buttons
        generatedAiIdeasHtml.addEventListener("click", (e) => {
            const target = e.target.closest(".individual-copy-button");
            if (!target) return;

            // Find the text content of the idea
            const ideaContent = target.closest(".generated-idea-item").querySelector(".idea-content").innerText;
            
            navigator.clipboard.writeText(ideaContent).then(() => {
                const originalText = target.querySelector("span").textContent;
                target.querySelector("span").textContent = "Copied!";
                setTimeout(() => {
                    target.querySelector("span").textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error("Failed to copy text: ", err);
                alert("Failed to copy text. See console for details.");
            });
        });


        // --- Module 3: Story Converter Logic ---
        backstoryInput.addEventListener("input", () => {
            convertStoryButton.disabled = backstoryInput.value.trim() === "";
        });

        convertStoryButton.addEventListener("click", () => {
            userStoryOutput.style.display = "block";
            updateStoryPreview(); // Initial preview update
        });

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
