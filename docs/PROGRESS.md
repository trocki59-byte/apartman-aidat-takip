# SDD ledger — plan: docs/superpowers/plans/2026-10-25-yonetici-paneli.md

Design approved by user, including visual mockup, 2026-10-25.
Execution: native, uninterrupted as requested.
Isolation: new project directory, new feat/yonetici-paneli branch; no existing source affected.
Pre-flight: store snapshot consumed by HTTP and UI; integer cents in all layers. Dates are ISO calendar dates. All money changes run in SQLite transactions.
Ruling: Node.js SQLite instead of Sites starter — Sites helpers absent from this runtime; portable full application with Docker deployment. Cost: hosted URL unavailable until a compatible host is connected.
Ruling: No additional plan approval — user explicitly instructed implementation to start.
Task 1: complete — SQLite store, 8 real database tests passing; commit 1a30cdd.
Task 2: complete — sessions, scrypt, CSRF/origin protection, password change, rate limiting; HTTP parser integration tests pass without listen().
Task 3: source complete — eight responsive screens, actual API integration, printing, CSV, reports and JSON export. Browser validation blocked by Chromium socket EPERM. Two additional-network runs were interrupted by user; no further permission attempt.
Ruling: HTTP validation uses real Node HTTP parser over in-memory duplex connection — local TCP listen forbidden; avoids untested route mocks. Cost: TCP binding itself remains unverified.
Final review: independent reviewer final_review; no additional critical/important findings. Known date RangeError reproduced as HTTP 500 and fixed; regression now HTTP 400.
Final: fixed invalid calendar month — HTTP regression RED→GREEN, suite passed.
Final: minor (deferred): batch period change leaves dueDate unchanged; user must check date before confirming, noted in README.
Final: minor (deferred): expired-session submit leaves form visible; refresh returns to login, noted in README.
Task 4: source complete — README, Dockerfile, environment example, SQLite consistent backup and password recovery scripts. GitHub remote creation unavailable: no connector creation tool; gh auth reports invalid token. Live publication unavailable: Sites helpers absent. Deliver source ZIP, not a claimed live deployment.
Ruling: preserve local feature branch and supply ZIP — remote GitHub write access unavailable; no existing base branch to merge. Cost: GitHub publication remains pending.
Final verification: npm test 21 pass / 1 explicit environment skip / 0 fail; npm run check pass; git diff --check pass. Browser E2E remains blocked before application execution, not a claimed pass. Docker not executed.

2026-10-25 user change: application password disabled by default, PASSWORD_REQUIRED=false in Render/Docker. Direct panel uses anonymous cookie session plus origin/CSRF checks; all visitors can read/write as explicitly requested. Optional password mode retained, existing password hash not deleted. Two new HTTP behavior tests RED→GREEN; suite 23 pass, 1 environment skip.
Independent passwordless review: fixed mode-switch session reuse. Startup clears sessions, protecting future password re-enablement. Regression reproduced RED then GREEN; final suite 24 pass, 1 environment skip.
