# DaniOS

DaniOS is a Windows-inspired desktop environment that runs as a web application. It provides a desktop shell, app windows, a virtual drive and browser-permission-based access to selected device APIs. It is not a native operating system.

## Run locally

- Node.js 20 or newer: `npm start` serves DaniOS at `http://localhost:3000`.
- Run static checks with `npm run check`, backend tests with `npm test`, and browser end-to-end tests with `npm run test:e2e` (after `npm install --no-save @playwright/test` and `npx playwright install chromium`).
- **Static preview:** https://idkeman.github.io/DaniOS/ — GitHub Pages publishes the static shell. The full Scramjet proxy requires the Node server and WebSocket endpoint, so use the Railway-hosted deployment for proxied browsing.
- HTTPS or localhost is required for service workers and most permission-gated APIs.

## Desktop and shell

- Start menu and app search, desktop shortcuts, taskbar app toggles, notification center, quick settings, system clock and context menus.
- Draggable, resizable, focusable, minimizable, maximizable and closable windows, with edge snapping.
- Multiple virtual desktops, persisted between sessions.
- Lock screen with an optional local DaniOS PIN. This is an app-level gate, not a native OS security boundary.
- Light/dark/midnight themes, wallpaper presets and upload, accent color, brightness, text scaling, high contrast and reduced motion.

## Applications

- File Explorer: create files/folders, search, navigate, upload, import a chosen local folder, download, rename, move and delete.
- Recycle Bin: restore deleted virtual files or permanently remove them.
- Notepad: create, open, edit, save, save as, download and print.
- Calculator, Terminal, Browser, Paint, Photos, Media Player, Calendar, Clock and Task Manager.
- App Store, Sticky Notes, To-do List, Clipboard, Camera & Recorder, Device Center, Unit Converter, Weather, System Monitor and Help.
- Browser tabs, navigation history and bookmarks. The Browser app uses Scramjet with a Wisp WebSocket tunnel on the Node-hosted deployment, rather than assigning destination URLs directly to a restricted iframe. The Save page action stores a rendered HTML snapshot in /Downloads.

## Storage and backup

The DaniOS virtual drive is stored in IndexedDB in the current browser profile. It is separate from your computer's normal filesystem. File Explorer can import a selected local directory where the File System Access API is supported, and can export or restore a DaniOS JSON backup. Clearing browser site data can delete local files and settings; keep a backup.

## Browser API integrations

Where supported, DaniOS can request access to:
- Camera and microphone through `getUserMedia`.
- Bluetooth Low Energy through Web Bluetooth.
- USB devices through WebUSB (enter the USB vendor ID in hexadecimal; the Device Center defaults to `2341`, Arduino's vendor ID).
- Serial devices through Web Serial.
- Screen capture through `getDisplayMedia`.
- Clipboard read/write through the Async Clipboard API.
- Local directories through the File System Access API.
- Persistent storage and screen wake lock.

These APIs require compatible browsers, HTTPS or localhost, a user gesture and explicit permission. Web Bluetooth, WebUSB, Web Serial and File System Access are not available in every browser. DaniOS cannot install drivers or take over OS pairing controls.

## Railway hosting

The repository includes the Node server and Railway Infrastructure as Code at .railway/railway.ts. The server hosts the desktop, Scramjet runtime assets, and the Wisp WebSocket tunnel. It sets the COOP/COEP headers required by Scramjet and exposes:
- /api/health — deployment health check, including proxy readiness.
- /api/version — running version and build.
- /api/capabilities — hosting and storage capability description.

Railway is the selected first deployment target because this repository already has Railway IaC and the service needs a long-lived Node process plus WebSocket upgrades. Deploy from the repository root after connecting the DaniOS project and confirming the account has sufficient resource capacity. The deployment has not been created or charged by this code change.

The proxy backend is a public network gateway, so Wisp is restricted to same-origin browser connections, standard HTTP/HTTPS ports, hostname-based DNS resolution, and non-private destination IPs. Direct IP targets, loopback/private networks, UDP, and non-web ports are blocked. IPv4-mapped IPv6 DNS answers are normalized before private-address checks. Each Wisp connection is limited to 128 active streams, and each client IP is limited to 32 concurrent WebSocket connections. Railway deployments use the platform-overwritten X-Real-IP header for this limit; self-hosted deployments use the socket peer address. These protections reduce abuse and SSRF risk but do not replace authentication, abuse monitoring, or a production rate-limiting layer.

The browser can save the current rendered HTML snapshot into the DaniOS virtual /Downloads folder. Ordinary file downloads initiated by proxied pages are still handled by the host browser's download manager; import them into DaniOS with File Explorer → Upload. Automatic interception of arbitrary binary downloads into the virtual drive is not yet implemented.

DaniOS files remain local to the browser; cloud account sync is not configured.

## Third-party licenses

The Scramjet runtime, controller, utilities, libcurl transport, and Wisp server dependencies are licensed under AGPL-3.0 (the Scramjet packages use AGPL-3.0-only). Review those terms before redistributing DaniOS under a different license. Their source projects are linked in THIRD_PARTY_NOTICES.md.

## What a browser app cannot do

A website cannot provide a Windows kernel, native process isolation, registry access, device drivers, arbitrary filesystem access without user permission, Windows Update, real shutdown/restart, host Wi-Fi/airplane-mode switches, system-wide volume or display control, or native account security. Those controls are either clearly marked simulations or delegated to the browser/host OS.

## Troubleshooting

- **Blank or old version:** hard-refresh. If needed, remove the site's service worker/cache in browser site settings and reload.
- **Files not persisting:** use a modern browser with IndexedDB enabled and avoid private mode that clears data on exit.
- **Device feature unavailable:** use a supported browser on HTTPS or localhost and approve the browser prompt.
- **Proxy does not start:** use the Node-hosted DaniOS deployment, not the GitHub Pages static preview. Confirm the host supports long-lived WebSocket connections at /wisp/ and serves the site over HTTPS.
- **A website still fails:** anti-bot challenges, login controls, DRM, unusual protocols, and site-specific browser checks can still block proxy access.
- **Install prompt missing:** open DaniOS over HTTPS, load it once online, then use the browser's Install app option if supported.
- **Railway deploy cannot be created:** free-plan resource limits may need to be cleared or the account plan upgraded.

## External implementation references

The DaniOS feature audit used the MIT-licensed [WebOS browser desktop](https://github.com/Martin-R-D/WebOS) and [WinboxJS](https://github.com/winboxjs/winboxjs.github.io) as architectural references for window management, virtual files, app lifecycle and browser desktop UX. DaniOS does not vendor their source files.
