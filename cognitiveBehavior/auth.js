// auth.js
import { appState } from './config.js';
import { GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { displayImportedGuide } from './ui.js'; // Circular dependency handled via function call

const G_SCOPES = 'https://www.googleapis.com/auth/drive.file';

// --- Firebase Authentication ---

export async function handleFirebaseLogin() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/cloud-platform');
    try {
        await signInWithPopup(appState.auth, provider);
        // UI updates handled by onAuthStateChanged in main.js
    } catch (error) {
        console.error("Google Sign-In Popup failed:", error);
        let userMessage = `Login failed: ${error.code}.`;
        if (error.code === 'auth/popup-closed-by-user') {
            userMessage += ' You closed the login window before completing sign-in.';
        } else {
            userMessage += ' This can be caused by pop-up blockers. Please check your browser settings.';
        }
        // We might need a way to show this error in UI, but for now log it
        alert(userMessage); 
    }
}

export function handleFirebaseLogout() {
    // Revoke Drive token if exists
    if (appState.oauthToken && appState.oauthToken.access_token) {
        google.accounts.oauth2.revoke(appState.oauthToken.access_token, () => {
            console.log("Google Drive token revoked during logout.");
        });
    }
    if (gapi?.client) {
       gapi.client.setToken(null);
    }
    
    signOut(appState.auth).then(() => {
        appState.oauthToken = null;
        updateSigninStatus(false);
        // Clear session but keep keys if possible, or clear all based on preference
        // localStorage.clear(); 
        sessionStorage.clear();
        location.reload();
    }).catch(error => {
        console.error("Sign out failed:", error);
    });
}

// --- Google Drive API Integration ---

export function initializeGoogleApiClients() {
    if (!appState.googleClientId) {
        console.warn("Google Client ID is not provided. Cloud features disabled.");
        return;
    }
    
    // Check for global google objects loaded via script tags in index.html
    const checkGis = () => {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            initGisClient();
        } else {
            setTimeout(checkGis, 100);
        }
    };

    const checkGapi = () => {
        if (typeof gapi !== 'undefined' && gapi.load) {
            gapi.load('client:picker', initGapiClient);
        } else {
            setTimeout(checkGapi, 100);
        }
    };

    checkGis();
    checkGapi();
}

function initGisClient() {
    try {
        appState.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: appState.googleClientId,
            scope: G_SCOPES,
            callback: (tokenResponse) => {
                appState.oauthToken = tokenResponse; 
                if (appState.gapiInited && appState.oauthToken && appState.oauthToken.access_token) {
                    gapi.client.setToken(appState.oauthToken);
                    updateSigninStatus(true);
                    // Resume pending save if one exists
                    if (appState.pendingDriveSave) {
                        saveContentToDrive(
                            appState.pendingDriveSave.content, 
                            appState.pendingDriveSave.fileName, 
                            appState.pendingDriveSave.statusElement
                        );
                        appState.pendingDriveSave = null;
                    }
                }
            },
        });
        appState.gisInited = true;
    } catch (error) {
        console.error("GIS Init Error:", error);
    }
}

async function initGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        appState.gapiInited = true; 
        // Check if we already have a token (unlikely on fresh load, but good practice)
        updateSigninStatus(!!(appState.oauthToken && appState.oauthToken.access_token));
    } catch(error) {
        console.error("GAPI Init Error:", error);
    }
}

export async function handleDriveAuthClick() {
    if (appState.oauthToken && appState.oauthToken.access_token) {
        google.accounts.oauth2.revoke(appState.oauthToken.access_token, () => {
            if (gapi?.client) gapi.client.setToken(null);
            appState.oauthToken = null;
            updateSigninStatus(false);
        });
    } else {
        if (appState.gisInited && appState.tokenClient) {
            appState.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            console.error("Google services not ready.");
            alert("Google services are initializing. Please wait.");
        }
    }
}

export function updateSigninStatus(isSignedIn) {
    const authButton = document.getElementById('auth-button');
    const loadBtn = document.getElementById('load-from-drive-btn');
    const statusEl = document.getElementById('drive-status');
    
    if (!authButton) return; // UI might not be ready

    if (isSignedIn) {
        authButton.textContent = 'Disconnect';
        loadBtn.classList.remove('hidden');
        statusEl.textContent = 'Connected to Google Drive.';
        getDriveFolderId(); // Pre-fetch folder
    } else {
        authButton.textContent = 'Connect';
        loadBtn.classList.add('hidden');
        statusEl.textContent = 'Connect to save/load articles.';
        appState.driveFolderId = null;
    }
}

export async function getDriveFolderId() {
    if (appState.driveFolderId) return appState.driveFolderId;
    
    try {
        const response = await gapi.client.drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='Everything Psychology' and trashed=false",
            fields: 'files(id, name)',
        });
        
        if (response.result.files && response.result.files.length > 0) {
            appState.driveFolderId = response.result.files[0].id;
        } else {
            const folderResponse = await gapi.client.drive.files.create({
                resource: { 'name': 'Everything Psychology', 'mimeType': 'application/vnd.google-apps.folder' },
                fields: 'id'
            });
            appState.driveFolderId = folderResponse.result.id;
        }
        return appState.driveFolderId;
    } catch (error) {
        console.error("Drive Folder Error:", error);
        return null;
    }
}

export async function saveContentToDrive(content, fileName, statusElement) {
    if (!appState.gapiInited || !appState.gisInited || !appState.oauthToken) {
        appState.pendingDriveSave = { content, fileName, statusElement };
        if (statusElement) statusElement.textContent = 'Auth required. Connecting...';
        handleDriveAuthClick();
        return;
    }

    if(statusElement) statusElement.textContent = 'Saving to Google Drive...';
    
    const folderId = await getDriveFolderId();
    if (!folderId) {
        if(statusElement) statusElement.textContent = 'Error: Could not access app folder.';
        return;
    }

    try {
        const safeFileName = fileName.replace(/'/g, "\\'").replace(/"/g, '\\"');
        // Check if file exists to update it
        const searchResponse = await gapi.client.drive.files.list({
            q: `name='${safeFileName}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
            spaces: 'drive'
        });

        const fileExists = searchResponse.result.files && searchResponse.result.files.length > 0;
        const fileId = fileExists ? searchResponse.result.files[0].id : null;

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const contentType = 'text/markdown';

        const metadata = fileExists ? {} : { name: fileName, parents: [folderId] };

        const multipartRequestBody = delimiter +
            `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: ${contentType}\r\n\r\n` +
            content +
            close_delim;

        const requestPath = `/upload/drive/v3/files${fileExists ? '/' + fileId : ''}`;
        const requestMethod = fileExists ? 'PATCH' : 'POST';

        await gapi.client.request({
            path: requestPath,
            method: requestMethod,
            params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
            body: multipartRequestBody
        });

        if(statusElement) {
            statusElement.textContent = `File '${fileName}' ${fileExists ? 'updated' : 'saved'}!`;
            setTimeout(() => statusElement.textContent = '', 4000);
        }
    } catch (error) {
        console.error('Save to Drive Error:', error);
        if(statusElement) statusElement.textContent = 'Error saving to Drive.';
    }
}

export function createPicker(mode) {
    if (!appState.gapiInited || !appState.gisInited || !appState.oauthToken) {
        handleDriveAuthClick();
        return;
    }

    try {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("text/markdown,text/plain,.md");
        if (appState.driveFolderId) {
            view.setParent(appState.driveFolderId);
        }

        const picker = new google.picker.PickerBuilder()
            .setOAuthToken(appState.oauthToken.access_token)
            .setDeveloperKey(appState.geminiApiKey)
            .addView(view)
            .setCallback(pickerCallbackOpen)
            .build();
        picker.setVisible(true);

    } catch (error) {
        console.error("Picker Error:", error);
    }
}

async function pickerCallbackOpen(data) {
    if (data.action === google.picker.Action.PICKED) {
        const fileId = data.docs[0].id;
        const fileName = data.docs[0].name;
        
        try {
            const response = await gapi.client.drive.files.get({ fileId, alt: 'media' });
            displayImportedGuide(fileName, response.body); // Calls UI function
        } catch (error) {
            console.error("Error loading picked file:", error);
        }
    }
}
