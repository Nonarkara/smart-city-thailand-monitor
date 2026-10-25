export type CatalogPoint={id:string;name:string;category:string;lat:number;lng:number;distanceM:number;source_url:string|null;source_dataset:string;ingested_at:string};
export function catalogPoints(rows:unknown,center:{lat:number;lng:number},now=Date.now()):CatalogPoint[]{
 if(!Array.isArray(rows)||![center.lat,center.lng].every(Number.isFinite))return [];
 const seen=new Set<string>(),rad=Math.PI/180;
 return rows.slice(0,200).flatMap((v:unknown)=>{
  if(!v||typeof v!=="object")return [];const p=v as Record<string,unknown>;
  if(typeof p.id!=="string"||!p.id||seen.has(p.id)||typeof p.name!=="string"||!p.name.trim()||p.name.length>300||typeof p.lat!=="number"||typeof p.lng!=="number"||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180)return [];
  const a=Math.sin((p.lat-center.lat)*rad/2)**2+Math.cos(center.lat*rad)*Math.cos(p.lat*rad)*Math.sin((p.lng-center.lng)*rad/2)**2;
  const distance=6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));if(distance>800)return [];
  let source:string|null=null;try{const u=new URL(String(p.source_url));if(["https:","http:"].includes(u.protocol)&&!u.username&&!u.password)source=u.href;}catch{}
  const time=typeof p.ingested_at==="string"?Date.parse(p.ingested_at):NaN;
  seen.add(p.id);return [{id:p.id,name:p.name.trim(),lat:p.lat,lng:p.lng,category:typeof p.category==="string"?p.category.slice(0,100):"Unclassified",source_dataset:typeof p.source_dataset==="string"?p.source_dataset.slice(0,100):"Unknown catalog",source_url:source,ingested_at:Number.isFinite(time)&&time<=now?p.ingested_at as string:"",distanceM:Math.round(distance)}];
 });
}
