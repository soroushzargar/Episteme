# Native App Notes

## macOS

The current native wrapper uses Electron because this machine does not have the
Rust toolchain required for Tauri. It produces a normal macOS `.app` bundle from
the Vite build.

```bash
npm run desktop:dev
npm run desktop:dir
npm run desktop:build
```

`desktop:dir` creates an unpacked app under `release/mac*/`. `desktop:build`
creates DMG/ZIP artifacts.

## iOS

iOS should be packaged separately with Capacitor or a native Swift shell. The
React app and the sync record schema can be shared, but the storage layer should
use native CloudKit APIs rather than a local web server.

The Capacitor config is present at `capacitor.config.json`. On a machine with
full Xcode installed:

```bash
npm run ios:init
npm run ios:open
```

## iCloud Strategy

Do not sync a live SQLite database through iCloud Drive. The app should sync
versioned records through CloudKit private database records and store large
files as CloudKit assets. See `src/sync/cloudkitRecords.js` for the stable
record shape that native shells should use.
