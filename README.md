# Unbridled — max.horse

A self-contained, mobile-friendly 3D horse endless runner. Open `dist/` with any static web server. No package install or build is needed. The 3D scene uses vendored Three.js and three original desert paintings. Google Fonts (Barlow Condensed for headers, Expletus Sans 600 for body) is optional; local fallback fonts remain usable offline.

Play: [unbridled.max.horse](https://unbridled.max.horse)

GitHub: https://github.com/maxfarago/unbridled. Feature work goes on a branch. A PR is required to merge to `master`. Cloudflare Pages preview-deploys every branch; merging to `master` deploys production. The Pages project is `unbridled`.

## Open in Cursor and run

Open this project folder in Cursor. With Node.js 20 or newer installed, run:

```sh
npm run dev
```

Then visit `http://127.0.0.1:4173/`. There are no dependencies to install. The server binds to your computer only. Set `PORT` if that port is already in use. The game must be served over HTTP; double-clicking `index.html` will not load its JavaScript modules.

```sh
npm test
```

Runs the 16 gameplay regression checks using Node's built-in test runner.

## Controls

- Left/right arrows or A/D: change lanes.
- Space, up arrow, or W: jump.
- Down arrow or S: duck / fast fall.
- Hold Shift to sprint; release to recharge.
- P or Escape: pause; M: toggle sound.
- Touch: swipe in four directions, or use the on-screen controls. Hold ϟ to sprint.

Carrots grant four seconds of speed and sprint energy. Apples restore a heart and protect you for two seconds. Golden horseshoes grant five seconds of invincible galloping. Jump fences, duck bees, and jump or dodge mud. Pickup streaks grow the score multiplier and shout when the multiplier ticks up. There is jump input buffering just before landing. Three hearts, safe lanes, and short restarts keep runs approachable.

Best score (`unbridled-best-score`) and sound preference (`unbridled-sound`) are saved on this device. Distance is used internally for biomes and scoring, not as a rank. Sound starts muted and is generated locally after user interaction. The game pauses when the tab loses focus. Reduced-motion preferences disable shake, flashes, vibration, and speed streaks, and reduce particles.

## Files

- `dist/engine.mjs`: deterministic simulation, jumps, collisions, scoring, obstacle rows.
- `dist/scene.js`: Three.js horse, scenery, lighting, object pools, and biome colors.
- `dist/game.js`: input, game screens, local sound, effects, persistence.
- `dist/biomes.mjs`: landscape palettes, paintings, and distance-based dissolves.
- `dist/style.css`, `dist/index.html`: responsive game interface.
- `dist/assets/`: Three.js, license, and the three desert paintings.
- `tests/game.test.mjs`: gameplay regression checks.
- `dev-server.mjs`: a dependency-free local development server.
- `wrangler.toml`: Cloudflare Pages project name and `dist/` output dir.

The files in `dist/` are the authored source for this buildless project, not generated output. Edit them directly and refresh the browser. No bundled engine, framework, hosting SDK, API keys, or account connection is required.

## Putting it on max.horse

Production is Cloudflare Pages, same as Grand Theft Horse. Feature branch → GitHub PR → merge to `master` deploys `dist/` to [unbridled.max.horse](https://unbridled.max.horse). Branch pushes get Pages preview URLs. The game uses relative asset paths, so it also works at a subdirectory or in an iframe; give an iframe the available width and at least 600 px of height (or use full viewport height on phones). No API keys, accounts, or backend are required.

## Handoff notes

- All 16 simulation checks pass, including jump buffering, hazards, gold smash, sprint recovery, reset state, and safe opening obstacle rows over 100 seeds.
- Local asset references, UI element bindings, and JavaScript syntax were checked. Three.js geometry is pooled and combined by material; pixel density can drop under slow frames.
- Browser playtesting and physical phone/GPU benchmarks have not been performed. The game caps resolution, limits particles, and adapts resolution downward when frames are slow; actual frame rate still needs checking on target devices.
- Best score and sound preference are stored locally. There is no online leaderboard or server persistence.

Three.js 0.180.0 is included under the MIT license. See `dist/assets/THREE-LICENSE.txt`.
