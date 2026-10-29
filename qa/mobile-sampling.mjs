import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2]||'before';
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[];const errors=[];
for(const width of [320,390]){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4188/',{waitUntil:'networkidle'});await page.locator('#access-password').fill('321');await page.locator('.access-submit').click();await page.waitForFunction(()=>window.kostrzewa?.ready);await page.evaluate(()=>window.kostrzewa.studio.environmentReady);await page.waitForTimeout(900);
 await page.locator('#viewport').screenshot({path:`qa/mobile-sampling-${phase}-${width}.png`});
 const rendering=await page.evaluate(()=>{const s=window.kostrzewa.studio;return {ratio:s.renderer.getPixelRatio(),width:s.renderer.domElement.width,height:s.renderer.domElement.height,cssWidth:s.container.clientWidth,cssHeight:s.container.clientHeight,docWidth:document.documentElement.scrollWidth,windowWidth:innerWidth}});
 assert.ok(rendering.docWidth<=rendering.windowWidth+1);if(phase==='after')assert.equal(rendering.ratio,2);
 await page.locator('[data-product="eei-pellets-16"]').click();await page.waitForFunction(()=>window.kostrzewa.state.product==='eei-pellets-16');await page.waitForTimeout(700);assert.equal(await page.locator('[data-product="eei-pellets-16"]').getAttribute('aria-pressed'),'true');
 checks.push({viewport:width,rendering,modelSwitch:'passed'});await context.close();
}
if(phase==='after'){
 const context=await browser.newContext({viewport:{width:1536,height:1000},deviceScaleFactor:1});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4188/');await page.locator('#access-password').fill('321');await page.locator('.access-submit').click();await page.waitForFunction(()=>window.kostrzewa?.ready);await page.evaluate(()=>window.kostrzewa.studio.environmentReady);await page.waitForTimeout(800);
 const before=await page.evaluate(()=>{const s=window.kostrzewa.studio;return {ratio:s.renderer.getPixelRatio(),w:s.renderer.domElement.width,h:s.renderer.domElement.height,aspect:s.camera.aspect}});assert.equal(before.ratio,1.5);
 const exported=await page.evaluate(async()=>{const s=window.kostrzewa.studio;const blob=await s.png();const bitmap=await createImageBitmap(blob);const result={width:bitmap.width,height:bitmap.height,bytes:blob.size,ratio:s.renderer.getPixelRatio(),w:s.renderer.domElement.width,h:s.renderer.domElement.height,aspect:s.camera.aspect};bitmap.close();return result});
 assert.equal(exported.width,3840);assert.equal(exported.height,2160);assert.equal(exported.ratio,before.ratio);assert.equal(exported.w,before.w);assert.equal(exported.h,before.h);assert.equal(exported.aspect,before.aspect);
 await page.locator('[data-product="twin-bio-16"]').click();await page.waitForFunction(()=>window.kostrzewa.state.product==='twin-bio-16');await page.waitForTimeout(700);await page.screenshot({path:'qa/mobile-sampling-desktop-smoke.png'});
 checks.push({viewport:1536,desktop:'passed',before,exported,renderRestore:'passed'});await context.close();
}
assert.deepEqual(errors,[]);await fs.writeFile(`qa/mobile-sampling-${phase}.json`,JSON.stringify({phase,checkedAt:new Date().toISOString(),status:'passed',checks,errors},null,2));console.log(JSON.stringify({phase,checks,errors},null,2));await browser.close();
