import { siteConfig } from "./site-config.js";

function onReady(callback) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
    } else {
        callback();
    }
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function isSafeToken(value) {
    return /^[A-Za-z0-9._-]{1,200}$/.test(value);
}

function isSafePhoto(value) {
    if (isHttpUrl(value)) return true;
    return /^assets\/[A-Za-z0-9._/-]+$/.test(value);
}

function reveal(selector, assign) {
    document.querySelectorAll(selector).forEach((element) => {
        if (assign) assign(element);
        element.hidden = false;
    });
}

function applyContactOptions() {
    const phone = String(siteConfig.phone || "").trim();
    if (phone) {
        const tel = phone.replace(/[^\d+]/g, "");
        reveal("[data-contact='phone']", (element) => {
            element.href = `tel:${tel}`;
            const label = element.querySelector("[data-phone-text]");
            if (label) label.textContent = phone;
        });
    }

    const whatsapp = String(siteConfig.whatsapp || "").replace(/\D/g, "");
    if (whatsapp) {
        const text = encodeURIComponent(siteConfig.whatsappPrefill || "");
        const href = `https://wa.me/${whatsapp}?text=${text}`;
        reveal("[data-contact='whatsapp']", (element) => {
            element.href = href;
        });
    }

    const bookingUrl = String(siteConfig.bookingUrl || "").trim();
    if (isHttpUrl(bookingUrl)) {
        reveal("[data-contact='booking']", (element) => {
            element.href = bookingUrl;
        });
    }

    let anySocial = false;
    Object.entries(siteConfig.social || {}).forEach(([name, value]) => {
        const href = String(value || "").trim();
        if (!isHttpUrl(href)) return;
        anySocial = true;
        reveal(`[data-social='${name}']`, (element) => {
            element.href = href;
        });
    });
    if (anySocial) {
        document.querySelectorAll("[data-social-list]").forEach((list) => {
            list.hidden = false;
        });
    }
}

function applyFounder() {
    const section = document.querySelector("#founder");
    if (!section) return;
    const founder = siteConfig.founder || {};
    const name = String(founder.name || "").trim();
    const bio = String(founder.bio || "").trim();
    if (!name || !bio) return;

    section.querySelector("[data-founder='name']").textContent = name;
    section.querySelector("[data-founder='bio']").textContent = bio;

    const role = String(founder.role || "").trim();
    const roleElement = section.querySelector("[data-founder='role']");
    if (role && roleElement) {
        roleElement.textContent = role;
        roleElement.hidden = false;
    }

    const photo = String(founder.photo || "").trim();
    const photoElement = section.querySelector("[data-founder='photo']");
    if (photo && photoElement && isSafePhoto(photo)) {
        photoElement.src = photo;
        photoElement.alt = `Portrait of ${name}`;
        photoElement.hidden = false;
    }

    const linkedin = String(founder.linkedin || "").trim();
    const linkedinElement = section.querySelector("[data-founder='linkedin']");
    if (linkedinElement && isHttpUrl(linkedin)) {
        linkedinElement.href = linkedin;
        linkedinElement.hidden = false;
    }

    section.hidden = false;
}

function applyCaseStudies() {
    const studies = (Array.isArray(siteConfig.caseStudies) ? siteConfig.caseStudies : [])
        .filter((study) => study && String(study.title || "").trim());
    const section = document.querySelector("#portfolio");
    const grid = document.querySelector("#portfolio-grid");
    if (!section || !grid || studies.length === 0) return;

    studies.forEach((study) => {
        const card = document.createElement("article");
        card.className = "portfolio-card";

        const info = document.createElement("div");
        info.className = "portfolio-info";

        const title = document.createElement("h3");
        title.textContent = String(study.title).trim();
        info.append(title);

        const tags = String(study.tags || "").trim();
        if (tags) {
            const tagsElement = document.createElement("p");
            tagsElement.className = "portfolio-tags";
            tagsElement.textContent = tags;
            info.append(tagsElement);
        }

        const summary = String(study.summary || "").trim();
        if (summary) {
            const summaryElement = document.createElement("p");
            summaryElement.className = "portfolio-summary";
            summaryElement.textContent = summary;
            info.append(summaryElement);
        }

        const url = String(study.url || "").trim();
        if (isHttpUrl(url)) {
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.append(info);
            card.append(link);
        } else {
            card.append(info);
        }

        grid.append(card);
    });

    section.hidden = false;
    document.querySelectorAll("[data-nav='portfolio']").forEach((item) => {
        item.hidden = false;
    });
}

function applyJsonLd() {
    const node = document.querySelector("#org-jsonld");
    if (!node) return;
    let data;
    try {
        data = JSON.parse(node.textContent);
    } catch {
        return;
    }
    const sameAs = Object.values(siteConfig.social || {})
        .map((value) => String(value || "").trim())
        .filter(isHttpUrl);
    if (sameAs.length) data.sameAs = sameAs;
    const phone = String(siteConfig.phone || "").trim();
    if (phone) data.telephone = phone;
    node.textContent = JSON.stringify(data);
}

function mountAnalytics() {
    const provider = String(siteConfig.analytics?.provider || "").trim().toLowerCase();
    const token = String(siteConfig.analytics?.token || "").trim();
    if (!provider || !isSafeToken(token)) return;

    if (provider === "cloudflare") {
        const script = document.createElement("script");
        script.defer = true;
        script.src = "https://static.cloudflareinsights.com/beacon.min.js";
        script.dataset.cfBeacon = JSON.stringify({ token });
        document.body.append(script);
        return;
    }

    if (provider === "plausible") {
        const script = document.createElement("script");
        script.defer = true;
        script.dataset.domain = token;
        script.src = "https://plausible.io/js/script.js";
        document.body.append(script);
    }
}

onReady(() => {
    applyContactOptions();
    applyFounder();
    applyCaseStudies();
    applyJsonLd();
    mountAnalytics();
});
