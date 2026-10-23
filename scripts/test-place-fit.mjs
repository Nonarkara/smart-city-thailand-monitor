import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../apps/web/src/places/placeFit.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const { assess, amount, readShared } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const prefs = {
  budget: 20000,
  travel: "rail",
  destination: "Silom 09:00",
  maxCommute: 45,
  interests: [],
};
test("missing costs and pedestrian evidence cannot pass household constraints", () => {
  const result = assess(prefs, {});
  assert.equal(result.total, null);
  assert.equal(result.status, "Needs checking");
  assert.equal(result.missing.length, 3);
  assert.equal(
    assess(prefs, {
      rent: 15000,
      access: "walk",
      commute: 35,
      commuteFor: prefs.destination,
      commuteTravel: prefs.travel,
    }).status,
    "Needs checking",
  );
});
test("actual total costs and car-dependent access can reject an attractive cheap quote", () => {
  const r = assess(prefs, {
    rent: 17000,
    extras: 4000,
    access: "car",
    commute: 60,
    commuteFor: prefs.destination,
    commuteTravel: prefs.travel,
  });
  assert.equal(r.total, 21000);
  assert.equal(r.status, "Does not meet your limits");
  assert.equal(r.reasons.length, 3);
});
test("zero extras is a known value; a fully entered match can pass", () => {
  const r = assess(prefs, {
    rent: 20000,
    extras: 0,
    access: "walk",
    commute: 45,
    commuteFor: prefs.destination,
    commuteTravel: prefs.travel,
  });
  assert.equal(r.status, "Meets your entered limits");
  assert.equal(r.total, 20000);
});
test("no invented commute requirement when visitor has no destination", () => {
  assert.equal(
    assess(
      { ...prefs, destination: "", travel: "car" },
      { rent: 10000, extras: 2000 },
    ).status,
    "Meets your entered limits",
  );
});
test("blank, negative and non-finite input does not become a zero quote", () => {
  for (const value of ["", " ", "-1", "Infinity", "NaN", "foo"])
    assert.equal(amount(value), undefined);
  assert.equal(amount("0"), 0);
});
test("shared URLs are bounded known area IDs, deduplicated; private budget is ignored", () => {
  assert.deepEqual(
    readShared("?compare=ari,unknown,ari,on-nut,bang-na,extra&budget=123", [
      "ari",
      "on-nut",
      "bang-na",
      "extra",
    ]),
    ["ari", "on-nut", "bang-na"],
  );
});
const pilot = JSON.parse(
  readFileSync(new URL("../public/data/places/pilot.json", import.meta.url)),
);
test("pilot has six unique sourced station anchors without fabricated rent or walk scores", () => {
  assert.equal(pilot.places.length, 6);
  assert.equal(new Set(pilot.places.map((p) => p.id)).size, 6);
  for (const p of pilot.places) {
    assert.ok(p.source.startsWith("https:"));
    assert.ok(p.lat > 13 && p.lat < 14);
    assert.ok(p.tradeoff);
    assert.ok(p.visit);
    assert.equal(p.rent, undefined);
    assert.equal(p.walkScore, undefined);
  }
});

test("a checked journey never approves a changed destination or travel mode", () => {
  const q = {
    rent: 15000,
    extras: 2000,
    access: "walk",
    commute: 20,
    commuteFor: "Silom 09:00",
    commuteTravel: "rail",
  };
  assert.equal(assess(prefs, q).status, "Meets your entered limits");
  assert.equal(
    assess({ ...prefs, destination: "Airport 09:00" }, q).status,
    "Needs checking",
  );
  assert.equal(assess({ ...prefs, travel: "car" }, q).status, "Needs checking");
});
test("a zero quote is not a verified free home", () => {
  assert.equal(
    assess(prefs, { rent: 0, extras: 0, access: "walk" }).total,
    null,
  );
});

const pagesWorker = (
  await import(
    "data:text/javascript;base64," +
      Buffer.from(
        readFileSync(
          new URL("../apps/web/public/_worker.js", import.meta.url),
          "utf8",
        ),
      ).toString("base64")
  )
).default;
test("pilot metadata is distinct and assets retain /places (no index.html canonical redirect)", async () => {
  const html =
    '<title>Muang Thong Thani Super Dashboard</title><meta name="description" content="old" />';
  let path;
  const r = await pagesWorker.fetch(
    new Request("https://example.test/places"),
    {
      ASSETS: {
        fetch: async (req) => {
          path = new URL(req.url).pathname;
          return new Response(html);
        },
      },
    },
  );
  assert.equal(path, "/places");
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Bangkok, for you/);
});

test("legacy entry and original bundles use the immutable deployment", async () => {
  const original = globalThis.fetch;
  let seen;
  globalThis.fetch = async (req) => {
    seen = req.url;
    return new Response("legacy");
  };
  try {
    const res = await pagesWorker.fetch(
      new Request("https://example.test/?city=bangkok"),
      {},
    );
    assert.equal(await res.text(), "legacy");
    assert.equal(seen, "https://fa6ccef0.bangkok-ioc.pages.dev/?city=bangkok");
  } finally {
    globalThis.fetch = original;
  }
});

test("changing departure time invalidates the checked journey", () => {
  const q = {
    rent: 15000,
    extras: 2000,
    access: "walk",
    commute: 20,
    commuteFor: "Silom 09:00",
    commuteTravel: "rail",
    commuteAt: "09:00",
  };
  assert.equal(
    assess({ ...prefs, departure: "09:00" }, q).status,
    "Meets your entered limits",
  );
  assert.equal(
    assess({ ...prefs, departure: "18:00" }, q).status,
    "Needs checking",
  );
});

test("legacy data stays with its immutable deployment instead of SPA fallback",async()=>{
 const original=globalThis.fetch;let seen;
 globalThis.fetch=async req=>{seen=req.url;return new Response('{"legacy":true}',{headers:{'content-type':'application/json'}});};
 try{const res=await pagesWorker.fetch(new Request('https://example.test/data/alphaearth/change-bangkok-core-2023-2024.json'),{ASSETS:{fetch(){throw new Error('must not substitute new SPA HTML');}}});assert.equal((await res.json()).legacy,true);assert.ok(seen.startsWith('https://fa6ccef0.bangkok-ioc.pages.dev/data/'));}finally{globalThis.fetch=original;}
});

test('attributed market snapshot has its own static asset route and preserves publisher date',async()=>{
 const d=JSON.parse(readFileSync(new URL('../public/data/places/market.json',import.meta.url),'utf8'));assert.equal(d.publisher,'PropertySights');assert.match(d.publisherDate,/^\d{4}-\d{2}-\d{2}$/);assert.ok(d.rentByBed['1'].n>=5);let requested;
 const res=await pagesWorker.fetch(new Request('https://example.test/data/places/market.json'),{ASSETS:{fetch(req){requested=req.url;return new Response(JSON.stringify(d),{headers:{'content-type':'application/json'}})}}});assert.equal((await res.json()).publisher,'PropertySights');assert.equal(requested,'https://example.test/data/places/market.json');
});
