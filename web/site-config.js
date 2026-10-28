/**
 * SAZ Labs public site settings.
 *
 * This is the only file to edit for contact details, lead email, analytics,
 * the founder section, and case studies. Leave a string empty ("") and the
 * matching link or section stays hidden. Do not put Firebase service-account
 * keys, SMTP passwords, or other server secrets in this file.
 *
 * web3formsAccessKey and analytics tokens are public site keys. They are
 * visible to anyone who loads the website. That is expected for these
 * services. See README.md for the one-time setup.
 */
export const siteConfig = {
    email: "contact@saz-labs.com",

    // Shown on phone links. The tel: href is derived from these digits.
    phone: "+20 114 449 9976",

    // Digits only, country code, no plus. Builds https://wa.me/201144499976.
    whatsapp: "201144499976",
    // Optional message added as ?text=. Leave "" for the bare wa.me link.
    whatsappPrefill: "",

    // PLACEHOLDER: paste the Calendly https URL when it is ready.
    // Leave "" to hide every "Book a call" link.
    bookingUrl: "",

    social: {
        linkedin: "https://www.linkedin.com/in/sobhy-youssef-857992116",
        github: "",
        x: "",
        youtube: ""
    },

    // From https://web3forms.com after you verify the inbox that should
    // receive leads. Leave "" to keep saving enquiries in Firestore only.
    web3formsAccessKey: "",

    // provider: "" | "cloudflare" | "plausible"
    // token: Cloudflare beacon token, or the Plausible site domain (saz-labs.com)
    analytics: {
        provider: "",
        token: ""
    },

    // The founder block is shown only when both name and bio are filled in.
    founder: {
        name: "",
        role: "",
        bio: "",
        photo: "",
        linkedin: ""
    },

    // Featured Work is shown only when this array has real entries.
    // Remove the example and add one object per case study you can publish.
    caseStudies: [
        // {
        //     title: "Name you have permission to publish",
        //     summary: "What you did and what changed for the client.",
        //     tags: "Kotlin, Play Store",
        //     url: "https://example.com"
        // }
    ]
};
