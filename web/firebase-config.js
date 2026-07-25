// Firebase Web App configuration is public by design, but use only values copied
// from Firebase Console. Never put service-account keys or other secrets here.
export const firebaseConfig = {
    apiKey: "AIzaSyBz8-piAO7-aJNNyTcorVeSR_g66uLwceo",
    authDomain: "saz-labs.firebaseapp.com",
    projectId: "saz-labs",
    storageBucket: "saz-labs.firebasestorage.app",
    messagingSenderId: "579640804045",
    appId: "1:579640804045:web:0f3d320f5cf4940d0f9f84"
};

export function isFirebaseConfigured() {
    return !Object.values(firebaseConfig).some((value) => value.startsWith("REPLACE_WITH_"));
}
