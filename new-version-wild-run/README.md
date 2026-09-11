# Wild Run — max.horse

A self-contained 3D endless runner, built with Three.js and three original graphic desert paintings. No build step, backend, API keys, or external asset requests are required.

## Add it to max.horse

Upload the contents of `dist/` to a folder on your website, for example `/wild-run/`. Open `https://max.horse/wild-run/`. Keep the asset folder and filenames intact, and serve `.js` and `.mjs` files with a JavaScript MIME type. The game must be served over HTTP(S), rather than opened as a local file.

To place it within an existing page:

```html
<iframe
  src="/wild-run/"
  title="Wild Run — horse endless runner"
  style="display:block;width:100%;height:100svh;min-height:440px;border:0"
  allow="autoplay; fullscreen"
  allowfullscreen
></iframe>
```

The published Sites preview is private. Hosting these files on max.horse makes them available under your own website's access settings. This package does not change your live website or DNS.

## Play

- Steer: left/right arrows or A/D. Steering also works in midair.
- Jump: Space, up arrow, or W. Jump input is buffered just before landing.
- Duck / drop quickly: down arrow or S.
- Sprint: hold Shift; release to recharge.
- Phone: swipe left/right/up/down, tap the trail to jump, or use the on-screen buttons. Hold the lightning button to sprint.
- Pause: P / Escape, or the pause button. Switching tabs automatically pauses.
- Sound: use the speaker button; sound starts muted.

Carrots give a 4-second speed boost and sprint energy. Apples restore a heart and give 2 seconds of protection. Golden horseshoes grant 5 seconds of invincible galloping. Carrot and horseshoe boosts can combine with manual sprint. Fences and bees cost a heart unless avoided or protected; mud slows grounded horses. Three hearts end the run. Pickup streaks increase the points multiplier up to ×5; clean fence jumps and obstacle smashing award bonus points. Best distance is stored only on the current device.

## Files and tuning

- `dist/engine.mjs`: independent gameplay rules, speeds, jump physics, hitbox, and obstacle rows.
- `dist/scene.js`: 3D horse rig and gallop animation, fixed camera, scenery, object pools, lighting, particles, and adaptive resolution.
- `dist/game.js`: input, sound, game loop, interface, and persistence.
- `dist/style.css`: responsive interface.
- `dist/biomes.mjs`: three landscape palettes, stage names, and distance-based transitions.
- `dist/assets/violet-monoliths.jpg`, `vermilion-valley.jpg`, and `midnight-mesas.jpg`: original generated paintings inspired by the supplied graphic art direction; the supplied reference paintings are not shipped.

Each painting stays stationary. Every 600 metres, the game enters another landscape: Violet Monoliths, Vermilion Valley, then Midnight Mesas, repeating indefinitely. A smooth dissolve begins 150 metres before each boundary; ground, trail, scenery colors, fog, and lighting transition together. Low-polygon 3D cacti, trees, rocks, rabbits, and horses move along the trail. Static geometry is combined by material; gravel and particles are instanced; obstacles and pickups reuse bounded object pools. Pixel density is capped and can reduce automatically under sustained slow frames. No realtime shadows or postprocessing are required. Reduced-motion preferences disable camera shake and speed streaks.

Validation: syntax and asset-reference checks, engine checks for collision forgiveness, jump buffering, air steering, ducking, pickups, timed effects, sprint recovery, and game-over state; 10,000 generated obstacle rows checked for an open lane. Actual browser/device performance has not been measured. Playtest on target iOS/Android and desktop devices before replacing a production game.

## Local preview

From this folder, run `python3 -m http.server 4187 --directory dist`, then visit `http://localhost:4187/`.

## Licenses

Three.js 0.180.0 is included under the MIT license. DM Sans and Libre Caslon Display are included under the SIL Open Font License. License notices are included in `dist/assets/`.
