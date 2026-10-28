import {auditPath} from './audit-output.mjs';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH??'/Users/nonarkara/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=auditPath('../docs/revival-2026-10-27/nearby-handoff/',import.meta.url);
await mkdir(out,{recursive:true});
const url=process.env.PILOT_URL??'http://127.0.0.1:4174/places',phase=process.env.PHASE??'after',results=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-gpu']});
async function entryGeometry(page){return page.evaluate(()=>{
 const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return{top:r.top,bottom:r.bottom,height:r.height,width:r.width,visible:c.display!=='none'&&c.visibility!=='hidden'}};
 const toolbar=rect('.pf-header'),controls=rect('.pf-everyday-controls'),action=rect('.pf-view-nearby-map');
 return{toolbar,controls,action,map:rect('.pf-map-canvas'),title:rect('.pf-place'),directory:rect('.pf-everyday'),firstRow:rect('.pf-everyday li'),pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,viewport:{width:innerWidth,height:innerHeight},scrollY,
 separation:action&&controls?Math.max(0,action.top-controls.bottom,controls.top-action.bottom):null};
})}
function assertEntry(m){assert.ok(m.action?.visible,'missing visible View map handoff');assert.ok(m.separation<=32,`directory controls/action separated by ${m.separation}px`);assert.ok(m.action.top>=m.toolbar.bottom&&m.action.bottom<=m.viewport.height,'handoff outside working viewport');}
try{for(const [width,height] of[[390,844],[799,900],[800,900],[801,900],[1024,900],[1280,720],[1440,900]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url,{timeout:120000});await p.locator('#pf-place-name').waitFor();await p.evaluate(()=>document.fonts.ready);const directory=p.getByRole('region',{name:'Everyday places'});await directory.getByText(/mapped (?:groceries )?candidates within 800 m/).waitFor();
 await p.getByLabel('Quoted rent / month',{exact:true}).fill('12000');await directory.scrollIntoViewIfNeeded();await directory.getByRole('checkbox',{name:'On map',exact:true}).check();await p.waitForFunction(()=>document.querySelectorAll('.pf-catalog-hit').length>=12);
 await directory.locator('.pf-everyday-controls').scrollIntoViewIfNeeded();const entry=await entryGeometry(p);assert.equal(entry.pageWidth,width,'document overflow');assert.ok(entry.toolbar.height<=64);
 await p.screenshot({path:`${out}/${phase}-directory-${width}.png`,timeout:60000});
 if(phase==='before'){results.push({width,height,entry});await context.close();continue;}
 if(width<=800){
  assertEntry(entry);const view=directory.getByRole('link',{name:'View map ↑',exact:true});await view.focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>{const m=document.querySelector('.pf-map-canvas').getBoundingClientRect(),h=document.querySelector('.pf-header').getBoundingClientRect();return m.top>=h.bottom-1&&m.bottom<innerHeight});
  const map=p.locator('.pf-map-canvas'),back=p.getByRole('link',{name:'Back to candidates ↓',exact:true});await back.waitFor();
  const working=await p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height,width:r.width}};return{toolbar:rect('.pf-header'),map:rect('.pf-map-canvas'),info:rect('.pf-nearby-map-return strong'),back:rect('.pf-nearby-map-return a'),viewportHeight:innerHeight,focused:document.activeElement.id}});
  assert.ok(working.map.height>=240,'map operating area lost');assert.ok(working.back.bottom<=height&&working.back.top>=working.toolbar.bottom,'return action obscured');assert.ok(working.back.top-working.info.bottom<=96,'map status and return separated');assert.equal(working.focused,'pf-place-map','keyboard handoff loses focus');
  assert.match(await p.locator('.pf-nearby-map-return').innerText(),/Groceries.*OSM snapshot.*800 m straight-line.*partial coverage/s);await p.screenshot({path:`${out}/${phase}-map-${width}.png`,timeout:60000});
  const marker=p.getByRole('button',{name:'Catalog place: Ka-Nom',exact:true}),original=await marker.boundingBox(),canvas=await map.boundingBox();await p.mouse.move(canvas.x+canvas.width/2,canvas.y+canvas.height/2);await p.mouse.down();await p.mouse.move(canvas.x+canvas.width/2+140,canvas.y+canvas.height/2,{steps:12});await p.mouse.up();await p.waitForTimeout(400);const shifted=await marker.boundingBox();assert.ok(Math.abs(shifted.x-original.x)>100,'map pan was not exercised');
  await back.focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.activeElement.id==='pf-everyday');assert.equal(await directory.getByRole('checkbox',{name:'On map',exact:true}).isChecked(),true);assert.equal(await directory.getByLabel('Everyday place category').inputValue(),'groceries');assert.equal(await p.getByLabel('Quoted rent / month',{exact:true}).inputValue(),'12000');
  await view.focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.activeElement.id==='pf-place-map');await p.waitForTimeout(300);const recentered=await marker.boundingBox();assert.ok(Math.abs(recentered.x-original.x)<2&&Math.abs(recentered.y-original.y)<2,'View map did not recenter the active search');
  await back.click();await directory.locator('.pf-everyday-controls').scrollIntoViewIfNeeded();
  await p.evaluate(()=>{const action=document.querySelector('.pf-view-nearby-map'),failure=document.createElement('div');failure.style.paddingTop='800px';document.querySelector('.pf-everyday').append(failure);failure.append(action)});
  const broken=await entryGeometry(p);assert.throws(()=>assertEntry(broken),/separated|outside/,'gate accepted restored separated-action failure');
  await p.evaluate(()=>document.querySelector('.pf-view-nearby-map').remove());const missing=await entryGeometry(p);assert.throws(()=>assertEntry(missing),/missing/,'gate accepted original missing handoff');
  results.push({width,height,entry,working,recentered:true,preservedRent:true,falsifierRejected:true});
 }else{
  assert.equal(await p.locator('.pf-view-nearby-map').isVisible(),false,'redundant desktop handoff');assert.equal(await p.locator('.pf-nearby-map-return').isVisible(),false,'redundant desktop return');assert.ok(entry.map.top>=entry.toolbar.bottom-2&&entry.map.bottom<=height,`sticky desktop map lost at ${width}: ${JSON.stringify(entry)}`);assert.equal(await p.locator('.pf-decision-rail').evaluate(e=>getComputedStyle(e).overflowY),'visible');results.push({width,height,entry,stickyMap:true});
 }
 assert.deepEqual(errors,[]);await context.close();
}
if(phase!=='before')for(const [width,height] of[[801,900],[1280,720]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),p=await context.newPage();await p.route('https://atlas.nonarkara.org/api/location/evidence?**',route=>route.fulfill({status:503,body:'Unavailable'}));await p.goto(url,{timeout:120000});await p.getByRole('region',{name:'Everyday places'}).getByText(/mapped candidates within 800 m/).waitFor();await p.locator('.pf-nearby [role=status]').filter({hasText:/unavailable/i}).waitFor();await p.getByRole('checkbox',{name:'On map',exact:true}).check();await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
 const measure=()=>p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height}};const pin=rect('.pf-pin-home');return{map:rect('.pf-map-canvas'),toolbar:rect('.pf-header'),pin,viewportHeight:innerHeight,pinOwnsPaint:!!document.elementFromPoint(25,(pin.top+pin.bottom)/2)?.closest('.pf-pin-home'),footerInRail:!!document.querySelector('.pf-footer').closest('.pf-decision-rail'),footerCount:document.querySelectorAll('.pf-footer').length}});
 const assertOperating=m=>{assert.ok(m.map.top>=m.toolbar.bottom-2&&m.map.bottom<=m.viewportHeight,'short-source map displaced');assert.ok(m.pin.top>=m.toolbar.bottom&&m.pin.bottom<=m.map.bottom&&m.pinOwnsPaint,'pin control obscured')};
 const working=await measure();assertOperating(working);assert.equal(working.footerInRail,true);assert.equal(working.footerCount,1);await p.screenshot({path:`${out}/${phase}-short-source-${width}.png`,timeout:60000});
 await p.evaluate(()=>{document.querySelector('#place-fit').append(document.querySelector('.pf-footer'));scrollTo(0,document.documentElement.scrollHeight)});const originalFooter=await measure();assert.throws(()=>assertOperating(originalFooter),/displaced|obscured/,'gate accepted original global footer displacing the map');results.push({width,height,state:'short-source-footer',working,originalFooter,falsifierRejected:true});await context.close();
}
if(phase!=='before'){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await context.newPage();
 await p.goto(url,{timeout:120000});await p.locator('#pf-place-name').waitFor();const directory=p.getByRole('region',{name:'Everyday places'});await directory.getByText(/mapped candidates within 800 m/).waitFor();
 await p.getByRole('button',{name:'Pin home at +',exact:true}).click();await p.getByLabel('Space name',{exact:true}).fill('Saved home');await p.getByRole('button',{name:'Save named space',exact:true}).click();await p.locator('#pf-place-name').filter({hasText:'Saved home'}).waitFor();await directory.getByText(/mapped candidates? within 800 m/).waitFor();
 await directory.getByRole('checkbox',{name:'On map',exact:true}).check();await p.addStyleTag({content:'#place-fit{font-size:30px!important}'});await p.evaluate(()=>document.fonts.ready);const view=directory.getByRole('link',{name:'View map ↑',exact:true});await view.focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.activeElement.id==='pf-place-map');
 const measure=()=>p.evaluate(()=>{const back=document.querySelector('.pf-nearby-map-return a').getBoundingClientRect(),map=document.querySelector('.pf-map-canvas').getBoundingClientRect(),header=document.querySelector('.pf-header').getBoundingClientRect();return{back:{top:back.top,bottom:back.bottom,height:back.height},map:{top:map.top,bottom:map.bottom,height:map.height},toolbar:{bottom:header.bottom,height:header.height},height:innerHeight,width:document.documentElement.scrollWidth}});
 const assertReturn=m=>{assert.ok(m.back.top>=m.toolbar.bottom&&m.back.bottom<=m.height,'enlarged saved-home return outside first screen');assert.ok(m.map.height>=240);assert.equal(m.width,390)};
 const working=await measure();assertReturn(working);assert.match(await p.locator('.pf-map-note').innerText(),/A \/ B \/ C/);assert.match(await p.locator('.pf-nearby-map-return').innerText(),/OSM snapshot/);await p.screenshot({path:`${out}/${phase}-saved-home-30px-390.png`,timeout:60000});
 await p.evaluate(()=>{const caption=document.querySelector('.pf-nearby-map-return');document.querySelector('.pf-map-note').append(caption)});const originalOrder=await measure();assert.throws(()=>assertReturn(originalOrder),/outside first screen/,'gate accepted generic guidance pushing the return below the fold');results.push({width:390,height:844,state:'saved-home-30px',working,originalOrder,falsifierRejected:true});await context.close();
}
await writeFile(`${out}/${phase}-geometry.json`,JSON.stringify({url,results},null,2)+'\n');console.log(JSON.stringify(results));
}finally{await browser.close()}
