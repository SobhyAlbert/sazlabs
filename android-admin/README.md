# SAZ Labs Android Admin

Private Android client for reviewing `contactRequests` while the app is open. It uses Google sign-in and a Firestore snapshot listener; it has no background service, push notifications, email integration, or billing requirement.

## Firebase Console setup required

1. Add an Android app with package name `com.sazlabs.admin`.
2. Add the SHA-1 fingerprint from Android Studio's `signingReport`.
3. Download `google-services.json` to `android-admin/app/google-services.json`. It is ignored by Git.
4. Enable Google in Authentication > Sign-in method when the Console permits it.
   Enabling the provider creates the Web OAuth client used for ID tokens. Download
   `google-services.json` again afterward; the refreshed file must generate
   `default_web_client_id`.
5. Sign in once, then copy the owner's UID from Authentication > Users.
6. Replace `REPLACE_WITH_OWNER_FIREBASE_UID` in `../firebase/firestore.rules` with that exact UID.
7. Review and deploy Firestore rules only. Do not deploy Hosting.

Until steps 1–4 are complete, the app builds but shows a setup message. Until steps 5–7 are complete, sign-in may succeed but Firestore reads remain denied.

Open `android-admin` in Android Studio and run the `app` configuration on the owner's phone.

## Security

- No owner UID, password, service-account key, or private credential is embedded.
- Google sign-in establishes Firebase Authentication.
- Firestore rules enforce the single-owner read boundary.
- The public website retains create-only access.
- The listener exists only while the requests screen is active; there are no background notifications.
