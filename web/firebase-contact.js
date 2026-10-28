import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { addDoc, collection, getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { siteConfig } from "./site-config.js";

const form = document.querySelector("#contact-form");
const status = document.querySelector("#contact-form-status");
const submitButton = form?.querySelector('button[type="submit"]');
const submitLabel = form?.querySelector(".cf-submit-label");
const messageInput = form?.querySelector("#cf-message");
const messageCount = form?.querySelector("#cf-count");

const FIRESTORE_SERVICE = {
    "Mobile app": "Mobile App",
    "Web app": "Web App",
    AI: "Other",
    Other: "Other"
};

function setStatus(message, state) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-error", "is-success", "is-pending");
    if (state) status.classList.add(state);
}

function setFieldError(id, message) {
    const error = document.getElementById(id);
    const control = form.querySelector(`[aria-describedby~="${id}"]`) || form.querySelector(`#${id.replace("-error", "")}`);
    const field = error?.closest(".cf-field, .cf-choice");
    if (!error) return;
    if (message) {
        error.hidden = false;
        error.textContent = message;
        field?.classList.add("is-invalid");
        control?.setAttribute("aria-invalid", "true");
    } else {
        error.hidden = true;
        error.textContent = "";
        field?.classList.remove("is-invalid");
        control?.removeAttribute("aria-invalid");
    }
}

function syncFloat(field) {
    const control = field.querySelector("input, textarea");
    if (!control) return;
    const floated = document.activeElement === control || control.value.trim() !== "";
    field.classList.toggle("is-floated", floated);
}

function updateCount() {
    if (!messageInput || !messageCount) return;
    const length = messageInput.value.length;
    messageCount.textContent = String(length);
    messageCount.parentElement?.classList.toggle("is-near", length > 3600);
}

function composeMessage(details) {
    const projectType = details.projectType;
    const lines = [`Project type: ${projectType}`];
    if (details.company) lines.push(`Company: ${details.company}`);
    if (details.whatsapp) lines.push(`WhatsApp: ${details.whatsapp}`);
    if (details.budget) lines.push(`Budget: ${details.budget}`);
    lines.push("", details.note);
    return lines.join("\n").slice(0, 5000);
}

function readDetails() {
    const data = new FormData(form);
    const projectType = String(data.get("project_type") || "");
    return {
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim().toLowerCase(),
        company: String(data.get("company") || "").trim(),
        whatsapp: String(data.get("whatsapp") || "").trim(),
        projectType,
        service: FIRESTORE_SERVICE[projectType] || "",
        budget: String(data.get("budget") || ""),
        note: String(data.get("message") || "").trim(),
        honeypot: String(data.get("saz_hp") || "").trim()
    };
}

function validate(details) {
    let firstInvalid = null;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email);
    const checks = [
        ["cf-name-error", details.name.length >= 2 && details.name.length <= 100, "Enter your name (at least 2 characters).", "#cf-name"],
        ["cf-email-error", details.email.length >= 5 && details.email.length <= 254 && emailOk, "Enter a valid email address.", "#cf-email"],
        ["cf-company-error", details.company.length === 0 || (details.company.length >= 2 && details.company.length <= 120), "Company name should be at least 2 characters.", "#cf-company"],
        ["cf-whatsapp-error", details.whatsapp.length === 0 || (details.whatsapp.replace(/\D/g, "").length >= 8 && details.whatsapp.length <= 24), "Enter a WhatsApp number with country code.", "#cf-whatsapp"],
        ["cf-service-error", Boolean(details.service), "Choose a project type.", 'input[name="project_type"]'],
        ["cf-message-error", details.note.length >= 10 && details.note.length <= 4000, "Tell us a little more (at least 10 characters).", "#cf-message"]
    ];

    checks.forEach(([id, ok, message, selector]) => {
        setFieldError(id, ok ? "" : message);
        if (!ok && !firstInvalid) firstInvalid = form.querySelector(selector);
    });

    if (firstInvalid) {
        form.classList.add("is-error");
        form.classList.remove("is-success");
        setStatus("Please fix the highlighted fields.", "is-error");
        firstInvalid.focus();
        return false;
    }

    form.classList.remove("is-error");
    setStatus("", "");
    return true;
}

async function notifyOwner(lead) {
    const accessKey = String(siteConfig.web3formsAccessKey || "").trim();
    if (!accessKey) return { skipped: true };

    const payload = {
        access_key: accessKey,
        subject: `New SAZ Labs lead: ${lead.projectType}`,
        from_name: "SAZ Labs website",
        name: lead.name,
        email: lead.email,
        replyto: lead.email,
        service: lead.service,
        project_type: lead.projectType,
        message: lead.message
    };
    if (lead.company) payload.company = lead.company;
    if (lead.whatsapp) payload.whatsapp = lead.whatsapp;
    if (lead.budget) payload.budget = lead.budget;

    const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false) {
        const message = body.message || body.body?.message || "Email notification failed";
        throw new Error(message);
    }
    return body;
}

function setSending(sending) {
    if (!form || !submitButton) return;
    form.classList.toggle("is-sending", sending);
    submitButton.disabled = sending;
    form.setAttribute("aria-busy", sending ? "true" : "false");
    if (submitLabel) submitLabel.textContent = sending ? "Sending" : "Send message";
}

if (form) {
    form.querySelectorAll(".cf-field").forEach((field) => {
        const control = field.querySelector("input, textarea");
        const sync = () => syncFloat(field);
        control?.addEventListener("focus", sync);
        control?.addEventListener("blur", sync);
        control?.addEventListener("input", sync);
        sync();
    });

    messageInput?.addEventListener("input", updateCount);
    updateCount();

    form.querySelectorAll('input[name="budget"]').forEach((input) => {
        input.addEventListener("change", () => {
            form.querySelectorAll('input[name="budget"]').forEach((other) => {
                other.dataset.wasChecked = other.checked ? "true" : "false";
            });
        });
        input.addEventListener("click", () => {
            if (input.dataset.wasChecked === "true") {
                input.checked = false;
                input.dataset.wasChecked = "false";
            }
        });
    });
}

if (form && !isFirebaseConfigured()) {
    submitButton.disabled = true;
    form.classList.add("is-error");
    setStatus("Contact form setup is in progress. Please email contact@saz-labs.com.", "is-error");
}

if (form && isFirebaseConfigured()) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const details = readDetails();
        if (details.honeypot) {
            form.reset();
            updateCount();
            form.classList.add("is-success");
            form.classList.remove("is-error", "is-sending");
            setStatus("Thanks — we'll reply within 24h", "is-success");
            return;
        }
        if (!validate(details)) return;

        const lastSubmission = Number(localStorage.getItem("sazLabsLastContactSubmission") || 0);
        if (Date.now() - lastSubmission < 60_000) {
            form.classList.add("is-error");
            setStatus("Please wait a minute before sending another request.", "is-error");
            return;
        }

        const lead = {
            name: details.name,
            email: details.email,
            service: details.service,
            projectType: details.projectType,
            company: details.company,
            whatsapp: details.whatsapp,
            budget: details.budget,
            message: composeMessage(details)
        };

        setSending(true);
        setStatus("Sending...", "is-pending");

        const [saved, mailed] = await Promise.allSettled([
            addDoc(collection(db, "contactRequests"), {
                name: lead.name,
                email: lead.email,
                service: lead.service,
                message: lead.message,
                status: "new",
                source: "website",
                createdAt: serverTimestamp()
            }),
            notifyOwner(lead)
        ]);

        const savedOk = saved.status === "fulfilled";
        const emailSkipped = mailed.status === "fulfilled" && mailed.value?.skipped === true;
        const emailOk = mailed.status === "fulfilled" && !emailSkipped;

        if (savedOk || emailOk) {
            localStorage.setItem("sazLabsLastContactSubmission", String(Date.now()));
            form.reset();
            updateCount();
            form.querySelectorAll(".cf-field").forEach(syncFloat);
            form.querySelectorAll('input[name="budget"]').forEach((input) => {
                input.dataset.wasChecked = "false";
            });
        }

        if (!savedOk) console.error("Contact save failed:", saved.reason);
        if (!emailOk && !emailSkipped) console.error("Lead email failed:", mailed.reason);

        setSending(false);

        if (emailOk || (emailSkipped && savedOk)) {
            form.classList.add("is-success");
            form.classList.remove("is-error");
            setStatus("Thanks — we'll reply within 24h", "is-success");
        } else if (savedOk) {
            form.classList.add("is-error");
            form.classList.remove("is-success");
            setStatus("Your request is saved. The notification email did not send, so please also write to contact@saz-labs.com if you do not hear back soon.", "is-error");
        } else {
            form.classList.add("is-error");
            form.classList.remove("is-success");
            setStatus("We could not send your request. Please try again or email contact@saz-labs.com.", "is-error");
        }
    });
}
