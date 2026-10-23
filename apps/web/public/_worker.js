// Cloudflare Pages single-file Worker — bundled with the static deploy.
// Handles /api/* routes; everything else falls through to static assets.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Consumer pilot shares the source and assets, with its own search metadata.
    if (url.pathname === "/places" || url.pathname === "/places/") {
      const page = await env.ASSETS.fetch(request);
      const html = (await page.text())
        .replace(
          /<title>[^<]*<\/title>/,
          "<title>Bangkok, for you · Place fit pilot</title>",
        )
        .replace(
          /(<meta name="description" content=")[^"]*("\s*\/>)/,
          "$1Compare Bangkok areas by your budget, daily journeys, interests and sourced local evidence.$2",
        );
      const headers = new Headers(page.headers);
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("cache-control", "public, max-age=0, must-revalidate");
      headers.delete("content-length");
      headers.delete("etag");
      return new Response(html, { status: page.status, headers });
    }

    // /api/flights — proxy adsb.lol so the browser doesn't hit CORS.
    if (url.pathname === "/api/flights") {
      const lat = url.searchParams.get("lat") || "13.9";
      const lon = url.searchParams.get("lon") || "100.6";
      const dist = url.searchParams.get("dist") || "15";
      const target = `https://api.adsb.lol/v2/lat/${encodeURIComponent(lat)}/lon/${encodeURIComponent(lon)}/dist/${encodeURIComponent(dist)}`;
      const res = await fetch(target, {
        headers: { "user-agent": "smart-city-thailand-monitor/1.0" },
        cf: { cacheEverything: true, cacheTtl: 30 },
      });
      return new Response(res.body, {
        status: res.status,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=30, s-maxage=30",
          "access-control-allow-origin": "*",
        },
      });
    }

    // Preserve the currently served IOC byte-for-byte at its existing entries.
    // Its two immutable bundles are routed with it. The new pilot is additive.
    const legacyPaths = new Set([
      "/",
      "/public",
      "/admin",
      "/assets/index-4ytu9jeW.js",
      "/assets/index-DmF0VODd.css",
    ]);
    if (legacyPaths.has(url.pathname)) {
      const legacy = new URL(
        url.pathname + url.search,
        "https://fa6ccef0.bangkok-ioc.pages.dev",
      );
      return fetch(new Request(legacy, request));
    }

    // Everything else → static assets.
    return env.ASSETS.fetch(request);
  },
};
