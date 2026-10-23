import { useEffect, useRef, useState } from "react";
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
type CivicPlace = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distanceM: number;
  source_url: string | null;
  source_dataset: string;
  ingested_at: string;
};
type Evidence = {
  fetchedAt: string;
  complaints: {
    status: string;
    fetchedAt: string | null;
    value: null | {
      recent: number;
      openAllTime: number;
      categories: { name: string; count: number }[];
      attribution: { text: string; url: string };
    };
  };
  civic: {
    status: string;
    count: number | null;
    places: CivicPlace[];
    limits: string;
  };
};
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
  try {
    return JSON.parse(localStorage.getItem("bkk-place-fit-v1") ?? "{}");
  } catch {
    return {};
  }
}
function PlaceMap({
  places,
  selected,
  onSelect,
  home,
  onPin,
}: {
  places: Place[];
  selected: string;
  onSelect: (id: string) => void;
  home: Quote;
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
  return (
    <div className="pf-map-wrap">
      <div ref={el} className="pf-map" aria-label="Six Bangkok station areas" />
      <span className="pf-map-target" aria-hidden="true">
        +
      </span>
      {failed && (
        <p className="pf-map-error">
          Map tiles unavailable. All six places remain selectable above.
        </p>
      )}
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
        Pin home at +
      </button>
      <span className="pf-map-note">
        Pan to a home, then pin +. Numbers mark station areas.
      </span>
    </div>
  );
}
export default function PlaceFitPage() {
  const [saved] = useState(loadSaved);
  const [places, setPlaces] = useState<Place[]>([]),
    [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState("ari");
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
    [message, setMessage] = useState("");
  useEffect(() => {
    document.title = "Bangkok, for you · Place fit pilot";
    fetch(`${BASE}data/places/pilot.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Place guide unavailable.");
        return r.json();
      })
      .then((d) => {
        setPlaces(d.places);
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
      .catch((e) => setLoadError(e.message));
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        "bkk-place-fit-v1",
        JSON.stringify({ prefs, quotes, shortlist }),
      );
    } catch {
      /* Private mode: this session still works. */
    }
  }, [prefs, quotes, shortlist]);
  const place = places.find((p) => p.id === selected);
  const quote = quotes[selected] ?? {};
  const fit = assess(prefs, quote);
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
    fetch(
      `https://atlas.nonarkara.org/api/location/evidence?lat=${quote.lat ?? place.lat}&lng=${quote.lng ?? place.lng}`,
      { signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            r.status === 429
              ? "The evidence service is busy. Try again shortly."
              : "Live evidence unavailable. Your guide and comparison still work.",
          );
        const d = await r.json();
        if (d.version !== 1 || !d.civic || !d.complaints)
          throw new Error("Evidence format unavailable.");
        return d;
      })
      .then(setEvidence)
      .catch((e) => {
        if (e.name !== "AbortError")
          setEvidenceError(
            e.message === "Failed to fetch"
              ? "Live evidence could not be reached. Your guide and comparison still work."
              : e.message,
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
      "Home pin placed. Nearby evidence now checks this location. Recheck access and journey.",
    );
  }
  async function share() {
    const u = new URL(location.href);
    u.search = "";
    u.hash = "";
    u.searchParams.set("compare", shortlist.join(","));
    try {
      await navigator.clipboard.writeText(u.href);
      setMessage(
        "Comparison link copied. Personal budget and home notes stay on this device.",
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
      return `${p.name} / ${p.thai}\n${p.character}\nTradeoff: ${p.tradeoff}\nMonthly costs entered: ${f.total === null ? "unknown" : money(f.total)}${q.extras === undefined ? " (extras not entered)" : ""}\nStation access: ${q.access ?? "not checked"}\nChecked journey: ${q.commute === undefined ? "not entered" : q.commute + " minutes"}; for ${q.commuteFor || "destination not recorded"} at ${q.commuteAt || "time not recorded"}; travel ${q.commuteTravel || "not recorded"}\nJourney limit: ${prefs.maxCommute} minutes\nHome pin: ${q.lat !== undefined ? q.lat + ", " + q.lng : "not set (station-area context)"}\n${f.status}\n${[...f.reasons, ...f.missing].join("\n")}\nVisit: ${p.visit}\nYour note: ${q.note ?? ""}\nListings: ${p.rentUrl}\nMap: ${maps({ ...p, lat: q.lat ?? p.lat, lng: q.lng ?? p.lng })}\n`;
    });
    const text = `BANGKOK, FOR YOU — personal comparison\nSaved ${date(new Date().toISOString())}\nMonthly ceiling: ${money(prefs.budget)}. Travel: ${prefs.travel}. Destination: ${prefs.destination || "not entered"}.\nUser-entered quotes are not verified offers. Neighborhood context is desk research checked 23 Oct 2026. No property has been surveyed.\n\n${rows.join("\n")}\nVisit each home at your travel time. Confirm lease length, utilities, pet rules, actual access and availability.\n`;
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
        <a href={BASE}>Open the legacy dashboard</a>
      </main>
    );
  return (
    <main id="place-fit">
      <header className="pf-header">
        <a className="pf-brand" href={`${BASE}places`}>
          Bangkok, for you<span>Find a place that fits your life.</span>
        </a>
        <div className="pf-header-links">
          <span>Pilot · six areas</span>
          <a href="https://atlas.nonarkara.org">Atlas ↗</a>
          <a href={BASE}>Legacy IOC ↗</a>
        </div>
      </header>
      <section className="pf-preferences" aria-label="Your preferences">
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
          <select
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
        <button
          className={view === "explore" ? "pf-active" : ""}
          onClick={() => setView("explore")}
        >
          Explore
        </button>
        <button
          className={view === "compare" ? "pf-active" : ""}
          onClick={() => setView("compare")}
        >
          Compare ({shortlist.length}/3)
        </button>
        <details className="pf-more">
          <summary>Interests & journey</summary>
          <div className="pf-more-content">
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
          </div>
        </details>
      </section>
      {message && (
        <p role="status" className="pf-message">
          {message}
        </p>
      )}
      {view === "explore" ? (
        <>
          <nav className="pf-areas" aria-label="Choose an area">
            {places.map((p, i) => (
              <button
                key={p.id}
                aria-pressed={selected === p.id}
                onClick={() => setSelected(p.id)}
              >
                <span>{i + 1}</span>
                {p.name}
                {shortlist.includes(p.id) && (
                  <span aria-label="shortlisted"> ✓</span>
                )}
              </button>
            ))}
            <label className="pf-mobile-area">
              Area
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {places.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    {i + 1}. {p.name} · {p.thai}
                  </option>
                ))}
              </select>
            </label>
          </nav>
          <div className="pf-workspace">
            <PlaceMap
              places={places}
              selected={selected}
              onSelect={setSelected}
              home={quote}
              onPin={pin}
            />
            {place && (
              <article className="pf-place" aria-labelledby="pf-place-name">
                <p className="pf-kicker">
                  {place.line} · {place.station}
                </p>
                <h1 id="pf-place-name">
                  {place.name}
                  <span lang="th">{place.thai}</span>
                </h1>
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
                <div className="pf-readiness">
                  <h3>Your home check</h3>
                  <p>
                    {fit.status}.{" "}
                    {fit.total !== null
                      ? `${money(fit.total)} / month entered.`
                      : "Add a real rent quote and check the walking route before deciding."}
                  </p>
                </div>
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
              </article>
            )}
          </div>
          {place && (
            <section id="home-check" className="pf-evidence">
              <div className="pf-home">
                <h2>Would a home here work for you?</h2>
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
                    rows={2}
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
              </div>
              <div className="pf-nearby">
                <h2>{quote.lat !== undefined ? "Evidence around your home pin" : "Evidence around this station area"}</h2>
                <p>
                  800 m straight-line radius around{" "}
                  {quote.lat !== undefined
                    ? "your home pin"
                    : "the station-area anchor"}
                  .{" "}
                  {quote.lat !== undefined
                    ? "The chosen point is sent to Atlas; your notes stay on this device."
                    : "Pin a home to check its own surroundings."}
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
          ) : (
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
              <table>
                <caption>
                  Home costs and access are your entries. Editorial context is
                  not a property survey.
                </caption>
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
          )}
          <p className="pf-private">
            Shared links contain area names only. Your budget, quotes and notes
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
              try {
                localStorage.removeItem("bkk-place-fit-v1");
              } catch {}
              setQuotes({});
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
                "Saved preferences and home notes cleared from this browser.",
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
