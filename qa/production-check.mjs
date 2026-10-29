import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:4188/';
const report = { checkedAt: new Date().toISOString(), build: 'dist', base, scope: 'Password gate, production assets, product navigation, source dialog and responsive layout; geometry and exports already verified separately.', checks: [], assets: [], models: [], viewports: [], errors: [] };
const browser = await chromium.launch({channel:'chrome',headless:true});
function instrument(page, label) {
  page.on('pageerror',error=>report.errors.push({label,type:'pageerror',message:error.message}));
  page.on('console',message=>{if(message.type()==='error')report.errors.push({label,type:'console',message:message.text()});});
  page.on('requestfailed',request=>{if(!request.failure()?.errorText?.includes('ERR_ABORTED'))report.errors.push({label,type:'network',url:request.url(),message:request.failure()?.errorText});});
  page.on('response',response=>{if(response.status()>=400)report.errors.push({label,type:'http',url:response.url(),status:response.status()});});
}
async function bounds(page, label) {
  const dimensions = await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,viewport:document.querySelector('#viewport')?.getBoundingClientRect().toJSON(),dialog:document.querySelector('dialog[open]')?.getBoundingClientRect().toJSON()}));
  assert.ok(dimensions.documentWidth<=dimensions.width+1,`${label}: document overflow`);
  assert.ok(dimensions.bodyWidth<=dimensions.width+1,`${label}: body overflow`);
  if(dimensions.dialog){assert.ok(dimensions.dialog.left>=-1,`${label}: dialog left clipping`);assert.ok(dimensions.dialog.right<=dimensions.width+1,`${label}: dialog right clipping`);}
  report.viewports.push({label,...dimensions});
}
async function unlock(page) {
  await page.locator('#access-password').fill('321');await page.locator('.access-submit').click();
  await page.waitForFunction(()=>window.kostrzewa?.ready,{timeout:30000});
  await page.evaluate(()=>window.kostrzewa.studio.environmentReady);await page.waitForTimeout(850);
  assert.equal(await page.locator('#access-form').count(),0);
}
try {
  const desktop = await browser.newContext({viewport:{width:1536,height:1000},deviceScaleFactor:1});
  const page = await desktop.newPage();instrument(page,'desktop');
  const beforeLoginRequests=[];page.on('request',r=>{if(!page.__unlocked)beforeLoginRequests.push(r.url());});
  await page.goto(base,{waitUntil:'networkidle'});
  assert.equal(await page.locator('canvas').count(),0);assert.equal(await page.locator('[data-product]').count(),0);
  assert.equal(await page.evaluate(()=>typeof window.kostrzewa),'undefined');
  assert.ok(!beforeLoginRequests.some(url=>/\/main-[^/]+\.js/.test(url)));
  await bounds(page,'desktop-gate');await page.screenshot({path:'qa/production-desktop-gate.png',fullPage:true});
  await page.locator('#access-password').fill('wrong-access');await page.locator('.access-submit').click();
  await page.waitForFunction(()=>document.querySelector('#access-password')?.getAttribute('aria-invalid')==='true');
  assert.match(await page.locator('#access-message').textContent(),/Nieprawidłowe hasło/);
  assert.equal(await page.locator('canvas').count(),0);
  report.checks.push('Gate blocks studio and model imports before login; wrong password rejected.');
  page.__unlocked=true;await unlock(page);
  report.checks.push('Password 321 opens the production application.');
  const ids=await page.locator('[data-product]').evaluateAll(nodes=>nodes.map(n=>n.dataset.product));assert.equal(ids.length,4);
  const checkedAssets=new Set();
  for(const id of ids){
    await page.locator(`[data-product="${id}"]`).click();
    await page.waitForFunction(expected=>window.kostrzewa?.state.product===expected,id);await page.waitForTimeout(850);
    assert.equal(await page.locator(`[data-product="${id}"]`).getAttribute('aria-pressed'),'true');
    const model=await page.evaluate(()=>({id:window.kostrzewa.state.product,title:document.querySelector('#model-title').textContent,productName:window.kostrzewa.studio.product.name,visible:window.kostrzewa.studio.boat.root.visible,canvasWidth:document.querySelector('#viewport canvas').width}));
    assert.ok(model.visible&&model.canvasWidth>0);report.models.push(model);
    await bounds(page,`desktop-${id}`);await page.screenshot({path:`qa/production-${id}.png`,fullPage:true});
    await page.locator('#sources-open').click();await page.locator('#sources-dialog').waitFor({state:'visible'});
    const source=await page.locator('#source-content').evaluate(el=>({text:el.textContent,links:[...el.querySelectorAll('a')].map(a=>({url:a.href,label:a.textContent.trim()})),images:[...el.querySelectorAll('img')].map(img=>({src:img.src,complete:img.complete,width:img.naturalWidth,alt:img.alt}))}));
    for(const image of source.images){assert.ok(image.complete&&image.width>0,`Source image ${image.src} failed`);}
    if(id.startsWith('hpr-')){
      assert.match(source.text,/Rodzina HPR Deluxe · HPR 500 i hydrobox/);
      assert.match(source.images[0].alt,/HPR 500 Deluxe z hydroboxem/);
    }
    for(const link of source.links){
      if(checkedAssets.has(link.url))continue;checkedAssets.add(link.url);
      const response=await page.request.get(link.url,{timeout:30000});const contentType=response.headers()['content-type']||'';
      assert.equal(response.status(),200,`Source link ${link.url} returned ${response.status()}`);
      if(/\.pdf(?:\?|$)/i.test(link.url)){const body=await response.body();assert.equal(body.subarray(0,5).toString(),'%PDF-');}
      report.assets.push({url:link.url,status:response.status(),contentType,label:link.label});
    }
    await bounds(page,`desktop-source-${id}`);
    if(id===ids[0])await page.screenshot({path:'qa/production-desktop-sources.png',fullPage:true});
    await page.locator('#sources-close').click();
  }
  report.checks.push('All four model buttons load their model and update heading, selection and source dialog.');
  report.checks.push('All source images, local PDFs (including pump dimensions/manual) and manufacturer product links return HTTP 200.');
  report.checks.push('Pump photograph is explicitly captioned as the HPR 500 family image with hydrobox.');
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.kostrzewa?.ready);assert.equal(await page.locator('#access-form').count(),0);report.checks.push('Reload retains access in the current session.');
  await desktop.close();

  for(const width of [320,390]){
    const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const mobile=await context.newPage();instrument(mobile,`mobile-${width}`);
    await mobile.goto(base,{waitUntil:'networkidle'});assert.equal(await mobile.locator('canvas').count(),0);await bounds(mobile,`mobile-${width}-gate`);await mobile.screenshot({path:`qa/production-mobile-${width}-gate.png`,fullPage:true});
    await unlock(mobile);await bounds(mobile,`mobile-${width}-studio`);await mobile.screenshot({path:`qa/production-mobile-${width}.png`,fullPage:true});
    await mobile.locator('[data-product="eei-pellets-16"]').click();await mobile.waitForFunction(()=>window.kostrzewa?.state.product==='eei-pellets-16');await mobile.waitForTimeout(850);await bounds(mobile,`mobile-${width}-eei`);
    await mobile.locator('#sources-open').click();await mobile.locator('#sources-dialog').waitFor({state:'visible'});await bounds(mobile,`mobile-${width}-source`);await mobile.screenshot({path:`qa/production-mobile-${width}-sources.png`,fullPage:true});
    await mobile.locator('#sources-close').click();await context.close();
  }
  report.checks.push('320 px and 390 px mobile layouts: fresh-session gate, model switching and source dialog; no horizontal overflow or clipped dialog.');
  assert.deepEqual(report.errors,[]);report.checks.push('No JavaScript, console, failed-network or HTTP errors.');report.status='passed';
}catch(error){report.status='failed';report.failure={message:error.message,stack:error.stack};process.exitCode=1;}
finally{await fs.writeFile('qa/production-verification.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({status:report.status,checks:report.checks,assets:report.assets.length,models:report.models.length,viewports:report.viewports.length,errors:report.errors,failure:report.failure?.message},null,2));}
