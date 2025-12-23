export const configStore = {
    googleClientId: null,
    firebaseConfig: null
};

export function setApiKeys({ googleClientId, firebase }) {
    if (!googleClientId || !firebase) {
        throw new Error("Missing API keys.");
    }
    configStore.googleClientId = googleClientId;
    configStore.firebaseConfig = firebase;
}
