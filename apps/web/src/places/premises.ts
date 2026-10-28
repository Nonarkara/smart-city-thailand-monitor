import {assess,type Preferences,type Quote} from "./placeFit";
import {economicsReport,type Purpose,type Scenario,type Comparable} from "./economics";

export const PREMISES_LIMIT=20;
function newId(){const engine=globalThis.crypto;if(typeof engine?.randomUUID==="function")return `space-${engine.randomUUID()}`;if(!engine?.getRandomValues)throw Error("This browser cannot create private spaces. Use a browser with secure local storage support.");return `space-${Array.from(engine.getRandomValues(new Uint8Array(16))).map(n=>n.toString(16).padStart(2,"0")).join("")}`;}
export type Premises={
  id:string; label:string; purpose:Purpose; guideId:string; savedAt:string;
  quote:Quote; scenario:Scenario; comparables:Comparable[];
  quoteObservedAt?:string; quoteSource?:string;
};
export type PremisesDraft=Omit<Premises,"id"|"savedAt">;
export function samePremisesContext(a:Pick<Premises,"purpose"|"guideId"|"quote">,b:Pick<Premises,"purpose"|"guideId"|"quote">){
  return a.purpose===b.purpose&&a.guideId===b.guideId&&a.quote.lat===b.quote.lat&&a.quote.lng===b.quote.lng;
}
export function snapshotPremises(draft:PremisesDraft,id=newId(),now=new Date().toISOString()):Premises{
  return {...draft,id,savedAt:now,label:draft.label.trim(),quote:{...draft.quote},scenario:{...draft.scenario},comparables:draft.comparables.map(r=>({...r}))};
}
export function savePremises(records:Premises[],next:Premises):Premises[]{
  const existing=records.find(r=>r.id===next.id);
  if(existing&&!samePremisesContext(existing,next))throw Error("The pin, area or purpose changed. Save this as a new space.");
  if(!existing&&records.length>=PREMISES_LIMIT)throw Error(`You have ${PREMISES_LIMIT} saved spaces. Export a report and remove one before adding another.`);
  return existing?records.map(r=>r.id===next.id?snapshotPremises(next,next.id,next.savedAt):r):[...records,snapshotPremises(next,next.id,next.savedAt)];
}
export function selectedPremises(records:Premises[],ids:string[],purpose:Purpose){
  return [...new Set(ids)].flatMap(id=>{const record=records.find(r=>r.id===id&&r.purpose===purpose);return record?[record]:[]}).slice(0,3);
}
export function togglePremises(ids:string[],id:string){
  if(ids.includes(id))return ids.filter(x=>x!==id);
  if(ids.length>=3)throw Error("Three spaces selected. Remove one before adding another.");
  return [...ids,id];
}
export function premisesGroups(records:Premises[]){
  const groups=new Map<string,{lat:number;lng:number;records:{record:Premises;letter:string}[]}>();
  records.slice(0,3).forEach((record,i)=>{
    const {lat,lng}=record.quote;
    if(typeof lat!=="number"||typeof lng!=="number"||!Number.isFinite(lat)||!Number.isFinite(lng))return;
    const key=`${lat},${lng}`,group=groups.get(key)??{lat,lng,records:[]};
    group.records.push({record,letter:String.fromCharCode(65+i)});groups.set(key,group);
  });
  return [...groups.values()];
}
export function premisesReport(records:Premises[],prefs:Preferences){
  return `BANGKOK, FOR YOU — private premises comparison\nExported ${new Date().toISOString()}\nNames, pins, quotes and checks are your entries, not verified offers. Station-area context is not a premises survey. No proven demand or property-level risk conclusion.\n\n${records.map((r,i)=>{
    const provenance=`Quote observed: ${r.quoteObservedAt||"not provided"}\nQuote source: ${r.quoteSource||"not provided / offline evidence"}\nLast saved: ${r.savedAt} (save time, not observation time)`;
    const details=r.purpose==="live"?(()=>{const f=assess(prefs,r.quote);return `Monthly ceiling: ${prefs.budget}; destination: ${prefs.destination||"not entered"}; travel: ${prefs.travel}; departure: ${prefs.departure||"not entered"}\n${f.status}\nMonthly costs entered: ${f.total??"unknown"}\n${[...f.reasons,...f.missing].join("\n")}\nYour quote/checks: ${JSON.stringify(r.quote)}`})():economicsReport(r.purpose,r.scenario);
    return `${String.fromCharCode(65+i)}. ${r.label}\nPurpose: ${r.purpose}; station-guide context: ${r.guideId}\nUser pin: ${r.quote.lat},${r.quote.lng}\n${provenance}\n${details}\nComparable evidence: ${JSON.stringify(r.comparables)}\nMap: https://www.google.com/maps/search/?api=1&query=${r.quote.lat},${r.quote.lng}\n`;
  }).join("\n")}\nConfirm actual lease terms, usable area, access, availability, environmental conditions and local demand before deciding.\n`;
}
export function editPremises(records:Premises[],id:string,patch:Partial<Pick<Premises,"label"|"quote"|"scenario"|"comparables"|"quoteObservedAt"|"quoteSource">>,now=new Date().toISOString()){
  const current=records.find(r=>r.id===id);if(!current)throw Error("Saved space unavailable.");
  const next=snapshotPremises({...current,...patch},id,now);
  if(!samePremisesContext(current,next))throw Error("Use Move saved pin to change this space's location.");
  return records.map(r=>r.id===id?next:r);
}
export function relocatePremises(record:Premises,lat:number,lng:number,now=new Date().toISOString()):Premises{
  return snapshotPremises({...record,quote:{...record.quote,lat,lng,access:"unknown",commute:undefined,commuteFor:undefined,commuteTravel:undefined,commuteAt:undefined},scenario:{...record.scenario,permitted:"unknown",access:"unknown",checkedNote:""},quoteObservedAt:undefined,quoteSource:undefined,comparables:[]},record.id,now);
}
export function duplicatePremises(record:Premises,id=newId(),now=new Date().toISOString()):Premises{
  const copy=relocatePremises(record,record.quote.lat!,record.quote.lng!,now);
  return snapshotPremises({...copy,label:`${record.label.slice(0,110)} (copy)`,quote:{...copy.quote,note:""},comparables:[]},id,now);
}
