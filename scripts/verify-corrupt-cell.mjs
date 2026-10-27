// Proves the checksum guard: a corrupted everyday-place cell must make coverage
// unknown, never a plausible partial count.
//
//   PILOT_URL=https://bangkok-ioc.pages.dev/places node scripts/verify-corrupt-cell.mjs
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const js=ts.transpileModule(readFileSync(new URL('../apps/web/src/places/everyday.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {readEverydayCell}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const manifest=JSON.parse(readFileSync(new URL('../public/data/places/everyday/manifest.json',import.meta.url)));
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH??'/Users/nonarkara/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-gpu']});
const results=[];
try{
  for(const mode of['same-length','truncated']){
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const p=await context.newPage();
    let corrupted=0;
    // Corrupt only the bounded cell payloads, never the manifest.
    await p.route('**/data/places/everyday/*-*.json',async route=>{
      const response=await route.fetch();
      const body=await response.body();
      corrupted++;
      if(mode==='same-length'){
        // Same byte count, different content: the size check passes and the hash must catch it.
        const copy=Buffer.from(body.toString('utf8').replace(/("kind":"[a-z_]*)([a-z])"/,(_all,prefix,last)=>prefix+(last==='z'?'y':'z')+'"'));
        assert.equal(copy.length,body.length,'tamper must keep the byte length');
        assert.notDeepEqual(copy,body,'tamper must change actual bytes');
        const parsed=JSON.parse(copy.toString('utf8'));
        assert.doesNotThrow(()=>readEverydayCell(parsed,parsed.cell,manifest),'tampered JSON must remain schema-valid without checksum verification');
        return route.fulfill({response,body:copy});
      }
      // Short body: the size check must catch it before parsing.
      return route.fulfill({response,body:body.subarray(0,Math.max(1,body.length-20))});
    });
    await p.goto(process.env.PILOT_URL??'http://127.0.0.1:4174/places',{timeout:120000});
    await p.locator('#pf-place-name').waitFor();
    const status=p.locator('.pf-everyday p[role="status"]');
    await status.filter({hasText:/Coverage is unknown/}).waitFor({timeout:60000});
    const text=(await status.textContent()??"").trim();
    const body=await p.locator('.pf-everyday').innerText();
    const claimsCount=/\d+ mapped (?:[\w &]+ )?candidates? within 800 m/.test(body);
    assert.ok(corrupted>0,`${mode}: no cell was intercepted, so nothing was tested`);
    assert.ok(/unknown/i.test(text),`${mode}: coverage was not marked unknown, got: ${text}`);
    assert.ok(!claimsCount,`${mode}: a candidate count was still published despite corrupt data`);
    results.push({mode,cellsCorrupted:corrupted,status:text,publishedCount:claimsCount});
    await context.close();
  }
}finally{await browser.close();}
console.log(JSON.stringify(results,null,2));
console.log('CORRUPTION PASS: corrupt cells make coverage unknown and publish no count.');
