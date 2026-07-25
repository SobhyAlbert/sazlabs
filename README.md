# SAZ Labs

This repository keeps each deployable concern separate:

- `web/` — static landing site, assets, and browser-side Firebase contact form.
- `android-admin/` — private Android owner app for authenticated, live Firestore reads.
- `firebase/` — local Firebase CLI configuration, Firestore rules/indexes, and setup notes.

## Local workflows

### Website

Serve `web/` with any static HTTP server. The contact form uses the public Firebase Web App configuration in `web/firebase-config.js`. Firestore security is enforced by `firebase/firestore.rules`.

The site source previously lived in the repository root. Before a future GitHub Pages deployment, its publishing source or build workflow must be updated to publish `web/`. This repository reorganization does **not** change the current remote GitHub Pages or Firebase Hosting configuration.

### Android admin

Open `android-admin/` in Android Studio. Follow `android-admin/README.md` to register the Android app, add the ignored `google-services.json`, enable Google sign-in, and configure the owner's Firebase UID.

### Firebase

Run Firebase CLI commands from `firebase/`. Deploy targets explicitly and review them first. No deployment, billing, Hosting change, Authentication activation, or email integration is performed by this repository layout.
