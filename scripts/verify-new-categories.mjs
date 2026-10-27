// Live check for the sourced-candidate increment: the new categories must render real
// manifest-backed candidates with a route-planning link, and a category with nothing
// nearby must say so honestly instead of showing an empty or invented list.
//
//   PILOT_URL=https://bangkok-ioc.pages.dev/places node scripts/verify-new-categories.mjs
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH??'/Users/nonarkara/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

// Bang Na is the station area where all four new categories have candidates within 800 m.
const AREA='bang-na';
const CATEGORIES=['education','green','transit','culture'];

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-gpu']});
const results=[];
try{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const p=await context.newPage();
  await p.goto(process.env.PILOT_URL??'http://127.0.0.1:4174/places',{timeout:120000});
  await p.locator('#pf-place-name').waitFor();
  const section=p.locator('.pf-everyday');
  await section.locator('h3').waitFor({timeout:60000});

  // A category with nothing nearby must be honest, not empty-looking.
  await p.getByLabel('Everyday place category').selectOption('education');
  await p.waitForTimeout(600);
  const beforeArea=(await section.innerText()).trim();
  const emptyState=/No matching points in this snapshot\. Nearby availability is unknown\./.test(beforeArea);
  assert.ok(emptyState,`before the area change, the empty state was not stated plainly:\n${beforeArea.slice(0,300)}`);

  await p.getByLabel('Area',{exact:true}).selectOption(AREA);
  await p.waitForTimeout(1200);
  for(const category of CATEGORIES){
    await p.getByLabel('Everyday place category').selectOption(category);
    await p.waitForTimeout(700);
    const text=(await section.innerText()).trim();
    const rows=await section.locator('.pf-pois li').count();
    const countLine=(await section.locator('p').filter({hasText:/candidates within 800 m/}).first().textContent().catch(()=>null))?.trim()??null;
    assert.ok(rows>0,`${category} at ${AREA}: no candidates rendered`);
    assert.ok(countLine&&/candidates within 800 m/.test(countLine),`${category} at ${AREA}: no manifest-backed count line`);
    // The route link must carry the current pin as origin and the candidate as destination.
    const route=await section.locator('.pf-pois li a[aria-label^="Plan walking route"]').first().getAttribute('href');
    assert.ok(route.includes('travelmode=walking'),`${category}: route link is not a walking route`);
    const m=/destination=([-\d.]+),([-\d.]+)/.exec(route);
    assert.ok(m,`${category}: route destination is not a coordinate`);
    const origin=/origin=([-\d.]+),([-\d.]+)/.exec(route);
    assert.ok(origin,`${category}: route link has no origin`);
    // The row must name the candidate and link back to its OSM source.
    const sourceHref=await section.locator('.pf-pois li a[target="_blank"]').first().getAttribute('href');
    assert.ok(sourceHref&&sourceHref.includes('openstreetmap.org/node/'),`${category}: row has no OSM source link`);
    results.push({category,rows,count:countLine,routeOrigin:`${origin[1]},${origin[2]}`,routeDestination:`${m[1]},${m[2]}`});
  }
  await context.close();
}finally{await browser.close();}
console.log(JSON.stringify(results,null,2));
console.log('CATEGORY PASS: every new category renders manifest-backed candidates with a walking route link, and empty areas say so plainly.');
