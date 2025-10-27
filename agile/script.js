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
    // Data is now stored as arrays of objects { id: "...", name: "..." }
    let fetchedTechnologies = [];
    let fetchedFunctions = [];

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
    const newItemCollectionSelect = document.getElementById("new-item-collection");
    const addItemButton = document.getElementById("add-item-button");
    const technologiesList = document.getElementById("technologies-list");
    const functionsList = document.getElementById("functions-list");

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
    const categorySelect = document.getElementById("category-select"); // This ID is re-used for "Team Function"
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
        // systems: This is now populated from Firestore
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
                fetchedFunctions = [];
                populateSelect(systemSelect, [], "-- Login to load systems --");
                populateSelect(technologySelect, [], "-- Login to load systems --");
                populateSelect(categorySelect, [], "-- Login to load functions --");
                populateCrudList(technologiesList, "technologies", []);
                populateCrudList(functionsList, "teamFunctions", []);
            }
        });
    }

    /**
     * Fetches and repopulates all data from Firestore.
     */
    async function refreshAllData() {
        await fetchTechnologiesFromFirestore();
        await fetchFunctionsFromFirestore();
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
            populateSelect(systemSelect, fetchedTechnologies, "-- Select a system --");
            populateSelect(technologySelect, fetchedTechnologies, "-- Select a technology --");
            // Populate CRUD list
            populateCrudList(technologiesList, "technologies", fetchedTechnologies);
            console.log("Fetched technologies:", fetchedTechnologies);

        } catch (e) {
            console.error("Error fetching technologies from Firestore: ", e);
            systemSelect.innerHTML = '<option value="" disabled selected>-- Error loading systems --</option>';
            technologySelect.innerHTML = '<option value="" disabled selected>-- Error loading systems --</option>';
            // Do not alert, console error is sufficient
        }
    }

    /**
     * Fetches the list of team functions from the Firestore 'teamFunctions' collection.
     */
    async function fetchFunctionsFromFirestore() {
        if (!db) {
            console.error("Firestore is not initialized.");
            return;
        }
        try {
            const querySnapshot = await db.collection("teamFunctions").orderBy("name").get();
            fetchedFunctions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Populate app dropdown
            populateSelect(categorySelect, fetchedFunctions, "-- Select a function --");
            // Populate CRUD list
            populateCrudList(functionsList, "teamFunctions", fetchedFunctions);
            console.log("Fetched functions:", fetchedFunctions);

        } catch (e) {
            console.error("Error fetching functions from Firestore: ", e);
            categorySelect.innerHTML = '<option value="" disabled selected>-- Error loading functions --</option>';
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
     * Populates a <select> element with options from an array of objects.
     * @param {HTMLSelectElement} selectElement - The <select> element to populate.
     * @param {object[]} options - An array of objects, e.g., { id: "...", name: "..." }.
     * @param {string} placeholder - The placeholder text (e.g., "-- Select an option --").
     */
    function populateSelect(selectElement, options, placeholder) {
        selectElement.innerHTML = `<option value="" disabled selected>${placeholder}</option>`; // Clear old options
        options.forEach(option => {
            const opt = document.createElement("option");
            // We set the value to the name, as this is what the AI prompt expects
            opt.value = option.name;
            opt.textContent = option.name;
            selectElement.appendChild(opt);
        });
    }

    /**
     * Populates a <ul> in the CRUD modal with list items and buttons.
     * @param {HTMLUListElement} listElement - The <ul> element to populate.
     * @param {string} collectionName - The name of the Firestore collection (e.g., "technologies").
     * @param {object[]} data - The array of data objects { id: "...", name: "..." }.
     */
    function populateCrudList(listElement, collectionName, data) {
        listElement.innerHTML = ""; // Clear old list
        if (data.length === img src="https://firebasestorage.googleapis.com/v0/b/sps-sub-411319.appspot.com/o/images%2F001.png?alt=media&token=c1a3574c-4a34-4b53-a5ba-14532b26090c" alt="Project deployed.">0) {
            listElement.innerHTML = "<li>No items in this collection.</li>";
            return;
        }
        data.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${item.name}</span>
                <div class="item-controls">
                    <button class="edit-button" data-id="${item.id}" data-collection="${collectionName}" data-name="${item.name}">Edit</button>
                    <button class="delete-button" data-id="${item.id}" data-collection="${collectionName}" data-name="${item.name}">Delete</button>
                </div>
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
        const soThat = soThat.value || "[Benefit]";
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
     * Adds a new item to the selected Firestore collection.
     */
    async function handleAddItem() {
        const name = newItemNameInput.value.trim();
        const collection = newItemCollectionSelect.value;
        if (!name) {
            alert("Please enter an item name.");
            return;
        }
        if (!db) {
            alert("Firestore is not initialized.");
            return;
        }

        try {
            await db.collection(collection).add({ name: name });
            console.log(`Added "${name}" to "${collection}"`);
            newItemNameInput.value = ""; // Clear input
            
            // Refresh the specific list that was changed
            if (collection === "technologies") {
                await fetchTechnologiesFromFirestore();
            } else {
                await fetchFunctionsFromFirestore();
            }
        } catch (e) {
            console.error("Error adding item: ", e);
            alert(`Could not add item. Error: ${e.message}`);
        }
    }

    /**
     * Updates an existing item's name in Firestore.
     * @param {string} collection - The collection name ("technologies" or "teamFunctions").
     * @param {string} id - The document ID.
     * @param {string} oldName - The current name (for the prompt).
     */
    async function handleEditItem(collection, id, oldName) {
        const newName = prompt(`Enter a new name for "${oldName}":`, oldName);
        if (!newName || newName.trim() === "" || newName === oldName) {
            return; // User cancelled or didn't change the name
        }
        if (!db) {
            alert("Firestore is not initialized.");
            return;
        }

        try {
            await db.collection(collection).doc(id).update({ name: newName.trim() });
            console.log(`Updated "${oldName}" to "${newName}"`);

            // Refresh the specific list that was changed
            if (collection === "technologies") {
                await fetchTechnologiesFromFirestore();
            } else {
                await fetchFunctionsFromFirestore();
            }
        } catch (e) {
            console.error("Error updating item: ", e);
            alert(`Could not update item. Error: ${e.message}`);
        }
    }

    /**
     * Deletes an item from Firestore.
     * @param {string} collection - The collection name.
     * @param {string} id - The document ID.
     * @param {string} name - The item name (for confirmation).
     */
    async function handleDeleteItem(collection, id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }
        if (!db) {
            alert("Firestore is not initialized.");
            return;
        }

        try {
            await db.collection(collection).doc(id).delete();
            console.log(`Deleted "${name}"`);
            
            // Refresh the specific list that was changed
            if (collection === "technologies") {
                await fetchTechnologiesFromFirestore();
            } else {
                await fetchFunctionsFromFirestore();
            }
        } catch (e) {
            console.error("Error deleting item: ", e);
            alert(`Could not delete item. Error: ${e.message}`);
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

        addItemButton.addEventListener("click", handleAddItem);

        // Event delegation for Edit/Delete buttons
        [technologiesList, functionsList].forEach(list => {
            list.addEventListener("click", (e) => {
                const target = e.target;
                const id = target.dataset.id;
                const collection = target.dataset.collection;
                const name = target.dataset.name;

                if (target.classList.contains("edit-button")) {
                    handleEditItem(collection, id, name);
                } else if (target.classList.contains("delete-button")) {
                    handleDeleteItem(collection, id, name);
                }
            });
        });


        // --- Module 1: Problem Finder Logic ---
        populateSelect(taskSelect, problemFinderData.tasks.map(t => ({id: t, name: t})), "-- Select a task --");
        populateSelect(problemSelect, problemFinderData.problems.map(p => ({id: p, name: p})), "-- Select a problem --");
        populateSelect(impactSelect, problemFinderData.impacts.map(i => ({id: i, name: i})), "-- Select an impact --");

        const finderInputs = [systemSelect, taskSelect, problemSelect, impactSelect];
        
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
        const module2Selects = [technologySelect, categorySelect];
        module2Selects.forEach(select => {
            select.addEventListener("change", () => {
                const allFilled = module2Selects.every(s => s.value !== "");
                generateAiIdeasButton.disabled = !allFilled;
            });
        });

        generateAiIdeasButton.addEventListener("click", () => {
            const selectedTech = technologySelect.value;
            const selectedFunction = categorySelect.value;
            
            if (!selectedTech || !selectedFunction) {
                alert("Please select both a technology and a team function.");
                return;
            }
            if (fetchedTechnologies.length === 0 || fetchedFunctions.length === 0) {
                alert("Data is still loading or is empty. Please wait or check Firestore.");
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
            generatedAiIdeasTextarea.value = "";
            generatedAiIdeasOutput.style.display = "none";
            clearAiIdeasButton.style.display = "none";
            technologySelect.selectedIndex = 0; // Reset dropdowns
            categorySelect.selectedIndex = 0;
            generateAiIdeasButton.disabled = true; // Disable button
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
