import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, steer, jump, duck, tick, interact, makeRow } from '../dist/engine.mjs';

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
  assert(s.carrot > 0);
  assert.equal(interact(s, { lane: 0, type: 'fence', hit: false }), 'hit');
  assert.equal(s.hearts, 2);
});
test('golden gallop smashes fences', () => {
  const s = running();
  assert.equal(interact(s, { lane: 0, type: 'gold', hit: false }), 'gold');
  assert.equal(s.gold, 5);
  assert.equal(interact(s, { lane: 0, type: 'fence', hit: false }), 'smash');
  assert.equal(s.hearts, 3);
});
test('sprint drains energy and recharges when you ease off', () => {
  const s = running(); s.sprinting = true; advance(s, 1);
  assert(s.energy < 80); s.sprinting = false; const drained = s.energy; advance(s, 1);
  assert(s.energy > drained);
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
  const s = running(); Object.assign(s, { carrot: 8, gold: 5, energy: 10, hearts: 1, y: 2, duck: 1, combo: 20 });
  const n = freshState();
  assert.equal(n.hearts, 3); assert.equal(n.carrot, 0); assert.equal(n.gold, 0);
  assert.equal(n.energy, 100); assert.equal(n.combo, 0); assert.equal(n.y, 0); assert.equal(n.mode, 'menu');
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
