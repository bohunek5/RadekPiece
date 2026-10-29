import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

await fs.mkdir('output',{recursive:true});await fs.mkdir('public/models',{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1512,height:982},deviceScaleFactor:1});
const page=await context.newPage(),errors=[],checks=[],models=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const unlocked=async()=>{if(await page.locator('#access-password').count()){await page.locator('#access-password').fill('321');await page.locator('#access-password').press('Enter');}await page.waitForFunction(()=>window.kostrzewa?.ready,null,{timeout:60000});};
try{
 await page.goto('http://127.0.0.1:4184/');assert.equal(await page.evaluate(()=>!!window.kostrzewa),false);await page.locator('#access-password').fill('wrong');await page.locator('#access-password').press('Enter');await page.locator('#access-password[aria-invalid=true]').waitFor();await unlocked();await page.evaluate(()=>window.kostrzewa.studio.environmentReady);checks.push('Password gate rejects wrong entry and loads studio with correct entry');
 const ids=await page.locator('[data-product]').evaluateAll(es=>es.map(e=>e.dataset.product));assert.equal(new Set(ids).size,4);
 for(const id of ids){
  await page.locator(`[data-product="${id}"]`).click();await page.evaluate(()=>window.kostrzewa.set({finish:'factory',sheen:'satin',dimensions:false}));await page.waitForTimeout(850);
  const info=await page.evaluate(()=>({metrics:window.kostrzewa.metrics(),product:window.kostrzewa.studio.product}));assert.equal(info.metrics.product,id);assert.equal(info.metrics.invalid,0);assert.ok(info.metrics.objects>5);assert.ok(info.metrics.size.every(v=>v>0));
  const expected=[info.product.width,info.product.height,info.product.depth];info.metrics.size.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<.015,`${id}: model ${v} vs drawing ${expected[i]}`));
  await page.screenshot({path:`qa/${id}-studio.png`});
  for(const view of ['front','side','rear','detail']){await page.locator(`[data-view=${view}]`).click();await page.waitForTimeout(720);await page.screenshot({path:`qa/${id}-${view}.png`});assert.equal(await page.locator(`[data-view=${view}]`).getAttribute('aria-pressed'),'true');}
  await page.locator('[data-view=studio]').click();await page.waitForTimeout(720);
  const glbDownload=page.waitForEvent('download',{timeout:90000});await page.locator('#export-glb').click();await(await glbDownload).saveAs(`public/models/${id}.glb`);
  const bytes=await fs.readFile(`public/models/${id}.glb`);assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);const data=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());assert.equal(data.asset.version,'2.0');assert.ok(data.meshes.length>5);assert.ok(data.nodes.some(n=>n.extras?.product===info.product.name));
  const roundtrip=await page.evaluate(async id=>await(await import('/qa/glb-roundtrip.js')).verifyGLB(`/models/${id}.glb`),id);assert.equal(roundtrip.invalid,0);roundtrip.size.forEach((v,i)=>assert.ok(Math.abs(v-info.metrics.size[i])<.0001));
  const pngDownload=page.waitForEvent('download',{timeout:90000});await page.locator('#export-png').click();await(await pngDownload).saveAs(`output/${id}-4K.png`);const png=await sharp(`output/${id}-4K.png`).metadata();assert.equal(png.width,3840);assert.equal(png.height,2160);
  await page.locator('#sources-open').click();assert.equal(await page.locator('#sources-dialog').evaluate(e=>e.open),true);await page.keyboard.press('Escape');
  for(const key of['pdfUrl','imageUrl']){const response=await page.request.get(new URL(info.product[key],'http://127.0.0.1:4184/').href);assert.equal(response.status(),200,`${id} ${key}`);}
  models.push({...info,roundtrip,glbBytes:bytes.length});
 }
 checks.push('Four distinct product selections and source references work','Geometry finite, outer dimensions match chosen drawings within 15mm','Five camera views for each product','Four GLBs exported and re-imported with dimensions and embedded materials','Four PNG exports at 3840x2160');
 const materialSnapshot=()=>page.evaluate(()=>{const result=[];window.kostrzewa.studio.boat.root.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.color)result.push([m.name,m.color.getHexString(),m.roughness]);});return JSON.stringify(result);});
 const factory=await materialSnapshot();await page.locator('[data-choice=finish][data-value=white]').click();assert.notEqual(await materialSnapshot(),factory);await page.locator('[data-choice=sheen][data-value=gloss]').click();await page.locator('#dimensions').click();assert.equal(await page.evaluate(()=>window.kostrzewa.studio.dimensions.visible),true);checks.push('Finish, sheen and dimension controls update actual scene');
 const saved=await page.evaluate(()=>window.kostrzewa.state);await page.reload();await page.waitForFunction(()=>window.kostrzewa?.ready);assert.deepEqual(await page.evaluate(()=>window.kostrzewa.state),saved);checks.push('Password session and product settings survive reload');
 await page.locator('#reset-config').click();await page.waitForTimeout(800);const rect=await page.locator('#viewport canvas').boundingBox();const before=await page.evaluate(()=>window.kostrzewa.studio.camera.position.toArray());await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height*.6);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.6+90,rect.y+rect.height*.6+20,{steps:8});await page.mouse.up();await page.waitForTimeout(300);assert.notDeepEqual(await page.evaluate(()=>window.kostrzewa.studio.camera.position.toArray()),before);checks.push('Pointer orbit works');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
 for(const id of ids){await page.locator(`[data-product="${id}"]`).click();await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`qa/${id}-mobile.png`,fullPage:true});}
 checks.push('Four products selectable on mobile390px with no horizontal overflow');assert.deepEqual(errors,[]);checks.push('No JavaScript errors or failed HTTP requests');
 const report={utc:new Date().toISOString(),checks,models,errors};await fs.writeFile('qa/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks,models:models.map(p=>({id:p.metrics.product,size:p.metrics.size,glbBytes:p.glbBytes})),errors}));
}finally{await browser.close();}
