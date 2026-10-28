# Merged, deployed and verified

28 October 2026, Bangkok time.

- MiniMax review: `cbe35c7`, preserved and pushed.
- Audit/tool fix: `d7675b9`, independently reviewed, pushed and merged.
- PR 6: https://github.com/Nonarkara/smart-city-thailand-monitor/pull/6
- Merge/source commit: `1a3399e1d3d77f2c101421eb4e8c355cfd1ce609` on `main`.
- Cloudflare Pages deployment: `d658eb1d`.
- Public: https://bangkok-ioc.pages.dev/places
- Immutable: https://d658eb1d.bangkok-ioc.pages.dev/places

PR CI passed: https://github.com/Nonarkara/smart-city-thailand-monitor/actions/runs/40652342361
Post-merge pilot CI passed: https://github.com/Nonarkara/smart-city-thailand-monitor/actions/runs/40652444680
Post-merge GitHub Pages workflow passed: https://github.com/Nonarkara/smart-city-thailand-monitor/actions/runs/40652444658
The public IOC delivery verified here is the separate Cloudflare Pages project.

The merged application/public/shared tree equals the reviewed branch tree.
Shared and web builds were rerun successfully from merged `main`. Deployment:

```sh
npx wrangler pages deploy apps/web/dist --project-name bangkok-ioc --branch main --commit-hash 1a3399e1d3d77f2c101421eb4e8c355cfd1ce609 --commit-message "Merge verified Bangkok place-fit pilot and audit fixes" --commit-dirty=false
```

Wrangler uploaded0 changed files (262 already present), compiled and deployed
the Worker. This is expected: the current continuation changes audit tooling
and records, while the application assets remain identical to the prior release.
Tracked files were clean; preserved untracked captures/cache caused Wrangler's
working-directory warning and were not staged as application changes.

## Post-deploy proof

`ship/live-bytes.json`: all167 resources match the merged rebuild; legacy IOC
root remains unchanged. Atlas is a dated independent-project observation.

`ship/pilot-html.json`: public and immutable HTML both equal the result of
executing the actual built Worker against the built `index.html`.
SHA256: `4a1ac3fcb0573f575d76bf97a7400dddafb35a3909716c85a2d243fdaa9e3c24`.
A raw `index.html` comparison initially differed because the Worker deliberately
replaces the title and description for `/places`. The Worker-derived comparison
passes; that intentional transformation is preserved.

`ship/handoff/live-geometry.json` and its screenshots: all10 cases pass on the
public URL after deployment, including seven widths, operating controls during
source errors, enlarged text, keyboard focus, recentering and state preservation.
All original failure fixtures still reject. Fresh full spatial captures and
budgets are in `spatial/`; no UI bytes changed between that audit and deployment.

All79 JavaScript tests and both source checks pass. Independent review has no
remaining blocker in this change. Missing field evidence and the unavailable
`axiom-audit` remain the explicit limits recorded in README.md.
