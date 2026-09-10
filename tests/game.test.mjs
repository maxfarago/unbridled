import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../dist/game.js';

function fresh() {
  const game = new Run(123);
  game.entities = [];
  game.nextRow = 1e9;
  game.start();
  return game;
}
function advance(game, seconds) {
  for (let i = 0; i < Math.round(seconds * 120); i++) game.update(1 / 120);
}

test('jump has a useful apex and returns to the ground', () => {
  const g = fresh(); g.jump(); let apex = 0;
  for (let i = 0; i < 120; i++) { g.update(1 / 120); apex = Math.max(apex, g.y); }
  assert(apex > 2 && apex < 2.3); assert(g.grounded); assert.equal(g.y, 0);
});
for (const speed of [17, 28]) test(`running into a gap costs one heart at speed ${speed}`, () => {
  const g = fresh(); g.speed = speed; g.distance = speed === 28 ? 2200 : 0;
  g.add('gap', 1, 7); advance(g, 1); assert.equal(g.health, 2);
});
test('coyote time accepts a jump after leaving a gap edge', () => {
  const g = fresh(); g.add('gap', 1, 2.75); advance(g, .1);
  assert(!g.grounded); g.jump(); advance(g, .2); assert(g.y > 1); assert.equal(g.health, 3);
});
test('a jump buffered before landing fires on the next takeoff', () => {
  const g = fresh(); g.jump(); advance(g, .7); assert(g.y > 0);
  g.jump(); advance(g, .18); assert(g.y > .3); assert(g.vy > 0);
  assert.equal(g.events.filter(e => e.type === 'jump').length, 2);
});
test('a fence can be jumped', () => {
  const g = fresh(); g.add('fence', 1, 7); g.jump(); advance(g, .7);
  assert.equal(g.health, 3); assert(g.events.some(e => e.type === 'clear'));
});
test('a branch can be ducked', () => {
  const g = fresh(); g.add('branch', 1, 4); g.crouch(); advance(g, .7);
  assert.equal(g.health, 3); assert(g.events.some(e => e.type === 'clear'));
});
test('hay requires a lane change even when jumping', () => {
  const g = fresh(); g.add('hay', 1, 7); g.jump(); advance(g, .7); assert.equal(g.health, 2);
});
test('mud slows the horse without taking a heart', () => {
  const g = fresh(); g.add('mud', 1, 4); advance(g, .5); assert.equal(g.health, 3); assert(g.slow > 0);
});
test('apples heal first and then grant a one-hit shield', () => {
  const g = fresh(); g.health = 2; g.collect(g.add('apple', 1, 0));
  assert.equal(g.health, 3); assert(!g.shield);
  g.collect(g.add('apple', 1, 0)); assert(g.shield);
  g.damage({ type: 'hay' }); assert(!g.shield); assert.equal(g.health, 3);
});
test('carrot rush protects against solid hazards and gaps', () => {
  const g = fresh(); g.collect(g.add('carrot', 1, 0));
  g.add('gap', 1, 7); g.add('hay', 1, 3); advance(g, 1); assert.equal(g.health, 3); assert(g.boost > 0);
});
test('lane changes stay within the track', () => {
  const g = fresh(); for (let i = 0; i < 8; i++) g.move(-1); advance(g, .6);
  assert.equal(g.lane, 0); assert(g.x > -3.11);
  for (let i = 0; i < 8; i++) g.move(1); advance(g, .6); assert.equal(g.lane, 2); assert(g.x < 3.11);
});
test('zero hearts ends the run and stops the simulation', () => {
  const g = fresh(); g.health = 1; g.damage({ type: 'hay' }); assert.equal(g.phase, 'over');
  const distance = g.distance; advance(g, 1); assert.equal(g.distance, distance);
});
test('reset clears temporary powerups and movement state', () => {
  const g = fresh(); Object.assign(g, { boost: 8, shield: true, health: 1, y: 2, duck: 1, combo: 20 });
  g.reset(4); assert.equal(g.health, 3); assert.equal(g.boost, 0); assert.equal(g.shield, false);
  assert.equal(g.combo, 0); assert.equal(g.y, 0); assert.equal(g.phase, 'ready');
});
test('100 seeded tracks preserve a safe lane in each opening obstacle row', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const g = new Run(seed), rows = new Map();
    for (const e of g.entities) if (e.row !== undefined) {
      if (!rows.has(e.row)) rows.set(e.row, new Set()); rows.get(e.row).add(e.lane);
    }
    for (const lanes of rows.values()) assert(lanes.size <= 2);
  }
});
test('identical seeds generate identical opening tracks', () => {
  assert.deepEqual(new Run(777).entities, new Run(777).entities);
});
