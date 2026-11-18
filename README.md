# DaniOS

DaniOS is a Windows-inspired desktop environment that runs as a web application. It provides a desktop shell, app windows, a virtual drive and browser-permission-based access to selected device APIs. It is not a native operating system.

## Run locally

- Node.js 20 or newer: `npm start` serves DaniOS at `http://localhost:3000`.
- Run static checks with `npm run check`, backend tests with `npm test`, and browser end-to-end tests with `npm run test:e2e` (after `npm install --no-save @playwright/test` and `npx playwright install chromium`).
- For GitHub Pages, the site can also be served statically from the repository root.
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
- Browser tabs, navigation history and bookmarks. Websites that block iframe embedding must be opened in a normal browser tab.

## Storage and backup

The DaniOS virtual drive is stored in IndexedDB in the current browser profile. It is separate from your computer's normal filesystem. File Explorer can import a selected local directory where the File System Access API is supported, and can export or restore a DaniOS JSON backup. Clearing browser site data can delete local files and settings; keep a backup.

## Browser API integrations

Where supported, DaniOS can request access to:
- Camera and microphone through `getUserMedia`.
- Bluetooth Low Energy through Web Bluetooth.
- USB devices through WebUSB.
- Serial devices through Web Serial.
- Screen capture through `getDisplayMedia`.
- Clipboard read/write through the Async Clipboard API.
- Local directories through the File System Access API.
- Persistent storage and screen wake lock.

These APIs require compatible browsers, HTTPS or localhost, a user gesture and explicit permission. Web Bluetooth, WebUSB, Web Serial and File System Access are not available in every browser. DaniOS cannot install drivers or take over OS pairing controls.

## Railway hosting

The repository includes `server.mjs` and current Railway Infrastructure as Code at `.railway/railway.ts`. The Node server serves the static desktop and exposes:
- `/api/health` — deployment health check.
- `/api/version` — running version and build.
- `/api/capabilities` — hosting and storage capability description.

To deploy, install the Railway CLI (5.42.1 or newer), authenticate, ensure the Railway account has resource capacity, then run `railway config plan` followed by `railway config apply` from the repository root. The IaC authoring package is listed in `devDependencies`. The IaC file points at `idkeman/DaniOS` on `main`. Railway currently refused creation of a new project because the account has reached its free-plan resource limit; no unrelated Railway project was modified. Once capacity is available, the committed IaC definition can create the DaniOS web service.

Railway's Node server is for hosting and health checks only. DaniOS files remain local to the browser; cloud account sync is not configured.

## What a browser app cannot do

A website cannot provide a Windows kernel, native process isolation, registry access, device drivers, arbitrary filesystem access without user permission, Windows Update, real shutdown/restart, host Wi-Fi/airplane-mode switches, system-wide volume or display control, or native account security. Those controls are either clearly marked simulations or delegated to the browser/host OS.

## Troubleshooting

- **Blank or old version:** hard-refresh. If needed, remove the site's service worker/cache in browser site settings and reload.
- **Files not persisting:** use a modern browser with IndexedDB enabled and avoid private mode that clears data on exit.
- **Device feature unavailable:** use a supported browser on HTTPS or localhost and approve the browser prompt.
- **Browser page is blank:** the destination may block iframes; use the Browser app's external-open button.
- **Install prompt missing:** open DaniOS over HTTPS, load it once online, then use the browser's Install app option if supported.
- **Railway deploy cannot be created:** free-plan resource limits may need to be cleared or the account plan upgraded.

## External implementation references

The DaniOS feature audit used the MIT-licensed [WebOS browser desktop](https://github.com/Martin-R-D/WebOS) and [WinboxJS](https://github.com/winboxjs/winboxjs.github.io) as architectural references for window management, virtual files, app lifecycle and browser desktop UX. DaniOS does not vendor their source files.
