import type { Place, Preferences, Quote } from "./placeFit";
import type { Purpose, Scenario, Comparable } from "./economics";
import { catalogPoints, type CatalogPoint } from "./catalog";
import type {Premises} from "./premises";

type RecordValue = Record<string, unknown>;
const record = (v: unknown): v is RecordValue => v !== null && typeof v === "object" && !Array.isArray(v);
const number = (v: unknown, max = 1e12): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
const text = (v: unknown, max = 2000): v is string => typeof v === "string" && v.length <= max;
const ownKey = (key: string) => key.length <= 200 && !["__proto__", "prototype", "constructor"].includes(key);
export const defaultPreferences: Preferences = { budget: 20000, travel: "rail", destination: "", departure: "09:00", maxCommute: 45, interests: [] };
const interestNames = ["Food", "Markets", "Heritage", "Independent shops", "Everyday errands", "Space"];
export function safeSource(v: unknown): string | null {
  if (!text(v, 2048)) return null;
  try { const u = new URL(v); return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export function sourceTime(v: unknown, now = Date.now()): string | null {
  if (!text(v, 60) || !/^\d{4}-\d{2}-\d{2}T/.test(v)) return null;
  const t = Date.parse(v); return day(v.slice(0, 10)) && /(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(t) && t <= now + 60000 ? v : null;
}
const day = (v: unknown): v is string => {
  if (!text(v, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z"); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const position = (lat: unknown, lng: unknown): boolean => typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && lat >= 13.45 && lat <= 14.1 && lng >= 100.3 && lng <= 100.95;
const scenarioNumbers = ["rent", "size", "fixed", "ownerPay", "margin", "receipt", "days", "salesLow", "salesBase", "salesHigh", "fitout", "recoveryMonths", "workingCapital", "targetSurplus", "acquisition", "initialCosts", "vacancy", "annualOperating", "annualDebt", "annualIncomeTax", "targetYield"] as const;
export type SavedState = { prefs: Preferences; quotes: Record<string, Quote>; purpose: Purpose; scenarios: Record<string, Scenario>; comparables: Record<string, Comparable[]>; shortlist: string[]; showCatalog: boolean; premises: Premises[]; premisesSelection:string[]; comparisonMode:"areas"|"premises"; activePremisesId?:string };
export function readSaved(raw: string | null): { state: SavedState; recovered: boolean } {
  const state: SavedState = { prefs: { ...defaultPreferences, interests: [] }, quotes: {}, purpose: "live", scenarios: {}, comparables: {}, shortlist: [], showCatalog: true, premises: [], premisesSelection:[], comparisonMode:"areas" };
  if (raw === null) return { state, recovered: false };
  let input: unknown;
  try { if (raw.length > 2_000_000) throw Error(); input = JSON.parse(raw); } catch { return { state, recovered: true }; }
  if (!record(input)) return { state, recovered: true };
  let recovered = false;
  const reject = () => { recovered = true; };
  if ("prefs" in input) {
    if (!record(input.prefs)) { state.prefs.budget = 0; reject(); }
    else {
      const p = input.prefs;
      for (const key of ["budget", "maxCommute"] as const) if (key in p) { if (number(p[key], key === "budget" ? 1e12 : 1440) && p[key] > 0) state.prefs[key] = p[key]; else { state.prefs[key] = 0; reject(); } }
      if ("travel" in p) { if (typeof p.travel === "string" && ["rail", "car", "either"].includes(p.travel)) state.prefs.travel = p.travel as Preferences["travel"]; else { state.prefs.budget = 0; reject(); } }
      if ("destination" in p) { if (text(p.destination, 500)) state.prefs.destination = p.destination; else { state.prefs.budget = 0; reject(); } }
      if ("departure" in p) { if (text(p.departure, 5) && /^([01]\d|2[0-3]):[0-5]\d$/.test(p.departure)) state.prefs.departure = p.departure; else { state.prefs.departure = ""; state.prefs.budget = 0; reject(); } }
      if ("interests" in p) { if (Array.isArray(p.interests) && p.interests.every(x => typeof x === "string" && interestNames.includes(x))) state.prefs.interests = [...new Set(p.interests)]; else reject(); }
    }
  }
  if ("purpose" in input) { if (typeof input.purpose === "string" && ["live", "business", "industrial", "invest"].includes(input.purpose)) state.purpose = input.purpose as Purpose; else reject(); }
  if ("showCatalog" in input) { if (typeof input.showCatalog === "boolean") state.showCatalog = input.showCatalog; else reject(); }
  if ("shortlist" in input) { if (Array.isArray(input.shortlist) && input.shortlist.every(x => typeof x === "string" && /^[a-z0-9-]{1,80}$/.test(x))) state.shortlist = [...new Set(input.shortlist)].slice(0, 3); else reject(); }
  function entries(value: unknown): [string, RecordValue][] {
    if (!record(value)) { reject(); return []; }
    const rows = Object.entries(value); if (rows.length > 100) reject();
    return rows.slice(0, 100).flatMap(([k, v]) => { if (!ownKey(k) || !record(v)) { reject(); return []; } return [[k, v]]; });
  }
  if ("quotes" in input) for (const [id, q] of entries(input.quotes)) {
    const out: Quote = {};
    for (const key of ["rent", "extras", "commute"] as const) if (key in q) { if (number(q[key], key === "commute" ? 1440 : 1e12)) out[key] = q[key]; else reject(); }
    if ("access" in q) { if (typeof q.access === "string" && ["walk", "car", "unknown"].includes(q.access)) out.access = q.access as Quote["access"]; else reject(); }
    for (const key of ["note", "commuteFor", "commuteAt", "commuteTravel"] as const) if (key in q) { if (text(q[key], key === "note" ? 10000 : 500)) out[key] = q[key]; else reject(); }
    if ("lat" in q || "lng" in q) { if (position(q.lat, q.lng)) { out.lat = q.lat as number; out.lng = q.lng as number; } else { out.access = "unknown"; delete out.commute; reject(); } }
    state.quotes[id] = out;
  }
  if ("scenarios" in input) for (const [id, s] of entries(input.scenarios)) {
    const out: Scenario = {};
    for (const key of scenarioNumbers) if (key in s) { if (number(s[key])) out[key] = s[key]; else reject(); }
    for (const key of ["activity", "checkedNote"] as const) if (key in s) { if (text(s[key], 10000)) out[key] = s[key]; else reject(); }
    for (const key of ["permitted", "access"] as const) if (key in s) { if (typeof s[key] === "string" && ["unknown", "yes", "no"].includes(s[key])) out[key] = s[key] as Scenario["permitted"]; else reject(); }
    state.scenarios[id] = out;
  }
  if ("comparables" in input) {
    if (!record(input.comparables)) reject();
    else for (const [id, rows] of Object.entries(input.comparables).slice(0, 100)) {
      if (!ownKey(id) || !Array.isArray(rows)) { reject(); continue; }
      if (rows.length > 30) reject();
      state.comparables[id] = rows.slice(0, 30).flatMap((r: unknown) => {
        if (!record(r) || !safeSource(r.url) || !day(r.observed) || !number(r.rent) || !number(r.size) || typeof r.matched !== "boolean" || !(typeof r.kind === "string" && ["asking", "quoted", "agreed"].includes(r.kind))) { reject(); return []; }
        return [{ url: safeSource(r.url)!, observed: r.observed, rent: r.rent, size: r.size, matched: r.matched, kind: r.kind as Comparable["kind"] }];
      });
    }
  }
  if ("premises" in input) {
    if (!Array.isArray(input.premises)) reject();
    else {
      const seen = new Set<string>(); if (input.premises.length > 20) reject();
      for (const row of input.premises.slice(0,20)) {
        if (!record(row) || !text(row.id,100) || !/^space-[a-z0-9-]{8,80}$/.test(row.id) || seen.has(row.id) || !text(row.label,120) || !row.label.trim() || typeof row.purpose!=="string" || !["live","business","industrial","invest"].includes(row.purpose) || !text(row.guideId,80) || !/^[a-z0-9-]+$/.test(row.guideId) || !ownKey(row.guideId) || !sourceTime(row.savedAt) || !record(row.quote) || !position(row.quote.lat,row.quote.lng) || !record(row.scenario) || !Array.isArray(row.comparables)) { reject(); continue; }
        if (row.quoteObservedAt!==undefined && (!day(row.quoteObservedAt) || Date.parse(row.quoteObservedAt+"T00:00:00+07:00")>Date.now()) || row.quoteSource!==undefined && !safeSource(row.quoteSource)) { reject(); continue; }
        const nested=readSaved(JSON.stringify({quotes:{candidate:row.quote},scenarios:{candidate:row.scenario},comparables:{candidate:row.comparables}}));
        if(nested.recovered){reject();continue;}
        seen.add(row.id);
        state.premises.push({id:row.id,label:row.label.trim(),purpose:row.purpose as Purpose,guideId:row.guideId,savedAt:row.savedAt as string,quote:nested.state.quotes.candidate,scenario:nested.state.scenarios.candidate,comparables:nested.state.comparables.candidate,...(row.quoteObservedAt?{quoteObservedAt:row.quoteObservedAt as string}:{}),...(row.quoteSource?{quoteSource:safeSource(row.quoteSource)!}:{})});
      }
    }
  }
  if("premisesSelection" in input){if(Array.isArray(input.premisesSelection)&&input.premisesSelection.every(x=>typeof x==="string")){state.premisesSelection=[...new Set(input.premisesSelection)].filter(id=>state.premises.some(r=>r.id===id)).slice(0,3);}else reject();}
  if("comparisonMode" in input){if(input.comparisonMode==="areas"||input.comparisonMode==="premises")state.comparisonMode=input.comparisonMode;else reject();}
  if("activePremisesId" in input){if(typeof input.activePremisesId==="string"&&state.premises.some(r=>r.id===input.activePremisesId))state.activePremisesId=input.activePremisesId;else reject();}
  return { state, recovered };
}
export function parsePremises(input:unknown):Premises {
  const result=readSaved(JSON.stringify({premises:[input]}));
  if(result.recovered||result.state.premises.length!==1)throw Error("Check the space name, pin, quote date/source and entered values before saving.");
  return result.state.premises[0];
}
export function serializeSaved(state:SavedState):string {
  const raw=JSON.stringify(state);
  if(raw.length>2_000_000)throw Error("Saved workspace exceeds browser limits. Export your entries before leaving.");
  return raw;
}
export function readGuide(input: unknown): Place[] {
  if (!record(input) || input.version !== 1 || !Array.isArray(input.places) || input.places.length < 1 || input.places.length > 100) throw Error("Place guide format unavailable.");
  const seen = new Set<string>();
  return input.places.map((v: unknown) => {
    if (!record(v) || !text(v.id, 80) || !/^[a-z0-9-]+$/.test(v.id) || seen.has(v.id) || !position(v.lat, v.lng)) throw Error("Place guide format unavailable.");
    for (const k of ["name", "thai", "station", "line", "character", "tradeoff", "visit"] as const) if (!text(v[k]) || !v[k].trim()) throw Error("Place guide format unavailable.");
    if (!day(v.checkedAt) || !safeSource(v.source) || !safeSource(v.rentUrl) || !Array.isArray(v.interests) || !v.interests.every(x => typeof x === "string" && interestNames.includes(x)) || !Array.isArray(v.discover) || v.discover.length > 20) throw Error("Place guide format unavailable.");
    const discover = v.discover.map((d: unknown) => { if (!record(d) || !text(d.name, 200) || !safeSource(d.url)) throw Error("Place guide format unavailable."); return { name: d.name, url: safeSource(d.url)! }; });
    seen.add(v.id);
    return { ...Object.fromEntries(["id", "name", "thai", "lat", "lng", "station", "line", "character", "tradeoff", "visit", "checkedAt"].map(k => [k, v[k]])), interests: v.interests, discover, source: safeSource(v.source)!, rentUrl: safeSource(v.rentUrl)! } as Place;
  });
}
export type Evidence = { fetchedAt: string; complaints: { status: "available" | "stale" | "unavailable"; fetchedAt: string | null; value: null | { recent: number; openAllTime: number; categories: { name: string; count: number }[]; attribution: { text: string; url: string } } }; civic: { status: "reference" | "unavailable"; count: number | null; places: CatalogPoint[]; limits: string } };
export function readEvidence(input: unknown, center: { lat: number; lng: number }, now = Date.now()): Evidence {
  if (!record(input) || input.version !== 1 || !record(input.query) || !number(input.query.lat, 90) || !number(input.query.lng, 180) || Math.abs(input.query.lat - center.lat) > 0.00001 || Math.abs(input.query.lng - center.lng) > 0.00001 || input.query.radiusM !== 800 || !sourceTime(input.fetchedAt, now)) throw Error("Evidence format or location unavailable.");
  if (!record(input.complaints) || !record(input.civic)) throw Error("Evidence format unavailable.");
  const c = input.complaints, v = record(c.value) ? c.value : null, civic = input.civic;
  const integer = (x: unknown): x is number => number(x, 1e9) && Number.isInteger(x);
  const validComplaints = typeof c.status === "string" && ["available", "stale"].includes(c.status) && sourceTime(c.fetchedAt, now) && v && integer(v.recent) && integer(v.openAllTime) && Array.isArray(v.categories) && v.categories.length <= 100 && v.categories.every(x => record(x) && text(x.name, 200) && integer(x.count)) && record(v.attribution) && text(v.attribution.text, 500) && safeSource(v.attribution.url);
  const validCivic = civic.status === "reference" && integer(civic.count) && Array.isArray(civic.places) && civic.places.length <= 200 && civic.count >= civic.places.length;
  return { fetchedAt: input.fetchedAt as string, complaints: validComplaints ? { status: c.status as "available" | "stale", fetchedAt: c.fetchedAt as string, value: { recent: v!.recent as number, openAllTime: v!.openAllTime as number, categories: v!.categories as { name: string; count: number }[], attribution: { text: (v!.attribution as RecordValue).text as string, url: safeSource((v!.attribution as RecordValue).url)! } } } : { status: "unavailable", fetchedAt: null, value: null }, civic: validCivic ? { status: "reference", count: civic.count as number, places: catalogPoints(civic.places, center, now), limits: text(civic.limits) ? civic.limits : "Catalog coverage and access unverified." } : { status: "unavailable", count: null, places: [], limits: "Catalog unavailable." } };
}
export async function fetchJson(url: string, signal: AbortSignal, timeoutMs = 12000, expected?: {bytes:number;sha256:string}): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort(); signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw Error(response.status === 429 ? "The evidence service is busy. Try again shortly." : "Source unavailable. Your entered comparison still works.");
    if (!response.body) throw Error("Source response unavailable.");
    const reader = response.body.getReader(), decoder = new TextDecoder(); let body = "", bytes = 0; const chunks:Uint8Array[] = [];
    try { while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > (expected?.bytes ?? 2_000_000)) { await reader.cancel(); throw Error("Source response exceeds the supported size."); } if (expected) chunks.push(value); body += decoder.decode(value, { stream: true }); } body += decoder.decode(); } finally { reader.releaseLock(); }
    if (expected && bytes !== expected.bytes) throw Error("Source response size differs from its manifest.");
    if (expected) {
      const data = new Uint8Array(bytes); let offset = 0;
      for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), x=>x.toString(16).padStart(2,"0")).join("");
      if (digest !== expected.sha256) throw Error("Source response checksum differs from its manifest.");
    }
    return JSON.parse(body);
  } catch (error) { if (timedOut) throw Error("Source took too long. Your entered comparison still works."); throw error; }
  finally { clearTimeout(timer); signal.removeEventListener("abort", abort); }
}
export type MarketSnapshot = {publisher:string;publisherDate:string;retrievedAt:string;coverage:string;rentByBed:Record<string,{median:number;p25:number;p75:number;n:number}>};
export function readMarket(input: unknown, now = Date.now()): MarketSnapshot {
  if (!record(input) || input.publisher !== "PropertySights" || !day(input.publisherDate) || Date.parse(input.publisherDate + "T00:00:00+07:00") > now || !day(input.retrievedAt) || Date.parse(input.retrievedAt + "T00:00:00+07:00") > now || !text(input.coverage, 2000) || !record(input.rentByBed)) throw Error("Publisher format unavailable.");
  const rows = Object.entries(input.rentByBed);
  if (!rows.length || rows.length > 10 || !Object.hasOwn(input.rentByBed, "1")) throw Error("Publisher format unavailable.");
  const rentByBed: MarketSnapshot["rentByBed"] = {};
  for (const [bed, r] of rows) {
    if (!/^[0-9]$/.test(bed) || !record(r) || !number(r.n, 1e9) || !Number.isInteger(r.n) || !number(r.p25) || r.p25 <= 0 || !number(r.median) || !number(r.p75) || r.p25 > r.median || r.median > r.p75) throw Error("Publisher format unavailable.");
    rentByBed[bed] = {n:r.n,p25:r.p25,median:r.median,p75:r.p75};
  }
  return {publisher:input.publisher,publisherDate:input.publisherDate,retrievedAt:input.retrievedAt,coverage:input.coverage,rentByBed};
}
