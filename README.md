# Unbridled — max.horse

A self-contained, mobile-friendly 3D horse endless runner. Open `dist/` with any static web server. No package install or build is needed. The 3D scene uses a small WebGL renderer and shared geometry, with no engine, model, texture, or audio downloads. Google Fonts is optional; local fallback fonts remain usable offline.

## Open in Cursor and run

Open this project folder in Cursor. With Node.js 20 or newer installed, run:

```sh
npm run dev
```

Then visit `http://127.0.0.1:4173/`. There are no dependencies to install. The server binds to your computer only. Set `PORT` if that port is already in use. The game must be served over HTTP; double-clicking `index.html` will not load its JavaScript modules.

```sh
npm test
```

Runs the 16 gameplay regression checks using Node's built-in test runner. This is a source handoff: version control and deployment are left to the owner.

## Controls

- Left/right arrows or A/D: change lanes.
- Space, up arrow, or W: jump.
- Down arrow or S: duck / fast fall.
- P or Escape: pause; M: toggle sound.
- Touch: swipe in four directions, or use the on-screen controls.

Carrots grant five seconds of protected Coyote Rush. Apples restore a heart, or provide one shield at full health. Collect horseshoes in quick succession to grow the score multiplier. Jump fences and ditches, duck branches, and dodge hay bales and bees. Mud briefly slows the horse. There is 130 ms of coyote time and 150 ms of jump input buffering. Three hearts, forgiving collision bounds, safe lanes, and short restarts keep runs approachable.

Best distance, best score, and sound preference are saved on this device. Sound starts muted and is generated locally after user interaction. The game pauses when the tab loses focus. Reduced-motion preferences disable shake, flashes, vibration, and speed streaks, and reduce particles.

## Files

- `dist/game.js`: deterministic simulation, procedural patterns, collisions, scoring.
- `dist/render.js`: one-batch WebGL rendering and procedural horse animation.
- `dist/main.js`: input, game screens, local sound, effects, persistence.
- `dist/style.css`, `dist/index.html`: responsive game interface.
- `tests/game.test.mjs`: gameplay regression checks.
- `dev-server.mjs`: a dependency-free local development server.

The files in `dist/` are the authored source for this buildless project, not generated output. Edit them directly and refresh the browser. No bundled engine, framework, hosting SDK, API keys, or account connection is required.

## Putting it on max.horse

Upload the contents of `dist/` to a folder on your web host, such as `/run/`. The game uses relative asset paths, so it works at either a subdirectory or the root of a domain. It can also be embedded in an iframe; give it the available width and at least 600 px of height (or use full viewport height on phones). No API keys, accounts, or backend are required.

## Handoff notes

- All 16 simulation checks pass, including coyote time, buffered jumps, hazards, shields, rush protection, reset state, and safe opening obstacle rows over 100 seeds.
- Local asset references, UI element bindings, JavaScript syntax, and finite renderer geometry were checked. The representative 3D scene uses one draw call and about 19,000 vertices.
- Browser playtesting and physical phone/GPU benchmarks have not been performed. The game caps resolution, limits particles, and adapts resolution downward when frames are slow; actual frame rate still needs checking on target devices.
- Best distance, best score, and sound preference are stored locally. There is no online leaderboard or server persistence.
- No Git repository was initialized, no commits were created, and nothing was published or connected to max.horse.
