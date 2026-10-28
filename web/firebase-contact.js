import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { addDoc, collection, getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { siteConfig } from "./site-config.js";

const form = document.querySelector("#contact-form");
const status = document.querySelector("#contact-form-status");
const submitButton = form?.querySelector('button[type="submit"]');

function setStatus(message, state) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-error", "is-success", "is-pending");
    if (state) status.classList.add(state);
}

async function notifyOwner(lead) {
    const accessKey = String(siteConfig.web3formsAccessKey || "").trim();
    if (!accessKey) return { skipped: true };

    const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify({
            access_key: accessKey,
            subject: `New SAZ Labs lead: ${lead.service}`,
            from_name: "SAZ Labs website",
            name: lead.name,
            email: lead.email,
            service: lead.service,
            message: `Project type: ${lead.service}\n\n${lead.message}`
        })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
        const message = payload.message || payload.body?.message || "Email notification failed";
        throw new Error(message);
    }
    return payload;
}

if (form && !isFirebaseConfigured()) {
    submitButton.disabled = true;
    setStatus("Contact form setup is in progress. Please email contact@saz-labs.com.", "is-error");
}

if (form && isFirebaseConfigured()) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const data = new FormData(form);
        if (String(data.get("website") || "").trim()) {
            form.reset();
            setStatus("Thank you. Your request has been received.", "is-success");
            return;
        }

        const lastSubmission = Number(localStorage.getItem("sazLabsLastContactSubmission") || 0);
        if (Date.now() - lastSubmission < 60_000) {
            setStatus("Please wait a minute before sending another request.", "is-error");
            return;
        }

        const lead = {
            name: String(data.get("name") || "").trim(),
            email: String(data.get("email") || "").trim().toLowerCase(),
            service: String(data.get("service") || ""),
            message: String(data.get("message") || "").trim()
        };

        submitButton.disabled = true;
        setStatus("Sending...", "is-pending");

        try {
            await addDoc(collection(db, "contactRequests"), {
                ...lead,
                status: "new",
                source: "website",
                createdAt: serverTimestamp()
            });
            localStorage.setItem("sazLabsLastContactSubmission", String(Date.now()));
        } catch (error) {
            console.error("Contact submission failed:", error);
            setStatus("We could not send your request. Please try again or email contact@saz-labs.com.", "is-error");
            submitButton.disabled = false;
            return;
        }

        try {
            await notifyOwner(lead);
            form.reset();
            setStatus("Thank you. Your request has been received.", "is-success");
        } catch (error) {
            console.error("Lead email failed:", error);
            form.reset();
            setStatus("Your request is saved. The notification email did not send, so please also write to contact@saz-labs.com if you do not hear back soon.", "is-error");
        } finally {
            submitButton.disabled = false;
        }
    });
}
