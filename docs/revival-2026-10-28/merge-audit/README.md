# MiniMax handoff audit and merge, 28 October 2026

MiniMax's `cbe35c7` adds an independent review of deployment `917458d7`.
No unfinished application changes were present. This continuation preserves
that review and audits the current public pilot before merging PR 6.

## Fix

Repeated audit runs had overwritten 83 historical captures/reports. All were
copied, with their relative paths, to sibling directory
`../audit-preserved-2026-10-28` before the tracked historical files were restored.
The untracked comparables capture is also preserved there and is not staged.
Cloudflare's local `.wrangler` cache is not part of the release.

All 11 browser/release runners now accept `AUDIT_DIR`. A shared helper treats
it as a filesystem directory relative to the invoking script, normalizes its
trailing separator, and converts paths with Node's URL helpers. This prevents
reports escaping into a parent directory when a slash is omitted and prevents
spaces, `#`, or `%` from breaking screenshot paths. Defaults remain compatible.
For a fresh run, pass a distinct directory, for example:

```sh
AUDIT_DIR='../docs/my-new-audit' PILOT_URL=https://bangkok-ioc.pages.dev/places node scripts/verify-nearby-handoff.mjs
```

Independent review caught both path edge cases before merge. Three filesystem
tests exercise both slash forms, literal special characters, relative paths
and preservation of a pre-existing sibling report. The CI gate runs these
tests and is triggered by audit-runner changes. No product source, geometry
budget, source qualification or assertion was removed or weakened.

The MiniMax report's broad `npm run build` claim is corrected to the actual
shared/web commands. The retired API is not part of this build or deployment.

## Spatial and functional verification

The real task is to inspect nearby candidates, view their map, return to the
list and continue an entered premises decision without losing inputs.
The map dominates Explore; list rows and their controls stay grouped. Existing
before/after and independent proof is retained in the 27 October handoff folder.

Fresh live evidence is in `handoff/` and `spatial/`. The handoff gate passes
390×844, 799/800/801×900, 1024×900, 1280×720 and 1440×900, plus the short-source
footer and saved-home 30px states. It exercises keyboard focus, a real pan and
recenter, preserved rent/category/checkbox state, full pin bounds and painted
ownership. Negative fixtures still reject the missing/separated handoff,
displaced return caption and footer-constrained map.

The full spatial gate passes Live, Business, Industry and Buy to let at
390/1024/1440, Compare and expanded settings. Normal toolbar height remains
45px. Editor budgets remain 1650/1500/1450px; save budgets 450/480/450px.
Visual inspection of phone map/return, enlarged text and desktop directory
captures found no new hit against the seven anti-slop rules in these states:
controls fit labels, map/list composition is deliberate, prose measure remains
bounded, Jost/Prompt are retained, no decoration was added, map hierarchy holds,
and no extra chrome or clipping was introduced. This is not a claim about all
possible data or devices.

Shared and web builds pass. All 79 JavaScript tests (76 existing +3 path tests)
and both Python source checks pass. All changed scripts pass Node syntax checks.
The public byte verifier matches 167/167 resources; the legacy IOC entry remains
unchanged. Atlas is a separately deployed project and its bytes are timestamped
observations, never an IOC release invariant.

`path test #1 100%/` contains a real release verification under the literal
special-character directory without a trailing slash. The equivalent browser
path case is recorded separately. Live data remains dated/partial reference;
walking access, opening hours, rent fairness and demand are not verified.
`axiom-audit` remains unavailable and is not counted as passed.

Merge, deployment and post-deploy checks are recorded in `SHIP.md`.
