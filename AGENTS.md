# Owner's workflow

The owner exclusively controls publishing and `git push`. Do not push, open pull requests, or deploy. Do not request permission for those actions unless the owner explicitly changes this rule.

Git remotes, `git init`, and local branch setup are allowed when the owner asks for them. Do not create commits unless the owner asks.

Production is Cloudflare Pages, same as grand-theft-horse: feature branch → GitHub PR → merge to `master` deploys `dist/` to unbridled.max.horse. Branch pushes get Pages preview URLs. Do not treat `npm run deploy` as the production path.

# Project facts

- This is Unbridled: a 3-lane 3D horse endless runner at unbridled.max.horse.
- `dist/` is the live game and the only editable product source. There is no build step and there are no npm dependencies to install.
- The renderer is vendored Three.js 0.180 (`dist/assets/three.module.js`). Simulation lives in `dist/engine.mjs`; the Three.js scene in `dist/scene.js`; palettes and paintings in `dist/biomes.mjs`; input, HUD, shouts, and sound in `dist/game.js`.
- Branding is Unbridled: Barlow Condensed, Impact, sans-serif on headers and display type; Expletus Sans 600 on body; ink/orange/yellow (`#120820` / `#e85a28` / `#f2e08a`); ⋒ wordmark; Unbridled copy. Event feedback is big center poster shouts (`#toast`), not pill toasts.
- Rank and persist by score (`unbridled-best-score`), not distance. HUD is HORSEPOWER + SPEED stacked top-left, sound/pause top-right with SCORE under them. Distance stays internal for biomes and the score formula.
- Landscape paintings are a CSS backdrop behind the 3D trail. Pin them with `background-position: center bottom` so the painted desert and rock bases meet the road. Do not crop toward the sky, especially on mobile.
- Title: wordmark near the top-center, personal best below it (not all-caps). Desktop: `Click or Press Space to Begin` flush on top of same-width key hints (no button offset shadow); Space starts the run. Sound/help stay top-right. Mobile: sound/help under the best; `Swipe to Steer and Jump` full-width at the bottom, visually behind the horse (no offset shadow). Keep the CTA above the home indicator and Safari overlay chrome (`safe-area-inset-bottom` plus visualViewport).
- Start with `npm run dev` (serves `dist/` at `http://127.0.0.1:4173/`). Run `npm test` for the 16 gameplay regression checks.
- Read `README.md` for controls, persistence keys, testing limits, and deploy notes.
