# Motorsport Career v3.1.1 — mobile cloud + GT7 workbook catalogue

- Cloud panel collapsed to a small button; opens automatically for conflicts/errors/first-save decisions.
- GT7 catalogue generated from the supplied 146-row workbook; no change to ACC catalogue.
- Real-world classes mapped to existing career classes; **not official GT7 event eligibility**.
- PP is copied from workbook, not live verified. Entry/Competitive/Elite are relative within the workbook class, not speed predictions.
- Years <= 2010 go into the rotating used market, with the existing used-market wear mechanic; missing years are excluded pending review.
- Other unhandled classes (F1, Super Formula, fantasy, etc.) are in `gt7-vehicles.json` but intentionally not purchasable through incompatible career classes.
- Prices are fictional career credits, not GT7 prices.
- Upload the updated `index.html`, `cloud.js`, `sw.js`, `gt7-vehicles.json` alongside existing assets to GitHub Pages. Do not overwrite Firebase settings or saved careers.
- After deployment, verify cloud collapse/expand, initial upload prompt, kart purchase, new/used vehicle purchase and vehicle technical condition. Browser integration testing is still required.
