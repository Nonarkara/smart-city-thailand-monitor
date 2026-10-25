# Boundary reliability verification — 25 October 2026

## Failure reproduced
Live source3bf1342 entered Recovery Mode with saved JSON null or wrong-type preferences. before.json records isolated browser probes; no public user data was changed.

## Repair
Allowlist readers retain valid preferences, quotes, notes, scenarios and comparable records. Invalid decision limits require re-entry, not optimistic defaults. Costs/journeys are validated again by assessment. Prototype keys, unsafe credential-bearing URLs, invalid/future source times, wrong evidence location/radius, inconsistent catalog counts and malformed nested data cannot become trusted local evidence.

Fetches have a12second deadline, caller cancellation and a2MB streaming response cap. Malformed sections become unavailable; malformed top-level guides/evidence fail clearly. Guide failure offers retry. Storage failures have a persistent visible session-only message; report export remains usable. Failed browser clearing is explicitly reported. Saved shortlist restoration waits for validated guides and persistence does not overwrite it while loading. Note fields have stable accessible labels independent of restored values.

## Current local proof
- 48 unit tests passed; unit-results.txt includes complete names/output.
- Final web production build passed. Shared build passed. Retired API build failed with preexisting missing exports; see SHIPABILITY.md. No API source was changed or deployed.
- Browser results.json:390/1024/1440 recovery, valid-note retention and both purposes, malformed evidence/publisher/guide, session-only storage plus report and failed-clear, hanging request deadline, delayed-guide shortlist preservation.
- Captures prove recovery-state layout and controls; tiles may still be loading, so they do not claim complete basemap rendering. Toolbar47px in final captures, no horizontal overflow. Gate is one row under64px, not an artificially fixed height.
- gitleaks dir apps/web/src/places --redact: no leaks found in scanned pilot source. Not a claim about historical repository contents.

## Attempts and corrections
Earlier parallel browser attempts timed out before a ready-place selector; their exact cause was not established. Isolated readiness probe and sequential runs succeeded. Another failure was traced to a restored textarea value changing a wrapped-label lookup; explicit accessible labels fixed it. attempt-restored-label files retain that evidence. A strict47px assertion failed on a valid45px fallback-font toolbar; attempt-fixed-height files record it. The verifier now checks the real one-row constraint and records actual geometry.

Independent source review caught and closed the premature-shortlist race and suggested the count-consistency guard. Rendered review of recovered states passed at all3 widths; final session-only/guide states also passed independent rendered review (pilot_review): visible readable warning, clear Retry/legacy link, no clipping/overlap. Overall professional shipability remains unproven: actual premises comparison, measured local demand, operational readiness and field validation are separate open requirements, not established by these tests.

Existing household browser regression passed 390/799/801/1024/1440; economic regression passed 390/1024/1440 against the final production build.
