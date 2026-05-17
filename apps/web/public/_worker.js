// Cloudflare Pages single-file Worker — bundled with the static deploy.
// Handles /api/* routes; everything else falls through to static assets.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    // Everything else → static assets.
    return env.ASSETS.fetch(request);
  },
};
