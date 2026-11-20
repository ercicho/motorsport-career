# Motorsport Career v3.1 Cloud Edition — deployment

1. Make a backup of the existing local career from the working app first. Do not clear browser storage.
2. Upload `index.html`, `cloud.js`, `sw.js` and the other included static assets to the root of `ercicho/motorsport-career` on GitHub. Keep the existing GitHub Pages configuration (`main` / root).
3. In Firebase Authentication, enable **Google** and authorize `ercicho.github.io`.
4. In Firebase Firestore → Rules, paste `firestore.rules` and **Publish**. Never use `allow read, write: if true`.
5. Open https://ercicho.github.io/motorsport-career/ and sign in with Google. If the device has an existing career, choose **Upload this device**; if a cloud career exists, choose **Load cloud career**. Download a JSON backup before choosing either option.
6. On a second device, sign in with the same account and choose **Load cloud career**. Test a change and refresh the first device before continuing there. Simultaneous editing on two devices is not supported; a revision conflict prevents silent cloud overwrites.

## Important limitations

- Offline gameplay uses the existing `localStorage` save. Automatic cloud upload requires an authenticated session and network connectivity. Cloud login itself requires connectivity. Firebase modules are loaded from Google's CDN and need to have been cached by the browser to work without network.
- Cloud saves are encrypted in transit and at rest by Firebase, **not** end-to-end encrypted.
- `index.html` includes the existing game unchanged except for its save calls and a small cloud bridge. All normal saves remain local-first.
- The cloud panel uses English controls; the game's original Italian/English localization remains intact.
- The cloud sync UI is a first implementation, not a verified production release. Browser tests on GitHub Pages, iPhone Safari and Google popup/redirect authentication must be performed after deployment.
- Free Spark quotas apply. There is no billing setup in this package.
