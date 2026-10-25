import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  amount,
  assess,
  interestMatches,
  readShared,
  type Place,
  type Preferences,
  type Quote,
} from "./placeFit";
import "./places.css";
import {catalogPoints,type CatalogPoint} from "./catalog";
import {purposes,readPurpose,economicsReport,type Purpose,type Scenario,type Comparable} from "./economics";
import {EconomicsSummary,EconomicsEditor,MarketContext,EconomicComparison} from "./EconomicsPanel";
import {readSaved,readGuide,readEvidence,fetchJson,type Evidence} from "./boundaries";
const BASE = import.meta.env.BASE_URL;
const interests = [
  "Food",
  "Markets",
  "Heritage",
  "Independent shops",
  "Everyday errands",
  "Space",
];
const money = (n: number) => `฿${Math.round(n).toLocaleString()}`;
const date = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      })
    : "Time unavailable";
const maps = (p: Place) =>
  `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
function loadSaved() {
  try { return { ...readSaved(localStorage.getItem("bkk-place-fit-v1")), storageUnavailable: false }; }
  catch { return { ...readSaved(null), storageUnavailable: true }; }
}
function PlaceMap({
  places,
  selected,
  onSelect,
  home,
  onPin,
  purpose,
  catalog,
}: {
  places: Place[];
  selected: string;
  onSelect: (id: string) => void;
  home: Quote;
  purpose: Purpose;
  catalog: CatalogPoint[];
  onPin: (lat: number, lng: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    markers = useRef<L.Marker[]>([]);
  const select = useRef(onSelect);
  select.current = onSelect;
  const [failed, setFailed] = useState(false);
  const homeLayers = useRef<L.Layer[]>([]);
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, {
      scrollWheelZoom: false,
      zoomControl: false,
    }).setView([13.736, 100.557], 11);
    map.current = m;
    L.control.zoom({ position: "bottomleft" }).addTo(m);
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
    ).addTo(m);
    tiles.on("tileerror", () => setFailed(true));
    tiles.on("tileload", () => setFailed(false));
    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(el.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((x) => x.remove());
    markers.current = places.map((p, i) =>
      L.marker([p.lat, p.lng], {
        title: p.name,
        alt: `Select ${p.name}`,
        icon: L.divIcon({
          className: `pf-pin ${p.id === selected ? "pf-pin-active" : ""}`,
          html: `<span>${i + 1}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })
        .addTo(m)
        .on("click", () => select.current(p.id)),
    );
    const p = places.find((x) => x.id === selected);
    if (p) m.setView([p.lat - 0.008, p.lng], 13, { animate: false });
  }, [places, selected]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    homeLayers.current.forEach((x) => x.remove());
    homeLayers.current = [];
    if (home.lat !== undefined && home.lng !== undefined) {
      homeLayers.current = [
        L.circle([home.lat, home.lng], {
          radius: 800,
          color: "#20201d",
          weight: 1,
          fillOpacity: 0.04,
        }).addTo(m),
        L.circleMarker([home.lat, home.lng], {
          radius: 8,
          color: "#20201d",
          weight: 2,
          fillColor: "#f59e0b",
          fillOpacity: 1,
        }).addTo(m),
      ];
      m.panTo([home.lat, home.lng], { animate: false });
    }
  }, [home.lat, home.lng, selected]);
  useEffect(()=>{
    const m=map.current;if(!m)return;
    const pane=m.getPane("catalog")??m.createPane("catalog");pane.style.zIndex="625";
    const layer=L.layerGroup().addTo(m);
    catalog.forEach(p=>{
      const content=document.createElement("div");
      const title=document.createElement("strong");title.textContent=p.name;content.append(title);
      const info=document.createElement("p");info.textContent=`${p.category} · ${p.distanceM} m straight-line. Catalog: ${p.source_dataset}. Ingested ${date(p.ingested_at)}. Observation date, opening and public access are unverified.`;content.append(info);
      if(p.source_url){const link=document.createElement("a");link.href=p.source_url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Catalog source ↗";content.append(link);}
      const hit=L.circleMarker([p.lat,p.lng],{pane:"catalog",radius:12,stroke:false,fillOpacity:0,className:"pf-catalog-hit"}).addTo(layer).bindPopup(content,{maxWidth:260});
      L.circleMarker([p.lat,p.lng],{pane:"catalog",radius:5,color:"#575951",weight:1,fillColor:"#fff",fillOpacity:1,interactive:false,className:"pf-catalog-dot"}).addTo(layer);
      const element=hit.getElement();if(element){element.setAttribute("tabindex","0");element.setAttribute("role","button");element.setAttribute("aria-label",`Catalog place: ${p.name}`);element.addEventListener("keydown",e=>{const event=e as KeyboardEvent;if(event.key==="Enter"||event.key===" "){event.preventDefault();hit.openPopup();}});}
    });
    return ()=>{layer.remove()};
  },[catalog]);
  return (
    <div className="pf-map-wrap">
      <div className="pf-map-canvas">
      <div ref={el} className="pf-map" aria-label="Six Bangkok station areas" />
      <span className="pf-map-target" aria-hidden="true">
        +
      </span>
      <button
        className="pf-pin-home"
        onClick={() => {
          const p = map.current?.getCenter();
          if (p)
            onPin(
              Math.round(p.lat * 10000) / 10000,
              Math.round(p.lng * 10000) / 10000,
            );
        }}
      >
        {purpose==="live"?"Pin home at +":"Pin space at +"}
      </button>
      </div>
      {failed && (
        <p className="pf-map-error">
          Map tiles unavailable. All six places remain selectable above.
        </p>
      )}
      <span className="pf-map-note">
        Pan to a {purpose==="live"?"home":"space"}, then pin +. Numbers mark station areas.{catalog.length>0&&" Dots: catalog places; select for source."}
      </span>
    </div>
  );
}
export default function PlaceFitPage() {
  const [restored] = useState(loadSaved);
  const saved=restored.state;
  const [storageUnavailable,setStorageUnavailable]=useState(restored.storageUnavailable);
  const root=useRef<HTMLElement>(null),toolbar=useRef<HTMLElement>(null);
  const [showCatalog,setShowCatalog]=useState(saved.showCatalog!==false);
  const [places, setPlaces] = useState<Place[]>([]),
    [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState("ari");
  const [purpose,setPurpose]=useState<Purpose>(readPurpose(new URLSearchParams(location.search).get("purpose")??saved.purpose));
  const [scenarios,setScenarios]=useState<Record<string,Scenario>>(saved.scenarios??{});
  const [comparables,setComparables]=useState<Record<string,Comparable[]>>(saved.comparables??{});
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>(
    saved.quotes ?? {},
  );
  const [prefs, setPrefs] = useState<Preferences>({
    ...{
      budget: 20000,
      travel: "rail",
      destination: "",
      departure: "09:00",
      maxCommute: 45,
      interests: [],
    },
    ...saved.prefs,
  });
  const [evidence, setEvidence] = useState<Evidence | null>(null),
    [evidenceError, setEvidenceError] = useState(""),
    [busy, setBusy] = useState(false),
    [view, setView] = useState<"explore" | "compare">("explore"),
    [message, setMessage] = useState(restored.recovered?"Some saved entries could not be read. Valid entries were kept; recheck your limits and costs.":"");
  useEffect(() => {
    document.title = "Bangkok, for you · Place fit pilot";
    const controller=new AbortController();
    fetchJson(`${BASE}data/places/pilot.json`,controller.signal)
      .then(readGuide)
      .then((guides) => {
        if(controller.signal.aborted)return;
        setPlaces(guides);
        if(!guides.some(p=>p.id==="ari"))setSelected(guides[0].id);
        const d={places:guides};
        const shared = readShared(
          location.search,
          d.places.map((p: Place) => p.id),
        );
        setShortlist(
          shared.length
            ? shared
            : (saved.shortlist ?? [])
                .filter((x: string) => d.places.some((p: Place) => p.id === x))
                .slice(0, 3),
        );
        if (shared.length) {
          setSelected(shared[0]);
          setView("compare");
        }
      })
      .catch((e) => {if(!controller.signal.aborted)setLoadError(e instanceof SyntaxError?"Place guide format unavailable.":e.message);});
    return ()=>controller.abort();
  }, []);
  useEffect(() => {
    if(!places.length)return;
    try {
      localStorage.setItem(
        "bkk-place-fit-v1",
        JSON.stringify({ prefs, quotes, shortlist, purpose, scenarios, comparables,showCatalog }),
      );
      setStorageUnavailable(false);
    } catch { setStorageUnavailable(true); }
  }, [prefs, quotes, shortlist, purpose, scenarios, comparables,showCatalog,places]);
  useEffect(()=>{const bar=toolbar.current;if(!bar)return;const measure=()=>root.current?.style.setProperty("--pf-toolbar-height",`${bar.getBoundingClientRect().height}px`);measure();const observer=new ResizeObserver(measure);observer.observe(bar);return()=>observer.disconnect()},[places.length]);
  const place = places.find((p) => p.id === selected);
  const quote = quotes[selected] ?? {};
  const fit = assess(prefs, quote);
  const mappedPlaces=useMemo(()=>place?catalogPoints(evidence?.civic?.places,{lat:quote.lat??place.lat,lng:quote.lng??place.lng}):[],[evidence,quote.lat,quote.lng,place?.id]);
  const visiblePlaces=useMemo(()=>showCatalog?mappedPlaces:[],[showCatalog,mappedPlaces]);
  const spaceKey=(id:string)=>{const q=quotes[id]??{};return `${purpose}:${id}:${q.lat??"station"}:${q.lng??"station"}`};
  const scenarioKey=spaceKey(selected);
  const scenario=scenarios[scenarioKey]??{};
  const journeyCurrent =
    quote.commuteFor === prefs.destination.trim() &&
    quote.commuteTravel === prefs.travel &&
    quote.commuteAt === prefs.departure;
  useEffect(() => {
    if (!place) return;
    const controller = new AbortController();
    setEvidence(null);
    setEvidenceError("");
    setBusy(true);
    const center={lat:quote.lat??place.lat,lng:quote.lng??place.lng};
    fetchJson(`https://atlas.nonarkara.org/api/location/evidence?lat=${center.lat}&lng=${center.lng}`,controller.signal)
      .then(d=>readEvidence(d,center))
      .then(d=>{if(!controller.signal.aborted)setEvidence(d);})
      .catch((e) => {
        if (!controller.signal.aborted)
          setEvidenceError(
            e.message === "Failed to fetch"
              ? "Live evidence could not be reached. Your guide and comparison still work."
              : e instanceof SyntaxError?"Evidence format unavailable. Your entered comparison still works.":e.message,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [place?.id, quote.lat, quote.lng]);
  function toggle(id: string) {
    setShortlist((old) => {
      if (old.includes(id)) return old.filter((x) => x !== id);
      if (old.length === 3) {
        setMessage("Three places selected. Remove one before adding another.");
        return old;
      }
      setMessage("");
      return [...old, id];
    });
  }
  function patch(field: keyof Quote, value: unknown) {
    setQuotes((old) => ({
      ...old,
      [selected]: {
        ...old[selected],
        [field]: value,
        ...(field === "commute"
          ? {
              commuteFor: prefs.destination.trim(),
              commuteTravel: prefs.travel,
              commuteAt: prefs.departure,
            }
          : {}),
      },
    }));
  }
  function pin(lat: number, lng: number) {
    if (lat < 13.45 || lat > 14.1 || lng < 100.3 || lng > 100.95) {
      setMessage("Choose a point inside the Bangkok metro pilot area.");
      return;
    }
    setQuotes((old) => ({
      ...old,
      [selected]: {
        ...old[selected],
        lat,
        lng,
        access: "unknown",
        commute: undefined,
        commuteFor: undefined,
      },
    }));
    setMessage(
      purpose==="live"?"Home pin placed. Nearby evidence now checks this location. Recheck access and journey.":"Space pin placed. This location has a separate scenario; check the actual premises.",
    );
  }
  async function share() {
    const u = new URL(location.href);
    u.search = "";
    u.hash = "";
    u.searchParams.set("compare", shortlist.join(","));
    u.searchParams.set("purpose",purpose);
    try {
      await navigator.clipboard.writeText(u.href);
      setMessage(
        "Comparison link copied. Area and purpose are shared; personal values stay on this device.",
      );
    } catch {
      setMessage(`Copy this link: ${u.href}`);
    }
  }
  function exportReport() {
    const rows = shortlist.map((id) => {
      const p = places.find((x) => x.id === id)!;
      const q = quotes[id] ?? {},
        f = assess(prefs, q);
      if(purpose!=="live")return `${p.name} / ${p.thai}\nPin: ${q.lat??p.lat},${q.lng??p.lng}\n${economicsReport(purpose,scenarios[spaceKey(id)]??{})}\nComparable evidence: ${JSON.stringify(comparables[spaceKey(id)]??[])}\nMap: ${maps({...p,lat:q.lat??p.lat,lng:q.lng??p.lng})}\n`;
      return `${p.name} / ${p.thai}\n${p.character}\nTradeoff: ${p.tradeoff}\nMonthly costs entered: ${f.total === null ? "unknown" : money(f.total)}${q.extras === undefined ? " (extras not entered)" : ""}\nStation access: ${q.access ?? "not checked"}\nChecked journey: ${q.commute === undefined ? "not entered" : q.commute + " minutes"}; for ${q.commuteFor || "destination not recorded"} at ${q.commuteAt || "time not recorded"}; travel ${q.commuteTravel || "not recorded"}\nJourney limit: ${prefs.maxCommute} minutes\nHome pin: ${q.lat !== undefined ? q.lat + ", " + q.lng : "not set (station-area context)"}\n${f.status}\n${[...f.reasons, ...f.missing].join("\n")}\nVisit: ${p.visit}\nYour note: ${q.note ?? ""}\nListings: ${p.rentUrl}\nMap: ${maps({ ...p, lat: q.lat ?? p.lat, lng: q.lng ?? p.lng })}\n`;
    });
    const reportContext=purpose==="live"?`Monthly ceiling: ${money(prefs.budget)}. Travel: ${prefs.travel}. Destination: ${prefs.destination||"not entered"}.`:`Purpose: ${purposes[purpose]}. All scenario values are personal assumptions; local demand and agreed market rents are not verified.`;
    const text = `BANGKOK, FOR YOU — personal comparison\nSaved ${date(new Date().toISOString())}\n${reportContext}\nUser-entered quotes are not verified offers. Neighborhood context is desk research checked 23 Oct 2026. No property has been surveyed.\n\n${rows.join("\n")}\n${purpose==="live"?"Visit each home at your travel time. Confirm lease length, utilities, pet rules, actual access and availability.":"Check permitted use, lease terms, usable area, operating hours, access, utilities, actual demand and availability at each space."}\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    a.download = "bangkok-place-comparison.txt";
    a.click();
    URL.revokeObjectURL(a.href);
    setMessage(
      "Personal comparison saved. It includes your notes and entered costs.",
    );
  }
  if (loadError)
    return (
      <main id="place-fit">
        <h1>Place guide unavailable</h1>
        <p>{loadError}</p>
        <button onClick={()=>location.reload()}>Retry place guide</button>
        <a href={BASE}>Open the legacy dashboard</a>
      </main>
    );
  return (
    <main id="place-fit" ref={root}>
      <header className="pf-header" ref={toolbar}>
        <label className="pf-purpose"><span className="pf-sr-only">Purpose</span><select aria-label="Purpose" value={purpose} onChange={e=>setPurpose(e.target.value as Purpose)}>{Object.entries(purposes).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
        <a className="pf-brand" aria-label="Bangkok, for you" href={`${BASE}places`}>Bangkok<span>, for you</span></a>
        <nav className="pf-areas" aria-label="Choose an area">
            <label className="pf-mobile-area">
              <span className="pf-sr-only">Area</span>
              <select aria-label="Area" disabled={!places.length}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {places.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    {i + 1}. {p.name}
                  </option>
                ))}
              </select>
            </label>
        </nav>
        <div className="pf-view-controls">
        <button
          className={view === "explore" ? "pf-active" : ""}
          onClick={() => setView("explore")}
        >
          Explore
        </button>
        <button
          className={view === "compare" ? "pf-active" : ""}
          aria-label={`Compare (${shortlist.length}/3)`}
          disabled={!places.length}
          onClick={() => setView("compare")}
        >
          <span className="pf-compare-long">Compare ({shortlist.length}/3)</span><span className="pf-compare-short">Compare ({shortlist.length})</span>
        </button>
        </div>
        <details className="pf-more">
          <summary aria-label={purpose==="live"?"Budget & journey":"Map & sources"}><span className="pf-settings-word">{purpose==="live"?"Budget & journey":"Map & sources"}</span><span className="pf-settings-icon" aria-hidden="true">⋯</span></summary>
          <div className="pf-more-content">
            {purpose==="live"&&<>
        <label>
          Monthly ceiling{" "}
          <span className="pf-input-unit">
            ฿{" "}
            <input
              aria-label="Monthly ceiling"
              type="number"
              min="0"
              step="500"
              value={prefs.budget}
              onChange={(e) =>
                setPrefs({ ...prefs, budget: amount(e.target.value) ?? 0 })
              }
            />
          </span>
        </label>
        <label>
          Getting around
          <select aria-label="Getting around"
            value={prefs.travel}
            onChange={(e) =>
              setPrefs({
                ...prefs,
                travel: e.target.value as Preferences["travel"],
              })
            }
          >
            <option value="rail">Rail first, no car</option>
            <option value="car">I drive</option>
            <option value="either">Either works</option>
          </select>
        </label>

            <label>
              Work, school or regular destination
              <input
                value={prefs.destination}
                onChange={(e) =>
                  setPrefs({ ...prefs, destination: e.target.value })
                }
                placeholder="e.g. Silom"
              />
            </label>
            <label>
              Usual departure time
              <input
                type="time"
                value={prefs.departure ?? "09:00"}
                onChange={(e) =>
                  setPrefs({ ...prefs, departure: e.target.value })
                }
              />
            </label>
            <label>
              Maximum door-to-door minutes
              <input
                type="number"
                min="0"
                value={prefs.maxCommute}
                onChange={(e) =>
                  setPrefs({
                    ...prefs,
                    maxCommute: amount(e.target.value) ?? 0,
                  })
                }
              />
            </label>
            <fieldset>
              <legend>What matters nearby?</legend>
              {interests.map((i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={prefs.interests.includes(i)}
                    onChange={() =>
                      setPrefs({
                        ...prefs,
                        interests: prefs.interests.includes(i)
                          ? prefs.interests.filter((x) => x !== i)
                          : [...prefs.interests, i],
                      })
                    }
                  />
                  {i}
                </label>
              ))}
            </fieldset>
            </>}
            <label className="pf-check-inline"><input aria-label="Catalog places on map" type="checkbox" checked={showCatalog} onChange={e=>setShowCatalog(e.target.checked)}/>Catalog places on map ({busy?"loading":evidence?.civic.status==="unavailable"||!evidence?"unavailable":`${mappedPlaces.length} ${showCatalog?"shown":"available"}`})</label>
            {storageUnavailable&&<p role="status">Saving unavailable. Entries last for this session; save a personal report before leaving.</p>}
            <div className="pf-header-links">
              <span>Pilot · six areas</span>
              <a href="https://atlas.nonarkara.org">Atlas ↗</a>
              <a href={BASE}>Legacy IOC ↗</a>
            </div>
          </div>
        </details>
      </header>
      {!places.length&&<p role="status" className="pf-message">Loading place guide…</p>}
      {storageUnavailable&&<p role="status" className="pf-message pf-storage-message">Saving unavailable. This session still works. Save a personal report to keep your entries before leaving.</p>}
      {message && (
        <p role="status" className="pf-message">
          {message}
        </p>
      )}
      {view === "explore" ? (
        <>
          <div className="pf-workspace">
            <PlaceMap
              places={places}
              selected={selected}
              onSelect={setSelected}
              home={quote}
              onPin={pin}
              purpose={purpose}
              catalog={visiblePlaces}
            />
            {place && (
              <article className="pf-place" aria-labelledby="pf-place-name">
                <p className="pf-kicker">
                  {place.line} · {place.station}
                </p>
                <h1 id="pf-place-name">
                  {purpose!=="live"&&quote.lat!==undefined?"Pinned space":place.name}
                  {(purpose==="live"||quote.lat===undefined)&&<span lang="th">{place.thai}</span>}
                </h1>
                {purpose!=="live" ? <>
                  {quote.lat!==undefined&&<p className="pf-source">Your pin: {quote.lat}, {quote.lng}. {place.name} is the guide anchor, not a verified address.</p>}
                  <EconomicsSummary purpose={purpose} scenario={scenario}/>
                  {quote.lat!==undefined&&<button onClick={()=>setQuotes(old=>({...old,[selected]:{...old[selected],lat:undefined,lng:undefined,access:"unknown",commute:undefined}}))}>Use station area instead</button>}
                  <div className="pf-place-actions"><button className="pf-primary" aria-pressed={shortlist.includes(selected)} onClick={()=>toggle(selected)}>{shortlist.includes(selected)?"Remove from shortlist":"Shortlist this area"}</button></div>
                  <p className="pf-source">{purpose==="industrial"?"Station areas are navigation anchors, not an industrial suitability assessment. Check zoning, utilities and freight access at the actual premises.":"No demand or return is inferred from the station-area description."}</p>
                </> : <>
                <div className="pf-readiness">
                  <h3>Your limits</h3>
                  <p>
                    {fit.status}.{" "}
                    {fit.total !== null
                      ? `${money(fit.total)} / month entered.`
                      : "Monthly total not yet known."}
                  </p>
                  {[...fit.reasons, ...fit.missing].map((item) => <p className="pf-missing" key={item}>{item}</p>)}
                </div>

                <p>{place.character}</p>
                {interestMatches(place, prefs.interests).length > 0 && (
                  <p className="pf-match">
                    Explore for:{" "}
                    {interestMatches(place, prefs.interests).join(", ")}
                    <small>
                      Editorial context; individual businesses need checking.
                    </small>
                  </p>
                )}
                <div className="pf-tradeoff">
                  <h2>The tradeoff</h2>
                  <p>{place.tradeoff}</p>
                </div>
                <div className="pf-place-actions">
                  <button
                    className="pf-primary"
                    aria-pressed={shortlist.includes(selected)}
                    onClick={() => toggle(selected)}
                  >
                    {shortlist.includes(selected)
                      ? "Remove from shortlist"
                      : "Shortlist this area"}
                  </button>
                  <a href="#home-check">Check a home here ↓</a>
                </div>
                <h2>Start exploring</h2>
                {place.discover.map((d) => (
                  <a
                    className="pf-discover"
                    key={d.url}
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {d.name} ↗
                  </a>
                ))}
                <p className="pf-source">
                  Desk research · {date(place.checkedAt)}
                  <br />
                  <a href={place.source} target="_blank" rel="noreferrer">
                    BTS route reference ↗
                  </a>{" "}
                  ·{" "}
                  <a href={place.rentUrl} target="_blank" rel="noreferrer">
                    Browse asking rents ↗
                  </a>
                </p>
                </>}
              </article>
            )}
          </div>
          {place && purpose!=="live" && <EconomicsEditor key={scenarioKey} purpose={purpose} area={quote.lat!==undefined?"your pinned space":place.name} scenario={scenario} onChange={value=>setScenarios(old=>({...old,[scenarioKey]:value}))} comparables={comparables[scenarioKey]??[]} onComparables={value=>setComparables(old=>({...old,[scenarioKey]:value}))}/>}
          {place && (
            <section id="home-check" className={`pf-evidence ${purpose!=="live"?"pf-site-evidence":""}`}>
              {purpose==="live"&&<div className="pf-home">
                <h2>Would a home here work for you?</h2>
                <MarketContext/>
                <p>Use a real quote. These amounts stay on this device.</p>
                {quote.lat !== undefined ? (
                  <p>
                    Home pin selected.{" "}
                    <button
                      onClick={() => {
                        setQuotes((old) => ({
                          ...old,
                          [selected]: {
                            ...old[selected],
                            lat: undefined,
                            lng: undefined,
                            access: "unknown",
                            commute: undefined,
                          },
                        }));
                      }}
                    >
                      Use station area instead
                    </button>
                  </p>
                ) : (
                  <p>
                    Move the map to your home and use “Pin home at +” for
                    evidence at that location.
                  </p>
                )}
                <div className="pf-quote-fields">
                  <label>
                    Quoted rent / month
                    <input
                      type="number"
                      min="0"
                      placeholder="Not entered"
                      value={quote.rent ?? ""}
                      onChange={(e) => patch("rent", amount(e.target.value))}
                    />
                  </label>
                  <label>
                    Monthly extras
                    <input
                      type="number"
                      min="0"
                      placeholder="Utilities + transport…"
                      value={quote.extras ?? ""}
                      onChange={(e) => patch("extras", amount(e.target.value))}
                    />
                  </label>
                  <label>
                    Home-to-station access
                    <select
                      value={quote.access ?? "unknown"}
                      onChange={(e) => patch("access", e.target.value)}
                    >
                      <option value="unknown">Not checked</option>
                      <option value="walk">I checked the walking route</option>
                      <option value="car">Needs a car / feeder ride</option>
                    </select>
                  </label>
                  <label>
                    Journey minutes you checked
                    <input
                      type="number"
                      min="0"
                      placeholder="Door to door"
                      value={journeyCurrent ? (quote.commute ?? "") : ""}
                      onChange={(e) => patch("commute", amount(e.target.value))}
                    />
                  </label>
                </div>
                <label>
                  Home / listing and visit notes
                  <textarea
                    aria-label="Home / listing and visit notes"
                    rows={2}
                    maxLength={10000}
                    value={quote.note ?? ""}
                    onChange={(e) => patch("note", e.target.value)}
                    placeholder="Building, listing link, gate hours, questions…"
                  />
                </label>
                <div className="pf-fit-result">
                  <h3>{fit.status}</h3>
                  {fit.total !== null && (
                    <p>
                      {money(fit.total)} / month entered · {money(prefs.budget)}{" "}
                      ceiling
                    </p>
                  )}
                  {[...fit.reasons, ...fit.missing].map((x) => (
                    <p key={x}>{x}</p>
                  ))}
                </div>
                {prefs.destination && (
                  <p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${quote.lat ?? place.lat},${quote.lng ?? place.lng}&destination=${encodeURIComponent(prefs.destination)}&travelmode=${prefs.travel === "car" ? "driving" : "transit"}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Check journey to {prefs.destination} in Google Maps ↗
                    </a>
                  </p>
                )}
                <h3>Try this on your visit</h3>
                <p>{place.visit}</p>
                <a href={maps(place)} target="_blank" rel="noreferrer">
                  Open area in Google Maps ↗
                </a>
              </div>}
              <div className="pf-nearby">
                <h2>{quote.lat !== undefined ? `Evidence around your ${purpose==="live"?"home":"space"} pin` : "Evidence around this station area"}</h2>
                <p>
                  800 m straight-line radius around{" "}
                  {quote.lat !== undefined
                    ? `your ${purpose==="live"?"home":"space"} pin`
                    : "the station-area anchor"}
                  .{" "}
                  {quote.lat !== undefined
                    ? "The chosen point is sent to Atlas; your notes stay on this device."
                    : "Pin a space to check its own surroundings."}
                </p>
                {busy && (
                  <p role="status">
                    Reading the Atlas catalog and reported problems…
                  </p>
                )}
                {evidenceError && <p role="status">{evidenceError}</p>}
                {evidence && (
                  <>
                    <h3>Reported problems</h3>
                    {evidence.complaints.value ? (
                      <>
                        <p>
                          <strong>
                            {evidence.complaints.value.recent.toLocaleString()}
                          </strong>{" "}
                          reports in the last 12 months ·{" "}
                          {evidence.complaints.value.openAllTime.toLocaleString()}{" "}
                          open across all years.
                        </p>
                        <p>
                          {evidence.complaints.value.categories
                            .slice(0, 3)
                            .map(
                              (x) =>
                                `${({ ไฟฟ้า: "Electricity", ทางเท้า: "Pavements", ผิดกฎจราจร: "Traffic violations", อื่นๆ: "Other", อาคารสถานที่ชำรุด: "Damaged buildings", ถนน: "Roads", หาบเร่แผงลอย: "Street stalls", อุปกรณ์ชำรุด: "Damaged equipment", ความสะอาด: "Cleanliness", เสียง: "Noise", น้ำท่วม: "Flooding" } as Record<string, string>)[x.name] ?? x.name}: ${x.count}`,
                            )
                            .join(" · ")}
                        </p>
                        <p className="pf-source">
                          {evidence.complaints.status === "stale"
                            ? "Stale copy"
                            : "Retrieved"}{" "}
                          {date(evidence.complaints.fetchedAt)} ·{" "}
                          <a
                            href={evidence.complaints.value.attribution.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {evidence.complaints.value.attribution.text}
                          </a>
                        </p>
                      </>
                    ) : (
                      <p>
                        Complaint evidence unavailable. No conclusion about
                        local conditions.
                      </p>
                    )}
                    <p>
                      Reports reflect participation, not a safety rating. An
                      unreported street is unknown.
                    </p>
                    <h3>Civic places in the catalog</h3>
                    <p>
                      {evidence.civic.count === null
                        ? "Catalog unavailable."
                        : `${evidence.civic.count} mapped places. Schools, sports grounds, parking, museums and waterway places; not a complete directory.`}
                    </p>
                    <ul className="pf-pois">
                      {evidence.civic.places?.slice(0, 6).map((p) => (
                        <li key={p.id}>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {p.name} ↗
                          </a>
                          <span>
                            {(
                              {
                                sportsground: "Sports ground",
                                carpark: "Car park",
                                museum: "Museum",
                                school: "School",
                                waterway: "Waterway place",
                              } as Record<string, string>
                            )[p.category] ?? p.category}{" "}
                            · {p.distanceM} m straight-line
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="pf-source">
                      <a
                        href="https://atlas.nonarkara.org/api/civic-pois"
                        target="_blank"
                        rel="noreferrer"
                      >
                        BMA / data.go.th via Atlas
                      </a>{" "}
                      · read {date(evidence.fetchedAt)}. Source observation
                      dates, opening hours and public access are unverified.
                    </p>
                  </>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="pf-comparison">
          <div className="pf-comparison-heading">
            <div>
              <h1>Your Bangkok shortlist</h1>
              <p>Compare the same questions. Unknowns remain visible.</p>
            </div>
            <div>
              <button disabled={!shortlist.length} onClick={share}>
                Copy shared shortlist
              </button>
              <button disabled={!shortlist.length} onClick={exportReport}>
                Save personal report
              </button>
            </div>
          </div>
          {!shortlist.length ? (
            <p>
              Choose up to three areas from Explore, then add real home quotes
              to compare costs and access.
            </p>
          ) : purpose!=="live" ? <EconomicComparison purpose={purpose} places={places.filter(p=>shortlist.includes(p.id))} scenarios={scenarios} spaceKey={spaceKey} onEdit={id=>{setSelected(id);setView("explore");setTimeout(()=>document.getElementById("space-check")?.scrollIntoView(),50)}}/> : (
            <div data-count={shortlist.length} className="pf-comparison-data">
              <p id="pf-comparison-context">Home costs and access are your entries. Editorial context is not a property survey.</p>
            <div
              className="pf-table-wrap"
              tabIndex={0}
              role="region"
              aria-label="Scrollable place comparison"
            >
              <p className="pf-swipe">
                Swipe across to compare all selected areas. Row labels stay in
                place.
              </p>
              <table aria-describedby="pf-comparison-context">
                <thead>
                  <tr>
                    <th scope="col">Decision</th>
                    {shortlist.map((id) => (
                      <th scope="col" key={id}>
                        {places.find((x) => x.id === id)?.name}
                        <button
                          aria-label={`Remove ${places.find((x) => x.id === id)?.name}`}
                          onClick={() => toggle(id)}
                        >
                          Remove
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    "Daily life",
                    "Watch out",
                    "Monthly costs",
                    "Station access",
                    "Your journey",
                    "Your limits",
                    "Visit check",
                    "Your notes",
                    "Next step",
                  ].map((label) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {shortlist.map((id) => {
                        const p = places.find((x) => x.id === id)!,
                          q = quotes[id] ?? {},
                          f = assess(prefs, q);
                        return (
                          <td key={id}>
                            {label === "Daily life" ? (
                              p.character
                            ) : label === "Watch out" ? (
                              p.tradeoff
                            ) : label === "Monthly costs" ? (
                              <>
                                {f.total === null
                                  ? "No rent quote entered"
                                  : `${money(f.total)} / month entered`}
                                {q.extras === undefined && (
                                  <small>Extras not entered.</small>
                                )}
                              </>
                            ) : label === "Station access" ? (
                              q.access === "walk" ? (
                                "Walking route checked by you"
                              ) : q.access === "car" ? (
                                "Car / feeder ride needed"
                              ) : (
                                "Not checked"
                              )
                            ) : label === "Your journey" ? (
                              q.commute === undefined ||
                              q.commuteFor !== prefs.destination.trim() ||
                              q.commuteTravel !== prefs.travel ||
                              q.commuteAt !== prefs.departure ? (
                                "Not checked for this destination and travel mode"
                              ) : (
                                `${q.commute} minutes · your check for ${q.commuteFor}`
                              )
                            ) : label === "Your limits" ? (
                              <>
                                <strong>{f.status}</strong>
                                {[...f.reasons, ...f.missing].map((x) => (
                                  <small key={x}>{x}</small>
                                ))}
                              </>
                            ) : label === "Visit check" ? (
                              p.visit
                            ) : label === "Your notes" ? (
                              q.note || "No notes yet"
                            ) : (
                              <button
                                onClick={() => {
                                  setSelected(id);
                                  setView("explore");
                                  setTimeout(
                                    () =>
                                      document
                                        .getElementById("home-check")
                                        ?.scrollIntoView({
                                          behavior: "smooth",
                                        }),
                                    50,
                                  );
                                }}
                              >
                                Check a home in {p.name}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}
          <p className="pf-private">
            Shared links contain area names and purpose only. Your budget, quotes and notes
            stay in this browser. The saved report includes your entries.
          </p>
        </section>
      )}
      <footer className="pf-footer">
        <p>
          Free pilot · no checkout. Paid reports are planned; nothing here is a
          verified property recommendation.
        </p>
        <p>
          Built from Bangkok IOC’s legacy and Atlas evidence.{" "}
          <a href="https://github.com/Nonarkara/smart-city-thailand-monitor">
            Source & method ↗
          </a>{" "}
          ·{" "}
          <button
            onClick={() => {
              let cleared=true;
              try { localStorage.removeItem("bkk-place-fit-v1"); }
              catch { cleared=false; setStorageUnavailable(true); }
              setQuotes({});
              setScenarios({});setComparables({});setPurpose("live");setShowCatalog(true);
              setShortlist([]);
              setPrefs({
                budget: 20000,
                travel: "rail",
                destination: "",
                departure: "09:00",
                maxCommute: 45,
                interests: [],
              });
              setMessage(
                cleared?"Saved preferences and home notes cleared from this browser.":"This session was cleared, but saved browser data could not be removed. Check this site's storage settings before leaving a shared device.",
              );
            }}
          >
            Clear saved notes
          </button>
        </p>
      </footer>
    </main>
  );
}
