# Geographic evidence continuation — 24 October

Approved four-layer continuation: move existing Atlas catalog evidence onto the map, preserve the one-line toolbar and make its controls purpose-relevant. No new feed or speculative commercial-demand layer.

- catalog.ts: validate/deduplicate provided points, recompute the 800m geodesic bound, remove unsafe source links, retain observation uncertainty.
- PlaceFitPage.tsx: optional catalog point layer with accessible source popups, persisted toggle, no stale points after area/pin changes. Household-only settings stay in Live; other purposes show map/sources. Sticky header remains one content-sized line, measured with ResizeObserver for correct scroll offsets.
- places.css: source popup uses house type, square edges and no shadows; data-point targets24px, primary map controls44px. No added toolbar band.
- Tests: invalid/out-of-radius/duplicate/unsafe records; actual point selection, source/date popup, layer toggle, purpose-specific menu, pinned evidence, scrolling and geometry at390/1024/1440. Independent review and live verification before claiming completion.

Catalog points are partial reference data, not open businesses, public-access guarantees, customer demand or walking distance. Existing evidence lists, maps and calculations remain intact.

Implemented fixes discovered by the browser: catalog pane625 sits above station markers600 and below popup700; the pin action/center target yield while a source popup is open. Popup captures wait for opacity/pan completion. Toolbar ResizeObserver starts after place data mounts the real header, including enlarged-text reflow. All33 unit checks, production build, three-width catalog checks and existing household/economic regression flows passed locally before independent review.
