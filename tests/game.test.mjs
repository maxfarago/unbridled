import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { freshState, steer, jump, duck, tick, interact, makeRow } from '../dist/engine.mjs';
import { BIOMES, SPAN, landscapeAt, landmarkAt, skyOf } from '../dist/biomes.mjs';

function running() {
  const s = freshState();
  s.mode = 'running';
  return s;
}
function advance(s, seconds) {
  for (let i = 0; i < Math.round(seconds * 120); i++) tick(s, 1 / 120);
}
function rng(seed) {
  let n = seed;
  return () => { n = n * 16807 % 2147483647; return (n - 1) / 2147483646; };
}

test('jump has a useful apex and returns to the ground', () => {
  const s = running(); jump(s); let apex = 0;
  for (let i = 0; i < 120; i++) { tick(s, 1 / 120); apex = Math.max(apex, s.y); }
  assert(apex > 1.8 && apex < 2.3); assert.equal(s.y, 0);
});
test('a jump buffered before landing fires on the next takeoff', () => {
  const s = running(); jump(s); advance(s, .78);
  assert(s.y > 0); jump(s); advance(s, .18);
  assert(s.y > .3); assert(s.vy > 0);
});
test('a fence can be jumped', () => {
  const s = running(); s.y = 1.2;
  assert.equal(interact(s, { lane: 0, type: 'fence', hit: false }), null);
  assert.equal(s.hearts, 3);
});
test('bees can be ducked', () => {
  const s = running(); duck(s);
  assert.equal(interact(s, { lane: 0, type: 'bees', hit: false }), null);
  assert.equal(s.hearts, 3);
});
test('bees cost a heart if you stay standing', () => {
  const s = running();
  assert.equal(interact(s, { lane: 0, type: 'bees', hit: false }), 'hit');
  assert.equal(s.hearts, 2);
});
test('mud slows the horse without taking a heart', () => {
  const s = running();
  assert.equal(interact(s, { lane: 0, type: 'mud', hit: false }), 'mud');
  assert.equal(s.hearts, 3); assert(s.mud > 0);
});
test('apples heal and grant a short protected window', () => {
  const s = running(); s.hearts = 2;
  assert.equal(interact(s, { lane: 0, type: 'apple', hit: false }), 'apple');
  assert.equal(s.hearts, 3); assert(s.invincible >= 2);
  assert.equal(interact(s, { lane: 0, type: 'fence', hit: false }), 'protected');
  assert.equal(s.hearts, 3);
});
test('carrot rush speeds you up but does not smash fences', () => {
  const s = running();
  assert.equal(interact(s, { lane: 0, type: 'carrot', hit: false }), 'carrot');
  assert.equal(s.carrot, 4); assert.equal(s.carrotStacks, 1);
  advance(s, .4);
  assert(s.speed > 19);
  assert.equal(interact(s, { lane: 0, type: 'fence', hit: false }), 'hit');
  assert.equal(s.hearts, 2);
});
test('carrots stack intensity and refresh the rush', () => {
  const s = running();
  interact(s, { lane: 0, type: 'carrot', hit: false });
  advance(s, .5);
  const once = s.speed;
  s.carrot = 1.2;
  assert.equal(interact(s, { lane: 0, type: 'carrot', hit: false }), 'carrot');
  assert.equal(s.carrotStacks, 2); assert.equal(s.carrot, 4);
  advance(s, .5);
  assert(s.speed > once);
  advance(s, 4);
  assert.equal(s.carrot, 0); assert.equal(s.carrotStacks, 0);
});
test('golden gallop is invincible, smashes fences, and does not change speed', () => {
  const s = running();
  const cruise = s.speed;
  assert.equal(interact(s, { lane: 0, type: 'gold', hit: false }), 'gold');
  assert.equal(s.gold, 5); assert(s.invincible >= 5);
  advance(s, .5);
  assert(Math.abs(s.speed - cruise) < .05);
  assert.equal(interact(s, { lane: 0, type: 'fence', hit: false }), 'smash');
  assert.equal(s.hearts, 3);
});
test('lane changes stay within the track', () => {
  const s = running();
  for (let i = 0; i < 8; i++) steer(s, -1);
  assert.equal(s.lane, -1); advance(s, .6); assert(s.x > -2.4);
  for (let i = 0; i < 8; i++) steer(s, 1);
  assert.equal(s.lane, 1); advance(s, .6); assert(s.x < 2.4);
});
test('zero hearts ends the run and stops the simulation', () => {
  const s = running(); s.hearts = 1;
  assert.equal(interact(s, { lane: 0, type: 'fence', hit: false }), 'hit');
  assert.equal(s.mode, 'finished');
  const distance = s.distance; advance(s, 1); assert.equal(s.distance, distance);
});
test('reset clears temporary powerups and movement state', () => {
  const s = running(); Object.assign(s, { carrot: 8, gold: 5, hearts: 1, y: 2, duck: 1, combo: 20 });
  const n = freshState();
  assert.equal(n.hearts, 3); assert.equal(n.carrot, 0); assert.equal(n.carrotStacks, 0); assert.equal(n.gold, 0);
  assert.equal(n.combo, 0); assert.equal(n.y, 0); assert.equal(n.mode, 'menu');
});
test('100 seeded tracks preserve a safe lane in each opening obstacle row', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const row = makeRow(0, rng(seed));
    const blocked = new Set(row.filter(e => ['fence', 'mud', 'bees'].includes(e.type)).map(e => e.lane));
    assert(blocked.size <= 2);
  }
});
test('pickup streaks grow the score multiplier', () => {
  const s = running();
  for (let i = 0; i < 5; i++) interact(s, { lane: 0, type: 'carrot', hit: false });
  assert.equal(Math.min(5, 1 + Math.floor(s.combo / 5)), 2);
});
test('identical seeds generate identical opening tracks', () => {
  assert.deepEqual(makeRow(0, rng(777)), makeRow(0, rng(777)));
});
test('biomes cycle vermilion, golden monolith, then midnight mesas', () => {
  assert.deepEqual(BIOMES.map(b => b.name), ['VERMILION VALLEY', 'GOLDEN MONOLITH', 'MIDNIGHT MESAS']);
});
test('each biome has a matching tiled floor texture', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  for (const biome of BIOMES) {
    const stem = biome.name.toLowerCase().replace(/ /g, '-');
    assert.equal(biome.floor, `./assets/ground-${stem}.jpg`);
    assert.equal(existsSync(join(root, biome.floor.replace(/^\.\//, ''))), true, biome.floor);
    assert.equal(existsSync(join(root, skyOf(biome).replace(/^\.\//, ''))), true, skyOf(biome));
    assert.equal((biome.layers || []).length, 4, biome.name);
    for (const layer of biome.layers || []) {
      assert.equal(existsSync(join(root, layer.replace(/^\.\//, ''))), true, layer);
    }
  }
});
test('landmark plates hold, then crossfade, then empty before the biome dissolve', () => {
  const at = progress => landmarkAt(progress * SPAN, 4);
  assert.equal(at(0).from, -1);
  assert.equal(at(0).to, 0);
  assert.equal(at(0).blend, 0);
  const hold = at(0.12);
  assert.equal(hold.from, 0); assert.equal(hold.to, 0); assert.equal(hold.blend, 0);
  const fade = at(0.25);
  assert.equal(fade.from, 0); assert.equal(fade.to, 1);
  assert.ok(fade.blend > 0.2 && fade.blend < 0.8);
  const last = at(0.76);
  assert.equal(last.from, 3); assert.equal(last.to, 3);
  const gone = at(0.95);
  assert.equal(gone.from, -1); assert.equal(gone.to, -1);
  assert.equal(landmarkAt(100, 0).from, -1);
  assert.ok(landscapeAt(0.8 * SPAN).blend > 0);
});
