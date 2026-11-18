import { test, expect } from '@playwright/test';

async function openApp(page,id) {
  await page.locator('#startBtn').click();
  const app=page.locator('#appGrid [data-app="'+id+'"]');
  await expect(app).toBeVisible();
  await app.click();
  await expect(page.locator('.window[data-app="'+id+'"]')).toBeVisible();
  return page.locator('.window[data-app="'+id+'"]').last();
}

test.beforeEach(async ({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>!!window.DaniOS);
});

test('Start menu and app windows launch, minimize and restore',async({page})=>{
  const win=await openApp(page,'notepad');
  await win.locator('[data-x="note-new"]').click();
  await win.locator('.x-text').fill('DaniOS e2e smoke test');
  page.once('dialog',d=>d.accept('/Documents/E2E-note.txt'));
  await win.locator('[data-x="savenote"]').click();
  await expect(win.locator('.x-name')).toContainText('E2E-note.txt');
  await win.locator('[data-action="min"]').click();
  await expect(win).toBeHidden();
  await page.locator('.task-apps [data-app="notepad"]').click();
  await expect(win).toBeVisible();
});

test('File Explorer creates folders and sends deleted items to Recycle Bin',async({page})=>{
  const win=await openApp(page,'explorer');
  page.once('dialog',d=>d.accept('E2E Folder'));
  await win.locator('[data-x="newfolder"]').click();
  await expect(win.locator('.x-file')).toContainText('E2E Folder');
  await page.locator('.x-file').filter({hasText:'E2E Folder'}).click({button:'right'});
  await page.locator('.x-context button').filter({hasText:'Delete'}).click();
  await page.locator('#startBtn').click();
  await page.locator('#startSearch').fill('Recycle Bin');
  await page.locator('#appGrid [data-app="recycle"]').click();
  await expect(page.locator('.window[data-app="recycle"] .x-trash')).toContainText('E2E Folder');
});

test('Browser tabs, bookmarks and navigation work',async({page})=>{
  const win=await openApp(page,'browser');
  await win.locator('.x-address').fill('https://example.com');
  await win.locator('[data-x="bgo"]').click();
  await expect(win.locator('.x-frame')).toHaveAttribute('src','https://example.com/');
  await win.locator('[data-x="bmark"]').click();
  await expect(win.locator('.x-bookmarks')).toContainText('example.com');
  await win.locator('[data-x="bnew"]').click();
  await expect(win.locator('.x-tablist .x-tab')).toHaveCount(2);
});

test('Settings theme and virtual desktop controls respond',async({page})=>{
  const win=await openApp(page,'settings');
  await win.locator('[data-x="settingtab"][data-tab="Personalization"]').click();
  await win.locator('[data-x="theme"][data-value="dark"]').click();
  await expect(page.locator('body')).toHaveClass(/enh-dark/);
  await page.locator('#desktopBtn').click();
  await page.locator('#newDesktop').click();
  await expect(page.locator('#desktopChoices button')).toHaveCount(2);
});

test('Terminal executes virtual shell commands and App Store installs apps',async({page})=>{
  const term=await openApp(page,'terminal');
  await term.locator('.x-command').fill('help');
  await term.locator('.x-command').press('Enter');
  await expect(term.locator('.x-output')).toContainText('mkdir');
  const store=await openApp(page,'appstore');
  const card=store.locator('.x-card').filter({hasText:'Weather'});
  const installButton=card.locator('[data-x="installapp"]');
  const before=(await installButton.textContent()).trim();
  await installButton.click();
  await expect(installButton).toHaveText(before==='Install'?'Remove from Start':'Install');
});
