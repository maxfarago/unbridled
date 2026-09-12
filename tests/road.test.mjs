import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_WIDTH } from '../dist/engine.mjs';
import { PLAYER_Z, ROAD_SEGMENTS, RoadFrame, writeRoadStrip } from '../dist/road.mjs';

test('sample at the horse sits on the player station', () => {
  const frame = new RoadFrame();
  frame.setDistance(240);
  const p = frame.sample(0, 0);
  assert.ok(Math.abs(p.x) < 1e-9);
  assert.ok(Math.abs(p.z - PLAYER_Z) < 1e-9);
});

test('a lane offset at the horse stays near the lane width', () => {
  const frame = new RoadFrame();
  frame.setDistance(90);
  const left = frame.sample(0, -LANE_WIDTH);
  const right = frame.sample(0, LANE_WIDTH);
  assert.ok(Math.abs(left.x + LANE_WIDTH) < 1e-9);
  assert.ok(Math.abs(right.x - LANE_WIDTH) < 1e-9);
  assert.ok(Math.abs(left.z - PLAYER_Z) < 1e-9);
  assert.ok(Math.abs(right.z - PLAYER_Z) < 1e-9);
});

test('writeRoadStrip fills an existing buffer in place', () => {
  const frame = new RoadFrame();
  const positions = new Float32Array((ROAD_SEGMENTS + 1) * 6);
  const same = positions;
  writeRoadStrip(positions, frame, -4, 4);
  assert.equal(positions, same);
  assert.ok(positions.some(value => value !== 0));
});

test('advancing distance moves the far ribbon, not the horse origin', () => {
  const frame = new RoadFrame();
  const near = (ROAD_SEGMENTS + 1) * 6;
  const first = new Float32Array(near);
  const second = new Float32Array(near);
  frame.setDistance(0);
  writeRoadStrip(first, frame, -4, 4);
  const origin = frame.sample(0, 0);
  frame.setDistance(80);
  writeRoadStrip(second, frame, -4, 4);
  const originLater = frame.sample(0, 0);
  assert.ok(Math.abs(origin.x) < 1e-9);
  assert.ok(Math.abs(originLater.x) < 1e-9);
  assert.ok(Math.abs(origin.z - PLAYER_Z) < 1e-9);
  assert.ok(Math.abs(originLater.z - PLAYER_Z) < 1e-9);
  const far = ROAD_SEGMENTS * 6;
  assert.ok(Math.abs(first[far] - second[far]) > .5 || Math.abs(first[far + 2] - second[far + 2]) > .5);
});
