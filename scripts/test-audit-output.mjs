import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {auditDirectory,auditPath} from './audit-output.mjs';

for (const trailingSlash of [false,true]) test(`audit directory retains reports with trailing slash=${trailingSlash}`,async()=>{
 const root=await mkdtemp(join(tmpdir(),'ioc-audit-'));
 try {
  const directory=join(root,'release #1 100%');
  const base=pathToFileURL(join(root,'runner.mjs'));
  const input=directory+(trailingSlash?'/':'');
  const url=auditDirectory('unused',base,input);
  await mkdir(url,{recursive:true});
  await writeFile(join(root,'report.json'),'previous audit');
  await writeFile(new URL('report.json',url),'current audit');
  await writeFile(join(auditPath('unused',base,input),'capture.png'),'capture');
  assert.equal(await readFile(join(directory,'report.json'),'utf8'),'current audit');
  assert.equal(await readFile(join(directory,'capture.png'),'utf8'),'capture');
  assert.equal(await readFile(join(root,'report.json'),'utf8'),'previous audit');
 } finally {await rm(root,{recursive:true,force:true});}
});
test('relative paths resolve beside the runner, independent of process cwd',()=>{
 const base=pathToFileURL('/tmp/project/scripts/runner.mjs');
 assert.equal(fileURLToPath(auditDirectory('../docs/default',base,null)),
  '/tmp/project/docs/default/');
 assert.equal(auditPath('unused',base,'../docs/new audit'),'/tmp/project/docs/new audit/');
});
