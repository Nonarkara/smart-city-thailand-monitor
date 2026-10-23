import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH??'/Users/nonarkara/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PILOT_URL??'http://127.0.0.1:4173/places';
const out=new URL('../docs/revival-2026-10-23/verification/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-gpu','--disable-dev-shm-usage','--renderer-process-limit=2'],timeout:120000});
const results=[];
try{
 for(const width of [390,799,801,1024,1440]){
  const height=width===390?844:900;const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(30000);
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});await page.locator('#pf-place-name').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.getByText('Reported problems',{exact:true}).waitFor();
  // Wait for actual tiles, without treating tile availability as data correctness.
  await page.locator('.leaflet-tile-loaded').first().waitFor({timeout:30000}).catch(()=>{});
  const geometry=await page.evaluate(()=>{const r=s=>{const b=document.querySelector(s)?.getBoundingClientRect();return b?{x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom,right:b.right}:null;};const primary=document.querySelector('.pf-primary'),p=primary.getBoundingClientRect(),hit=document.elementFromPoint(p.x+p.width/2,p.y+p.height/2);return {width:innerWidth,height:innerHeight,bodyWidth:document.body.scrollWidth,chrome:r('.pf-header').bottom,primary:r('.pf-primary'),primaryHit:primary===hit||primary.contains(hit),map:r('.pf-map-wrap'),note:r('.pf-map-note'),homeControl:r('.pf-pin-home'),zoom:r('.leaflet-control-zoom'),attribution:r('.leaflet-control-attribution')};});
  assert.ok(geometry.chrome<=64,`toolbar too tall ${width}: ${geometry.chrome}`);assert.ok(geometry.bodyWidth<=width,`page overflow ${width}`);assert.ok(geometry.primary.bottom<=height,`primary below first screen ${width}`);assert.ok(geometry.primaryHit,`primary covered ${width}`);
  const overlap=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
  assert.ok(!overlap(geometry.note,geometry.homeControl),`map note covers home control ${width}`);assert.ok(!overlap(geometry.note,geometry.attribution),`map note covers attribution ${width}`);assert.ok(!overlap(geometry.note,geometry.zoom),`map note covers zoom ${width}`);
  if([390,1024,1440].includes(width))await page.screenshot({path:new URL(`explore-${width}.png`,out).pathname});
  results.push({...geometry,pass:true});console.log(`layout ${width}: pass`);
  if(width===390){
   await page.locator('summary[aria-label="Budget & journey"]').click();await page.getByLabel('Work, school or regular destination',{exact:true}).fill('Silom');await page.locator('summary[aria-label="Budget & journey"]').click();
   await page.getByRole('button',{name:'Pin home at +',exact:true}).click();await page.getByRole('heading',{name:'Evidence around your home pin',exact:true}).waitFor();await page.getByText('Home pin selected.',{exact:false}).waitFor();
   await page.getByRole('button',{name:'Shortlist this area',exact:true}).click();await page.getByLabel('Quoted rent / month',{exact:true}).fill('15000');await page.getByLabel('Monthly extras',{exact:true}).fill('2000');await page.getByRole('combobox',{name:'Home-to-station access',exact:true}).selectOption('walk');await page.getByLabel('Journey minutes you checked',{exact:true}).fill('20');
   await page.getByRole('heading',{name:'Meets your entered limits',exact:true}).waitFor();
   await page.getByRole('button',{name:'Compare (1/3)',exact:true}).click();await page.getByRole('heading',{name:'Your Bangkok shortlist',exact:true}).waitFor();assert.ok(await page.locator('summary[aria-label="Budget & journey"]').isVisible(),'comparison retains settings');const settings=page.locator('summary[aria-label="Budget & journey"]');await settings.focus();await settings.press('Enter');assert.ok(await page.getByLabel('Monthly ceiling',{exact:true}).isVisible(),'keyboard opens comparison settings');await settings.press('Enter');assert.ok(await page.locator('.pf-table-wrap').evaluate(e=>e.scrollWidth<=e.clientWidth),'single-area comparison fits');
   const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save personal report',exact:true}).click();const file=await download;await file.saveAs(new URL('test-personal-report.txt',out).pathname);
   const {readFile}=await import('node:fs/promises');const report=await readFile(new URL('test-personal-report.txt',out),'utf8');assert.match(report,/Station access: walk/);assert.match(report,/Silom at 09:00/);assert.match(report,/Journey limit: 45/);assert.match(report,/Home pin: 13\./);
   const mapLine=report.split('\n').find(l=>l.startsWith('Map:'));const pinLine=report.split('\n').find(l=>l.startsWith('Home pin:'));const coords=pinLine.replace('Home pin: ','').replace(', ', ',');assert.ok(mapLine.includes(coords),'report map must use home pin');
   await page.locator('summary[aria-label="Budget & journey"]').click();await page.getByLabel('Work, school or regular destination',{exact:true}).fill('Airport');await page.locator('summary[aria-label="Budget & journey"]').click();await page.getByText('Not checked for this destination and travel mode',{exact:true}).waitFor();assert.equal(await page.getByText('Meets your entered limits',{exact:true}).count(),0);
   await page.getByRole('button',{name:'Explore',exact:true}).click();await page.getByRole('combobox',{name:'Area',exact:true}).selectOption('bang-na');await page.getByRole('button',{name:'Shortlist this area',exact:true}).click();await page.getByRole('combobox',{name:'Area',exact:true}).selectOption('on-nut');await page.getByRole('button',{name:'Shortlist this area',exact:true}).click();await page.getByRole('button',{name:'Compare (3/3)',exact:true}).click();await page.screenshot({path:new URL('compare-390.png',out).pathname});
   assert.ok(await page.locator('.pf-table-wrap').evaluate(e=>e.scrollWidth>e.clientWidth),'comparison intentionally scrolls');assert.ok(await page.getByText('Swipe across to compare all selected areas. Row labels stay in place.',{exact:true}).isVisible());assert.ok(await page.evaluate(()=>document.body.scrollWidth<=innerWidth));
   await page.getByRole('button',{name:'Explore',exact:true}).click();await page.getByRole('button',{name:'Clear saved notes',exact:true}).click();await page.getByRole('link',{name:'Bangkok, for you',exact:true}).click();
   await page.locator('summary[aria-label="Budget & journey"]').click();await page.screenshot({path:new URL('preferences-390.png',out).pathname});assert.ok(await page.locator('.pf-more-content').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}),'settings panel fits viewport');await page.getByLabel('Monthly ceiling',{exact:true}).fill('20000');await page.getByLabel('Getting around',{exact:true}).selectOption('rail');assert.ok(await page.evaluate(()=>document.body.scrollWidth<=innerWidth));await page.locator('summary[aria-label="Budget & journey"]').click();
   await page.addStyleTag({content:'#place-fit{font-size:30px!important} #place-fit h1{font-size:72px!important} #place-fit h2{font-size:44px!important}'});await page.screenshot({path:new URL('large-text-390.png',out).pathname,fullPage:true});assert.ok(await page.evaluate(()=>document.body.scrollWidth<=innerWidth),'large text page overflow');assert.ok(await page.evaluate(()=>{const a=document.querySelector('.pf-map-note').getBoundingClientRect(),b=document.querySelector('.pf-pin-home').getBoundingClientRect();return !(a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y)}),'enlarged instructions cover home control');console.log('home pin, limits, changed destination, report, three-way comparison, preferences, enlarged text: pass');
  }
  await context.close();
 }
 await writeFile(new URL('geometry-final.json',out),JSON.stringify(results,null,2));
}finally{await browser.close();}
