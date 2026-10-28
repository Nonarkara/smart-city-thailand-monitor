import {auditDirectory} from './audit-output.mjs';
// Reproducible public release bytes; independent Atlas changes are observations, not IOC failures.
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const exec=promisify(execFile),root=new URL('../',import.meta.url),out=auditDirectory('../docs/revival-2026-10-27/nearby-handoff/',import.meta.url);
await mkdir(out,{recursive:true});
const origin=process.env.PILOT_ORIGIN??'https://bangkok-ioc.pages.dev';
const get=async url=>(await exec('curl',['--fail','--location','--silent','--show-error','--retry','1','--max-time','45',url],{encoding:'buffer',maxBuffer:3_000_000})).stdout;
const digest=b=>createHash('sha256').update(b).digest('hex');
async function observeEntries(){return Promise.all([['legacy-ioc',origin+'/','this release preserves the legacy IOC proxy'],['atlas','https://atlas.nonarkara.org/','independent project; may deploy separately']].map(async([name,url,scope])=>{const b=await get(url);return{name,url,scope,observedAt:new Date().toISOString(),bytes:b.length,sha256:digest(b)}}))}
if(process.env.RECORD_BEFORE==='1'){
 await writeFile(new URL('entry-before.json',out),JSON.stringify(await observeEntries(),null,2)+'\n');console.log('Recorded timestamped entry observations.');
}else{
 const dist=new URL('apps/web/dist/',root),manifest=JSON.parse(await readFile(new URL('data/places/everyday/manifest.json',dist),'utf8'));
 const paths=(await readdir(new URL('assets/',dist))).filter(f=>/\.(css|js)$/.test(f)).map(f=>'assets/'+f);
 paths.push('data/places/everyday/manifest.json',...Object.values(manifest.files).map(f=>'data/places/everyday/'+f.file));
 const matched=[];let next=0;
 await Promise.all(Array.from({length:6},async()=>{while(next<paths.length){const path=paths[next++],local=await readFile(new URL(path,dist)),remote=await get(origin+'/'+path);assert.ok(remote.equals(local),`${path} differs from tested build`);matched.push({path,bytes:remote.length,sha256:digest(remote)})}}));
 const entries=await observeEntries(),before=JSON.parse(await readFile(new URL('entry-before.json',out),'utf8'));
 assert.equal(entries.find(e=>e.name==='legacy-ioc').sha256,before.find(e=>e.name==='legacy-ioc').sha256,'legacy IOC changed during this release');
 const atlasBefore=before.find(e=>e.name==='atlas'),atlasAfter=entries.find(e=>e.name==='atlas');
 const report={observedAt:new Date().toISOString(),origin,sourceCommit:process.env.RELEASE_COMMIT??null,deployment:process.env.DEPLOYMENT_ID??null,matched:matched.sort((a,b)=>a.path.localeCompare(b.path)),entries,legacyIocUnchangedDuringRelease:true,atlasObservation:{sameBytesBetweenSamples:atlasBefore.sha256===atlasAfter.sha256,note:'These two samples do not assert an ongoing Atlas invariant. IOC does not deploy Atlas.'}};
 await writeFile(new URL('live-bytes.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({matched:matched.length,legacyIocUnchangedDuringRelease:true,atlasObservation:report.atlasObservation}));
}
