export const everydayCategories = {groceries:"Groceries",food:"Food & cafés",markets:"Markets",health:"Health",fitness:"Fitness",culture:"Museums & galleries"} as const;
export type EverydayCategory=keyof typeof everydayCategories;
export type EverydayPoint={id:string;name:string;category:EverydayCategory;kind:string;lat:number;lng:number;editedAt:string};
export type EverydayManifest={version:1;sourceAsOf:string;files:Record<string,{file:string;count:number;bytes:number;sha256:string}>};
const asObject=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Everyday-place format unavailable.");return v as Record<string,unknown>};
const time=(v:unknown)=>{if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v))return NaN;const t=Date.parse(v);return Number.isFinite(t)&&new Date(t).toISOString()===v.replace("Z",".000Z")?t:NaN;};
export function readEverydayManifest(input:unknown,now=Date.now()):EverydayManifest{
 const v=asObject(input),stamp=time(v.sourceAsOf);
 if(v.version!==1||!Number.isFinite(stamp)||stamp>now||now-stamp>30*86400000||v.licence!=="ODbL-1.0"||v.crs!=="EPSG:4326"||v.precisionDecimals!==4||v.cellDegrees!==0.05||JSON.stringify(v.bounds)!==JSON.stringify([100.3,13.45,100.95,14.1]))throw Error("Everyday-place snapshot unavailable or older than 30 days.");
 const entries=Object.entries(asObject(v.files));if(entries.length<1||entries.length>300)throw Error("Everyday-place index unavailable.");
 const files:EverydayManifest["files"]={};
 for(const [key,value] of entries){const f=asObject(value);if(!/^\d{3}-\d{4}$/.test(key)||typeof f.sha256!=="string"||!/^([a-f0-9]{64})$/.test(f.sha256)||f.file!==`${key}-${f.sha256.slice(0,12)}.json`||!Number.isInteger(f.count)||Number(f.count)<1||Number(f.count)>5000||!Number.isInteger(f.bytes)||Number(f.bytes)<1||Number(f.bytes)>500000)throw Error("Everyday-place index unavailable.");files[key]={file:f.file as string,count:Number(f.count),bytes:Number(f.bytes),sha256:f.sha256};}
 return{version:1,sourceAsOf:v.sourceAsOf as string,files};
}
export function everydayCells(center:{lat:number;lng:number}):string[]|null{
 if(!Number.isFinite(center.lat)||!Number.isFinite(center.lng)||center.lat<13.45||center.lat>14.1||center.lng<100.3||center.lng>100.95)return null;
 const cells=[];for(let y=Math.floor((center.lat-.01)*20);y<=Math.floor((center.lat+.01)*20);y++)for(let x=Math.floor((center.lng-.01)*20);x<=Math.floor((center.lng+.01)*20);x++)cells.push(`${y}-${x}`);return cells;
}
export function readEverydayCell(input:unknown,key:string,manifest:EverydayManifest):EverydayPoint[]{
 const v=asObject(input),contract=manifest.files[key];
 if(!contract||v.version!==1||v.cell!==key||v.sourceAsOf!==manifest.sourceAsOf||!Array.isArray(v.places)||v.places.length!==contract.count)throw Error("Everyday-place cell unavailable.");
 const seen=new Set<string>();return v.places.map(raw=>{const p=asObject(raw),edited=time(p.editedAt);
 if(typeof p.id!=="string"||!/^\d{1,16}$/.test(p.id)||seen.has(p.id)||typeof p.name!=="string"||p.name.length>200||typeof p.kind!=="string"||!/^\w{1,40}$/.test(p.kind)||typeof p.category!=="string"||!Object.hasOwn(everydayCategories,p.category)||typeof p.lat!=="number"||typeof p.lng!=="number"||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||`${Math.floor(p.lat*20)}-${Math.floor(p.lng*20)}`!==key||!Number.isFinite(edited)||edited>Date.parse(manifest.sourceAsOf))throw Error("Everyday-place record unavailable.");
 seen.add(p.id);return{id:p.id,name:p.name,kind:p.kind,category:p.category as EverydayCategory,lat:p.lat,lng:p.lng,editedAt:p.editedAt as string};});
}
export function nearbyEveryday(points:EverydayPoint[],center:{lat:number;lng:number}){
 const r=Math.PI/180;return points.map(p=>{const a=Math.sin((p.lat-center.lat)*r/2)**2+Math.cos(p.lat*r)*Math.cos(center.lat*r)*Math.sin((p.lng-center.lng)*r/2)**2;return{...p,distanceM:Math.round(6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a))))}}).filter(p=>p.distanceM<=800).sort((a,b)=>a.distanceM-b.distanceM||a.id.localeCompare(b.id));
}
