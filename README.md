# DaniOS

DaniOS is a browser-based desktop environment simulator inspired by Windows 11. It runs as a static website; it does **not** replace Windows, Linux, macOS, or a native operating system.

## Run it

- Open the GitHub Pages deployment if enabled, or serve this repository with any static web server.
- For local development, run `npm install` (no runtime dependencies) and `npm run check`.
- Service workers, installability, and some browser APIs require HTTPS or localhost.

## Included features

- Desktop shell with wallpaper, desktop shortcuts, Start menu, app search, taskbar, clock, notifications, quick settings and context menu.
- Draggable, focusable, minimizable, maximizable and closable app windows.
- Virtual desktops (taskbar switcher; Ctrl+Alt+Left/Right; F2 creates a desktop).
- File Explorer with a virtual directory tree, folder creation, uploads, file opening and IndexedDB-backed storage.
- Notepad with explicit save/open workflow; Calculator; Terminal with a small, sandboxed virtual command set.
- Browser window with an address field and iframe-based browsing. Many websites deliberately block embedding; use “Open in system browser” for those sites.
- Settings surfaces for system, personalization, accounts, networking, Bluetooth/device, accessibility, privacy, updates, storage, apps, time and About.
- Wallpaper and accent customization, simulated lock screen, Paint canvas, Photos preview, media playback, Calendar notes, Clock/timer and Task Manager.
- PWA manifest and an offline app-shell service worker.

## Data and privacy

Virtual files and calendar notes are stored in the current browser profile (IndexedDB/localStorage). They are not synced to a server. Clearing site data can remove them. Uploaded files stay in browser storage unless the user downloads or otherwise shares them. Browser permissions are requested only when a user activates a feature that needs them.

## Browser limitations (important)

A website cannot implement every Windows feature. DaniOS cannot provide a Windows kernel, native process isolation, arbitrary host filesystem access, registry access, device drivers, Windows Update, native sign-in/security boundaries, full system networking controls, real power actions, or unrestricted access to hardware. Bluetooth and other device APIs vary by browser and often require HTTPS, user gestures, and explicit permission. Quick toggles and account/power controls that do not have a corresponding web API are clearly simulations.

The browser window is not a full browser engine: cross-origin iframe restrictions, CSP, X-Frame-Options and browser security rules prevent many sites from loading inside it.

## Troubleshooting

- **Blank or stale app after an update:** hard-refresh the page. If necessary, clear this site's cached data/service worker in browser site settings and reload.
- **Files do not persist:** use a modern browser with IndexedDB enabled; avoid private browsing modes that clear storage on exit.
- **Install/offline unavailable:** serve over HTTPS or localhost. Service workers do not work from arbitrary `file://` URLs.
- **A website is blank in Browser:** the destination likely blocks iframe embedding. Open it in the system browser instead.
- **Bluetooth option unavailable:** use a supported browser on HTTPS; the host OS must have Bluetooth enabled. Pairing is still controlled by the host OS.
- **Display, sound, power, network, update or account settings do not change the computer:** those settings are simulated because a web page has no native OS privileges.

## Quality checks

Run `npm run check` to parse the inline JavaScript and verify key app-shell hooks. The repository also includes a GitHub Actions workflow that runs this check on pushes and pull requests.
