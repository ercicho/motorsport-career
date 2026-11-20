1. Back up career JSON before deployment.
2. Upload all files from this folder to the GitHub repository root, including index.html, cloud.js, sw.js, gt7-vehicles.json and assets.
3. Wait for GitHub Pages deployment, then refresh; do not clear browser storage.
4. Sign in and load cloud career: valid profile must close driver setup.
5. Garage > Vehicle Market: change class, subclass, manufacturer and market; confirm result counter and visible cards change.
6. Test buying a new vehicle, selling and reloading; verify cloud sync.
Firestore rules unchanged. If the old interface persists, inspect service worker registration and cache version.
