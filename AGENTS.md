# Owner's workflow

The owner exclusively controls publishing and `git push`. Do not push, open pull requests, or deploy. Do not request permission for those actions unless the owner explicitly changes this rule.

Git remotes, `git init`, and local branch setup are allowed when the owner asks for them. Do not create commits unless the owner asks.

Production is Cloudflare Pages, same as grand-theft-horse: feature branch → GitHub PR → merge to `master` deploys `dist/` to unbridled.max.horse. Branch pushes get Pages preview URLs. Do not treat `npm run deploy` as the production path.

# Project facts

- This is Unbridled: a 3-lane 3D horse endless runner at unbridled.max.horse.
- `dist/` is the live game and the only editable product source. There is no build step and there are no npm dependencies to install. Edit `dist/` directly and refresh.
- The renderer is vendored Three.js 0.180 (`dist/assets/three.module.js`). Simulation lives in `dist/engine.mjs`; the Three.js scene in `dist/scene.js`; palettes and paintings in `dist/biomes.mjs`; input, HUD, shouts, and sound in `dist/game.js`.
- Branding is Unbridled: Barlow Condensed, Impact, sans-serif on headers and display type; Expletus Sans 600 on body; ink/orange/yellow (`#120820` / `#e85a28` / `#f2e08a`); ⋒ wordmark; Unbridled copy. Event feedback is big center poster shouts (`#toast`), not pill toasts.
- Rank and persist by score (`unbridled-best-score`), not distance. HUD is HORSEPOWER + SPEED stacked top-left, sound/pause top-right with SCORE under them. Distance stays internal for biomes and the score formula. Sound preference is `unbridled-sound`.
- Landscape paintings are a CSS backdrop behind the 3D trail. Pin them with `background-position: center bottom` so the painted desert and rock bases meet the road. Do not crop toward the sky, especially on mobile.
- Title: wordmark near the top-center. Personal best (not all-caps) top-left; sound/help top-right. Desktop: `Click or Press Space to Begin` flush on top of same-width key hints (no button offset shadow); Space starts the run. Mobile: `Swipe to Steer and Jump` full-width at the bottom, visually behind the horse (no offset shadow). Keep the CTA above the home indicator and Safari overlay chrome (`safe-area-inset-bottom` plus visualViewport).
- First paint stays on navy with the wordmark and **Preparing the trail…** until the first 3D frame is on the canvas (`data-mode=loading`). Then sky plate and road appear together.
- Start with `npm run dev` (serves `dist/` at `http://127.0.0.1:4173/`). Set `PORT` if that port is in use. The game must be served over HTTP; opening `index.html` as a file will not load its modules. Run `npm test` for the 19 gameplay regression checks.

# Layout

```
dist/index.html        chrome, title, HUD, dialogs
dist/style.css         layout, title, HUD, biomes backdrop
dist/game.js           input, screens, shouts, sound, persistence
dist/engine.mjs        sim, pickups, hazards, scoring, rows
dist/scene.js          Three.js horse, trail, pools, lighting
dist/biomes.mjs        palettes, sky/landmark plates, SPAN=1200
dist/assets/           Three.js, horse, paintings, ground tiles
tests/game.test.mjs    gameplay regression checks
dev-server.mjs         static server for dist/
wrangler.toml          Cloudflare Pages project `unbridled`, dist/ output
```

# Gameplay

- Three lanes. Steer with arrows / A D (midair ok). Jump: Space / W / up. Duck: S / down. Pause: P or Esc. Sound: M. Touch: swipe.
- Carrots stack speed (`1 + 0.3 * stacks`, cap 5) and refresh a 4s rush. Apples restore one heart and 2s i-frames. Gold is 5s invincibility + fence smash; it does not change speed.
- Jump fences, duck bees, jump or dodge mud. Three hearts. Jump input is buffered just before landing. Pickup streaks grow the score multiplier (shout when it ticks up).
- Safe-lane rows: gold 16%, apple 3%, carrot otherwise. Effect HUD stacks (gold / carrot / protected / mud / sting); no shout outline on those labels.
- Biomes every 1200m: Vermilion Valley → Golden Monolith → Midnight Mesas, repeating. Landmark PNG layers hold, crossfade, then clear before the biome dissolve.

# Limits

- Simulation checks cover jumps, hazards, gold smash, carrot stacks, reset, seeded safe lanes, biomes/landmarks. They do not replace a browser pass for UI, layout, or WebGL.
- Pixel density can drop under slow frames. Browser playtesting and physical phone/GPU benchmarks are the owner's call.
- Best score and sound stay in localStorage. No online leaderboard or server persistence. Reduced-motion disables shake, flashes, vibration, and speed streaks, and reduces particles.
- Relative asset paths work at a subdirectory or in an iframe; give an iframe the available width and at least 600px height (or full viewport height on phones).
