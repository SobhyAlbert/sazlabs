# Firebase setup for SAZ Labs

The static contact form writes directly to Firestore. A separate Android admin client is prepared for owner-only reads after Google Authentication is configured. No Cloud Functions, email provider, billing, background notifications, or Firebase Hosting is used.

## Current Firebase setup

- Project: `saz-labs`
- Firestore: Standard edition, Production mode
- Region: `europe-west1` (Belgium)
- Web App configuration: `firebase-config.js`
- Submission collection: `contactRequests`

## Complete activation

1. Copy `.firebaserc.example` to `.firebaserc` and keep the project ID as `saz-labs`.
2. Review `firestore.rules`.
3. From the `firebase/` directory, deploy **Firestore rules only** when explicitly ready:
   `firebase deploy --only firestore:rules`
4. Serve the site locally or use GitHub Pages, then submit one clearly marked test request.
5. Review received documents in Firebase Console > Firestore > `contactRequests`.

Do not deploy Hosting or enable billing as part of these steps.

Android app setup and its Authentication prerequisites are documented in `../android-admin/README.md`.

## Security model

- Public visitors may create documents only in `contactRequests`.
- Rules require the exact expected fields, strict types and lengths, an allowed service, fixed status/source values, and a server timestamp.
- Public clients cannot read, list, update, or delete any submission.
- Reads require Firebase Authentication and the exact owner UID configured in `firestore.rules`.
- Updates and deletes remain denied from every client.
- The form includes a honeypot, browser-side validation, a one-minute local cooldown, and disables repeat clicks while sending.
- Static client safeguards reduce casual abuse but cannot provide strong global rate limiting. If abuse becomes material, add App Check or a trusted backend before loosening any rules.

## Local verification

Firebase SDK modules load from Google's CDN, so use a local web server rather than opening HTML files directly. The Firebase Emulator Suite can be added later for automated rules tests. Never test with real customer data.
