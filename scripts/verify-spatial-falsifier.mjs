// Falsifier for the spatial gate's desktop reading-cost budget.
//
// A gate that has only ever passed proves nothing. This deliberately inflates the
// decision column at each width and proves the budget in verify-spatial-browser.mjs
// actually rejects the growth. Run it after changing a budget:
//   PILOT_URL=https://bangkok-ioc.pages.dev/places node scripts/verify-spatial-falsifier.mjs
//
// It never writes to the app and never persists: the spacer is injected into the live
// DOM of a throwaway browser context and discarded with the page.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH??'/Users/nonarkara/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

// Same budgets the gate enforces, and the amount of growth each must catch.
const EDITOR_BUDGET={390:1650,1024:1600,1440:1500};
const SAVE_BUDGET={390:450,1024:480,1440:450};
const REGRESSION=400;

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-gpu']});
const results=[];
try{
  for(const width of[390,1024,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
    const p=await context.newPage();
    await p.goto(process.env.PILOT_URL??'http://127.0.0.1:4174/places',{timeout:120000});
    await p.locator('#pf-place-name').waitFor();
    await p.evaluate(()=>document.fonts.ready);
    await p.getByLabel('Purpose',{exact:true}).selectOption('business');
    await p.evaluate(()=>scrollTo(0,0));

    const real=await p.evaluate(()=>document.querySelector('.pf-space-check').getBoundingClientRect().height);
    assert.ok(real<EDITOR_BUDGET[width],`${width}: real editor ${Math.round(real)}px already exceeds ${EDITOR_BUDGET[width]}px`);

    // Simulate the regression the budget exists to catch: the column grows.
    await p.evaluate(h=>{const e=document.querySelector('.pf-space-check');const s=document.createElement('div');s.style.height=`${h}px`;s.setAttribute('data-falsifier','');e.appendChild(s);},REGRESSION);
    const inflated=await p.evaluate(()=>document.querySelector('.pf-space-check').getBoundingClientRect().height);
    const caught=inflated>=EDITOR_BUDGET[width];
    assert.ok(caught,`${width}: budget failed to catch a ${REGRESSION}px editor regression (${Math.round(inflated)}px vs ${EDITOR_BUDGET[width]}px)`);

    // The save-form budget must catch growth too, at every width.
    const saveReal=await p.evaluate(()=>document.querySelector('.pf-premises-save').getBoundingClientRect().height);
    assert.ok(saveReal<SAVE_BUDGET[width],`${width}: real save form ${Math.round(saveReal)}px already exceeds ${SAVE_BUDGET[width]}px`);
    await p.evaluate(h=>{const e=document.querySelector('.pf-premises-save');const s=document.createElement('div');s.style.height=`${h}px`;s.setAttribute('data-falsifier','');e.appendChild(s);},REGRESSION);
    const saveInflated=await p.evaluate(()=>document.querySelector('.pf-premises-save').getBoundingClientRect().height);
    const saveCaught=saveInflated>=SAVE_BUDGET[width];
    assert.ok(saveCaught,`${width}: save budget failed to catch a ${REGRESSION}px regression (${Math.round(saveInflated)}px vs ${SAVE_BUDGET[width]}px)`);

    results.push({width,editorReal:Math.round(real),editorBudget:EDITOR_BUDGET[width],editorInflated:Math.round(inflated),editorBudgetCatches:caught,saveReal:Math.round(saveReal),saveBudget:SAVE_BUDGET[width],saveInflated:Math.round(saveInflated),saveBudgetCatches:saveCaught});
    await context.close();
  }
}finally{await browser.close();}
console.log(JSON.stringify(results,null,2));
console.log('FALSIFIER PASS: every budget accepts the real layout and rejects an injected regression at every width.');
