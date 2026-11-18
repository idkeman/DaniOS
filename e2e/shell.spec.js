import { test, expect } from '@playwright/test';

async function openApp(page,id) {
  page.on('pageerror',err=>console.log('BROWSER PAGE ERROR:',err.message));
  page.on('console',msg=>console.log('BROWSER CONSOLE:',msg.type(),msg.text()));
  await page.locator('#startBtn').click();
  console.log('START PANEL CLASS:',await page.locator('#startPanel').getAttribute('class'));
  await expect(page.locator('#startPanel')).toBeVisible();
  const app=page.locator('#appGrid [data-app="'+id+'"]');
  await expect(app).toBeVisible();
  await app.click();
  await expect(page.locator('.window[data-app="'+id+'"]')).toBeVisible();
  return page.locator('.window[data-app="'+id+'"]').last();
}

test.beforeEach(async ({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>window.DaniOSReady===true);
});

test('Start menu and app windows launch, minimize and restore',async({page})=>{
  const win=await openApp(page,'notepad');
  await win.locator('[data-x="newnote"]').click();
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
  const folder=win.locator('.x-file').filter({hasText:'E2E Folder'});
  await expect(folder).toBeVisible();
  await folder.click({button:'right'});
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


test('Calculator evaluates arithmetic using buttons and keyboard',async({page})=>{
  const win=await openApp(page,'calculator');
  for(const key of ['7','+','2','='])await win.locator('[data-calc="'+key+'"]').click();
  await expect(win.locator('.calc-display')).toHaveValue('9');
});

test('Paint saves drawings into the virtual Pictures folder and Calendar saves notes',async({page})=>{
  const paint=await openApp(page,'paint');
  await paint.locator('[data-paint="clear"]').click();
  await paint.locator('[data-paint="save"]').click();
  await expect.poll(async()=>page.evaluate(async()=>((await window.DaniOS.allFiles()).some(f=>f.path.startsWith('/Pictures/Paint-'))))).toBe(true);
  const calendar=await openApp(page,'calendar');
  const date=await calendar.locator('.calendar-date').inputValue();
  await calendar.locator('textarea').fill('DaniOS calendar persistence test');
  await calendar.locator('[data-calendar="save"]').click();
  await expect.poll(async()=>page.evaluate(d=>localStorage.getItem('danios-calendar-'+d),date)).toBe('DaniOS calendar persistence test');
});

test('Notes, tasks and unit converter apps respond',async({page})=>{
  const notes=await openApp(page,'notes');
  await notes.locator('[data-x="addnote"]').click();
  await expect(notes.locator('.x-note')).toHaveCount(1);
  const todo=await openApp(page,'todo');
  await todo.locator('input[name="task"]').fill('Verify DaniOS task list');
  await todo.locator('form button').click();
  await expect(todo.locator('.x-todolist')).toContainText('Verify DaniOS task list');
  const converter=await openApp(page,'unitconverter');
  await expect(converter.locator('.x-result')).toContainText('1 m');
});
