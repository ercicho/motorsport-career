# Motorsport Career v3.1.2 — Real-world GT7 vehicle classification

- All 146 rows imported from the supplied workbook into `gt7-vehicles.json` and embedded into the static catalogue.
- Excel `Class` / `Sub-Class` are the authoritative career labels; legacy `category` is retained only for backward compatibility with older saves.
- New / used / historic / review are narrative market statuses based on the year column (missing year = review). Historic vehicles can carry a collector premium, and the used stock rotates each career year.
- GT7 official group eligibility is **not** asserted or automatically inferred. Event PP values still require manual in-game verification.
- Existing GT7 Club, Touring, National and International career entry checks use the real class for workbook vehicles. Other championships and team offers retain legacy rules and require future explicit per-championship real-class regulations.
- ACC team car catalogue is unchanged.
- Existing purchases and cloud save structure are preserved; no data reset.
- Test the new and used markets, class filters, kart purchase, save/reload and cross-device cloud sync before relying on it.
- The model-year thresholds and prices are fictional career-game design assumptions, not official GT7 data or real vehicle market valuations.
