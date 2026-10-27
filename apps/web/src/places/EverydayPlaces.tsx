import {useEffect,useState} from "react";
import {fetchJson} from "./boundaries";
import {everydayCategories,everydayCells,readEverydayManifest,readEverydayCell,nearbyEveryday,type EverydayCategory} from "./everyday";
export function useEveryday(center:{lat:number;lng:number}){
 const [result,setResult]=useState<{key:string;status:string;points:ReturnType<typeof nearbyEveryday>;sourceAsOf:string}>({key:"",status:"Loading mapped everyday places…",points:[],sourceAsOf:""});
 const key=`${center.lat}:${center.lng}`;
 useEffect(()=>{const controller=new AbortController(),cells=everydayCells(center);
 setResult({key,status:cells?"Loading mapped everyday places…":"Outside the everyday-place snapshot region. Coverage is unknown.",points:[],sourceAsOf:""});
 if(!cells)return()=>controller.abort();
 const base=`${import.meta.env.BASE_URL}data/places/everyday/`;
 (async()=>{const manifest=readEverydayManifest(await fetchJson(`${base}manifest.json`,controller.signal));
 const points=(await Promise.all(cells.filter(c=>manifest.files[c]).map(async cell=>readEverydayCell(await fetchJson(base+manifest.files[cell].file,controller.signal,12000,manifest.files[cell]),cell,manifest)))).flat();
 if(!controller.signal.aborted)setResult({key,status:"ready",points:nearbyEveryday(points,center),sourceAsOf:manifest.sourceAsOf});
 })().catch(()=>{if(!controller.signal.aborted)setResult({key,status:"Everyday-place snapshot unavailable or out of date. Coverage is unknown; your comparison still works.",points:[],sourceAsOf:""})});
 return()=>controller.abort();},[key]);
 return result.key===key?result:{key,status:"Loading mapped everyday places…",points:[],sourceAsOf:""};
}
export function EverydayPlaces({result,category,onCategory,mapped,onMapped,onViewMap}:{result:ReturnType<typeof useEveryday>;category:EverydayCategory;onCategory:(c:EverydayCategory)=>void;mapped:boolean;onMapped:(v:boolean)=>void;onViewMap:()=>void}){
 const [expanded,setExpanded]=useState(false);useEffect(()=>setExpanded(false),[category,result.key]);
 const points=result.points.filter(p=>p.category===category);
 return <section id="pf-everyday" tabIndex={-1} className="pf-everyday" aria-label="Everyday places">
 <h3>Everyday places to check</h3>
 {result.status!=="ready"?<p role="status">{result.status}</p>:<>
 <div className="pf-everyday-controls"><label>Find nearby <select aria-label="Everyday place category" value={category} onChange={e=>onCategory(e.target.value as EverydayCategory)}>{Object.entries(everydayCategories).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label><input type="checkbox" checked={mapped} aria-controls="pf-place-map" onChange={e=>onMapped(e.target.checked)}/>On map</label>{mapped&&<a className="pf-view-nearby-map" href="#pf-place-map" onClick={onViewMap}>View map ↑</a>}</div>
 <p>{points.length?`${points.length} mapped candidate${points.length===1?"":"s"} within 800 m.`:"No matching points in this snapshot. Nearby availability is unknown."}{mapped&&points.length>30?" Map shows the nearest 30.":""}</p>
 <ul className="pf-pois">{points.slice(0,expanded?points.length:5).map(p=><li key={p.id}><a href={`https://www.openstreetmap.org/node/${p.id}`} target="_blank" rel="noopener noreferrer">{p.name||`Unnamed ${p.kind.replaceAll("_"," ")}`} ↗</a><span>{p.kind.replaceAll("_"," ")} · ≈{p.distanceM} m straight-line</span><a aria-label={`Plan walking route to ${p.name||p.kind}`} href={`https://www.google.com/maps/dir/?api=1&origin=${result.key.replace(":",",")}&destination=${p.lat},${p.lng}&travelmode=walking`} target="_blank" rel="noopener noreferrer">Route ↗</a></li>)}</ul>
 {points.length>5&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"Show nearest 5":`Show all ${points.length} candidates`}</button>}
 <p className="pf-source"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> · snapshot {new Date(result.sourceAsOf).toLocaleDateString("en-GB",{timeZone:"Asia/Bangkok"})}. <a href={`${import.meta.env.BASE_URL}data/places/everyday/manifest.json`}>Source & downloadable data</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>.</p>
 <p className="pf-source">Node points only; buildings and mapped areas excluded. ≈10 m precision. Opening and access unverified. Routes are external estimates; check gates and crossings. {category==="education"?"Many schools omitted; admissions unknown. ":category==="green"?"Many parks omitted. ":category==="transit"?"Step-free access unknown. ":""}Counts do not establish quality or customer demand.</p>
 </>}
 </section>;
}
