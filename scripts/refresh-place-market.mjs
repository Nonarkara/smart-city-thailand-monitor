// Deliberate, repeatable publisher snapshot; retrieval never changes publisher age.
import {writeFile} from 'node:fs/promises';
const source='https://propertysights.com/api/statistics';
const res=await fetch(source,{signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error(`Publisher HTTP ${res.status}`);
const text=await res.text();if(text.length>2e6)throw Error('Publisher payload too large');const d=JSON.parse(text);
if(d.publisher!=='PropertySights'||!/^\d{4}-\d{2}-\d{2}$/.test(d.fetchedAt)||!Array.isArray(d.propertysights))throw Error('Unknown publisher contract');
const rentByBed=d.propertysights.at(-1)?.rentByBed;if(!rentByBed||!Object.values(rentByBed).every(r=>[r.median,r.p25,r.p75,r.n].every(Number.isFinite)&&r.p25>0&&r.p25<=r.median&&r.median<=r.p75&&Number.isInteger(r.n)&&r.n>=5))throw Error('Invalid rent distribution');
const out={publisher:d.publisher,methodology:'https://propertysights.com/data-methodology',licence:d.licence,publisherDate:d.fetchedAt,retrievedAt:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'}),source,coverage:'Publisher inventory across Bangkok; mostly condos, central and foreign-facing stock overrepresented. Not station-area or commercial comparables.',rentByBed};
await writeFile(new URL('../public/data/places/market.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(`Saved publisher snapshot ${out.publisherDate}; retrieved ${out.retrievedAt}`);
