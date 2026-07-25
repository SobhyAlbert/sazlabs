import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { addDoc, collection, getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const form = document.querySelector("#contact-form");
const status = document.querySelector("#contact-form-status");
const submitButton = form?.querySelector('button[type="submit"]');

function setStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? "#ff8a8a" : "";
}

if (form && !isFirebaseConfigured()) {
    submitButton.disabled = true;
    setStatus("Contact form setup is in progress. Please email contact@saz-labs.com.", true);
}

if (form && isFirebaseConfigured()) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const data = new FormData(form);
        const honeypot = String(data.get("website") || "").trim();
        if (honeypot) {
            form.reset();
            setStatus("Thank you. Your request has been received.");
            return;
        }

        const lastSubmission = Number(localStorage.getItem("sazLabsLastContactSubmission") || 0);
        if (Date.now() - lastSubmission < 60_000) {
            setStatus("Please wait a minute before sending another request.", true);
            return;
        }

        submitButton.disabled = true;
        setStatus("Sending...");

        try {
            await addDoc(collection(db, "contactRequests"), {
                name: String(data.get("name") || "").trim(),
                email: String(data.get("email") || "").trim().toLowerCase(),
                service: String(data.get("service") || ""),
                message: String(data.get("message") || "").trim(),
                status: "new",
                source: "website",
                createdAt: serverTimestamp()
            });
            localStorage.setItem("sazLabsLastContactSubmission", String(Date.now()));
            form.reset();
            setStatus("Thank you. Your request has been received.");
        } catch (error) {
            console.error("Contact submission failed:", error);
            setStatus("We could not send your request. Please try again or email us.", true);
        } finally {
            submitButton.disabled = false;
        }
    });
}
