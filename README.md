# SAZ Labs

SAZ Labs is the software studio of Sobhy Youssef. This repository holds:

- `web/` — static site (HTML, CSS, and vanilla JavaScript), published at [https://saz-labs.com](https://saz-labs.com).
- `android-admin/` — private Android app the owner uses to read leads.
- `firebase/` — Firestore rules, indexes, and CLI config for project `saz-labs`.

GitHub Actions publishes `web/` to GitHub Pages on every push to `main` that changes `web/**` or `.github/workflows/pages.yml`. The workflow is `.github/workflows/pages.yml`. The custom domain is `web/CNAME`. No extra Pages source setting is required.

## Owner checklist

Edit `web/site-config.js`. Empty values stay hidden or inactive, so the live site does not show broken links. Deploy by committing that file to `main`.

| Value | What to paste | What visitors see when it is set |
| --- | --- | --- |
| `web3formsAccessKey` | Access key from the one-time setup below | An email for every new lead, in addition to the Firestore record |
| `phone` | Number visitors should call, for example `+1 555 010 0199` | Phone links in the contact section and footer |
| `whatsapp` | Digits only, country code, no plus, for example `15550100199` | WhatsApp link and the floating button |
| `bookingUrl` | Full `https://` scheduler URL | **Book a call** in the hero, contact section, and footer |
| `social.linkedin` | Full profile URL | LinkedIn in the contact section and footer |
| `social.github` | Full profile URL | GitHub link |
| `social.x` | Full profile URL | X link |
| `social.youtube` | Full profile URL | YouTube link |
| `analytics.provider` | `cloudflare` or `plausible` | Nothing until `analytics.token` is also set |
| `analytics.token` | Cloudflare beacon token, or the Plausible domain `saz-labs.com` | Cookieless page-view analytics. The privacy policy already describes this |
| `founder.name` and `founder.bio` | Real bio you are willing to publish. Both are required | About the founder section |
| `founder.role`, `founder.photo`, `founder.linkedin` | Optional. Photo is an `assets/...` path or `https://` URL | Role, portrait, and LinkedIn on that section |
| `caseStudies` | Objects you have permission to publish (`title`, `summary`, `tags`, `url`) | Featured Work, and the Portfolio link in the nav |

Already set:

- `email` is `contact@saz-labs.com`. The same address is written in the privacy policy and terms. Change all of them together if the inbox changes.
- `phone` is `+20 114 449 9976` (`tel:+201144499976`).
- `whatsapp` is `201144499976` (`https://wa.me/201144499976`).
- `social.linkedin` is `https://www.linkedin.com/in/sobhy-youssef-857992116`.
- `bookingUrl` is `https://calendly.com/saz-labs/discovery-call`.
- `founder.name` is Sobhy Youssef, `founder.role` is Founder & Lead Engineer, and `founder.bio` is filled from his CV. `founder.linkedin` uses the same LinkedIn profile. `founder.photo` is still empty, so no portrait is shown.
- Firebase web config in `web/firebase-config.js` points at project `saz-labs`. Those values are public by design. Do not put a service-account JSON file in the repo.

## One-time lead email setup (Web3Forms)

The contact form always saves a document in Firestore collection `contactRequests`. That is what the Android admin app reads. Email is a second path, chosen because it stays on a free plan and does not need Cloud Functions or the Firebase Blaze plan.

1. Open [https://web3forms.com](https://web3forms.com) and create a free access key for the inbox that should receive leads. Confirm the message they send to that inbox. The free plan includes 250 submissions a month.
2. Copy the access key into `web3formsAccessKey` in `web/site-config.js`.
3. Commit and push to `main`, then wait for the Pages deployment.
4. Submit one test enquiry on [https://saz-labs.com](https://saz-labs.com) using a real address you control.
5. Confirm both of these: the email arrived, and a `contactRequests` document exists in Firebase console.

The access key is public on purpose. Web3Forms treats it as an alias for your email, not as a server secret. It will be visible in the deployed JavaScript. Do not put SMTP passwords, API secrets, or Firebase service-account keys in `site-config.js`. Domain lock for the key is a paid Web3Forms option. Until then, the form honeypot and the one-minute resend limit are the spam controls.

If the key is blank, the form still saves to Firestore and shows success. Email starts only after the key is deployed. If Firestore succeeds and Web3Forms fails, the visitor is told the request was saved and is asked to email `contact@saz-labs.com` as well.

## Analytics

Leave `analytics.provider` as `""` until you want measurement. No analytics script loads before a provider and a token are both set.

- Cloudflare Web Analytics: set `provider` to `cloudflare` and `token` to the beacon token from the Cloudflare dashboard.
- Plausible: set `provider` to `plausible` and `token` to `saz-labs.com`.

## Local preview

From the repository root:

```bash
python3 -m http.server 8080 --directory web
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). Use a local server. Opening the HTML file directly will not load the JavaScript modules.

## Android admin and Firebase

Open `android-admin/` in Android Studio and follow `android-admin/README.md`.

Run Firebase CLI commands from `firebase/`. Deploy rules only when you mean to, with `firebase deploy --only firestore:rules`. Details are in `firebase/README.md`.
