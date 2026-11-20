const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true});
  const errors = [];
  const page = await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
  const test=async(name,fn)=>{await fn();console.log('PASS '+name)};
  try {
    await test('initial dashboard',async()=>{await page.locator('#content .stat strong').first().waitFor();assert.match(await page.locator('#counts').innerText(),/8 событий/)});
    await test('line filters match project',async()=>{const vals=await page.locator('#lineFilter option').allTextContents();for(const x of ['Основная','Конфликт','Персонажи','Мир','Тайна','Финал'])assert(vals.includes(x),x)});
    await test('add and undo redo',async()=>{await page.locator('#addBtn').click();assert.match(await page.locator('#counts').innerText(),/9 событий/);await page.locator('#undoBtn').click();assert.match(await page.locator('#counts').innerText(),/8 событий/);await page.locator('#redoBtn').click();assert.match(await page.locator('#counts').innerText(),/9 событий/)});
    await test('edit event and persistence',async()=>{await page.locator('[data-prop="title"]').fill('QA event title');await page.locator('#saveEvent').click();await page.waitForTimeout(400);await page.reload();assert.match(await page.locator('#content').innerText(),/QA event title|Тайна маяка/);const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('atlas-public-demo-v2')));assert(stored.events.some(e=>e.title==='QA event title'))});
    await test('graph and fit',async()=>{await page.locator('[data-nav="graph"]').click();await page.locator('#fitGraph').click();assert(await page.locator('.node').count()>=8)});
    await test('table timeline board characters episodes',async()=>{for(const v of ['table','timeline','board','characters','episodes','project']){await page.locator('[data-nav="'+v+'"]').click();assert((await page.locator('#viewTitle').innerText()).length>0)}});
    await test('download JSON',async()=>{const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#exportBtn').click()]);assert(dl.suggestedFilename().endsWith('.json'))});
    await test('mobile viewport no horizontal document overflow',async()=>{await page.setViewportSize({width:390,height:844});await page.locator('[data-nav="dashboard"]').click();const metrics=await page.evaluate(()=>({body:document.body.scrollWidth,viewport:innerWidth}));assert(metrics.body<=metrics.viewport+2,JSON.stringify(metrics))});
    await test('keyboard focus visible',async()=>{await page.locator('#addBtn').focus();assert(await page.locator('#addBtn').evaluate(e=>getComputedStyle(e).outlineStyle!=='none'))});
    assert.deepEqual(errors,[],'Browser JavaScript errors');
    console.log('BROWSER QA PASS');
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
