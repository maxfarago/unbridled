// Pure simulation: rendering and input devices are deliberately kept outside it.
export const LANES = [-3.1, 0, 3.1];
export const RULES = Object.freeze({ gravity: 27, jumpVelocity: 10.8, coyote: .13, buffer: .15, maxHealth: 3 });
export class Run {
  constructor(seed = Date.now()) { this.reset(seed); }
  reset(seed = Date.now()) {
    this.seed = seed >>> 0 || 1;
    Object.assign(this, { phase: 'ready', time: 0, distance: 0, score: 0, speed: 17,
      lane: 1, x: 0, y: 0, vy: 0, health: 3, boost: 0, shield: false,
      slow: 0, invincible: 0, duck: 0, grounded: true, sinceGround: 0,
      jumpBuffer: 0, combo: 0, comboTimer: 0, shoes: 0, collected: 0,
      dodges: 0, nextId: 1, nextRow: 66, rowIndex: 0, entities: [], events: [], reason: '' });
    for (let d = 17; d < 55; d += 7) this.add('shoe', 1, d);
    this.add('apple', 0, 45);
    this.populate();
  }
  random() { let t = this.seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  add(type, lane, d, extra = {}) { const e = { id: this.nextId++, type, lane, d, checked: false, taken: false, ...extra }; this.entities.push(e); return e; }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  start() { this.phase = 'running'; }
  move(dir) { if (this.phase !== 'running') return; const before = this.lane; this.lane = Math.max(0, Math.min(2, this.lane + dir)); if (before !== this.lane) this.emit('lane'); }
  jump() { if (this.phase === 'running') { this.jumpBuffer = RULES.buffer; this.duck = 0; } }
  crouch() { if (this.phase !== 'running') return; this.duck = .68; if (this.y > .1) this.vy = Math.min(this.vy, -17); this.emit('duck'); }
  populate() {
    while (this.nextRow < this.distance + 210) {
      const i = this.rowIndex++, d = this.nextRow - this.distance;
      const safe = Math.floor(this.random() * 3);
      const types = i < 4 ? ['fence', 'hay'] : ['fence', 'hay', 'branch', 'mud', 'gap', 'bees'];
      if (i % 7 === 6) {
        // Breathing room, with an optional powerup trail.
        for (let n = 0; n < 4; n++) this.add('shoe', safe, d + n * 5);
        this.add(i % 14 === 6 ? 'carrot' : 'apple', safe, d + 10);
      } else {
        for (let lane = 0; lane < 3; lane++) {
          if (lane === safe) continue;
          if (i < 3 && lane === (safe + 1) % 3) continue;
          const type = types[Math.floor(this.random() * types.length)];
          this.add(type, lane, d, { row: i });
          if (type === 'fence' || type === 'gap') {
            this.add('shoe', lane, d, { high: true });
            this.add('shoe', lane, d + 4, { high: true });
          }
        }
        for (let n = 0; n < 3; n++) this.add('shoe', safe, d + n * 5);
        if (i % 4 === 2) this.add(i % 8 === 2 ? 'carrot' : 'apple', safe, d + 17);
      }
      // At peak rush speed, consecutive decisions still have over one second.
      this.nextRow += 44 + this.random() * 7;
    }
  }
  damage(e) {
    if (this.invincible > 0 || this.boost > 0) { this.emit('smash', { entity: e }); return; }
    this.combo = 0; this.comboTimer = 0;
    if (this.shield) { this.shield = false; this.invincible = 1.2; this.emit('shieldBreak', { entity: e }); return; }
    this.health--; this.invincible = 1.65; this.slow = .8;
    this.emit('hit', { entity: e });
    if (this.health <= 0) this.finish(e.type === 'gap' ? 'That ditch came out of nowhere.' : e.type === 'bees' ? 'The bees won this round.' : 'A little too much horsepower.');
  }
  finish(reason) { if (this.phase !== 'running') return; this.phase = 'over'; this.reason = reason; this.emit('over'); }
  collect(e) {
    e.taken = true; this.collected++;
    if (e.type === 'shoe') {
      this.shoes++; this.combo = Math.min(this.combo + 1, 25); this.comboTimer = 3.2;
      const multiplier = this.multiplier; this.score += 10 * multiplier;
      this.emit('collect', { entity: e, multiplier });
    } else if (e.type === 'carrot') {
      this.boost = Math.min(this.boost + 5, 8); this.slow = 0; this.score += 50;
      this.emit('carrot', { entity: e });
    } else {
      if (this.health < 3) this.health++; else this.shield = true;
      this.score += 30; this.emit('apple', { entity: e });
    }
  }
  get multiplier() { return 1 + Math.floor(this.combo / 5); }
  update(dt) {
    if (this.phase !== 'running') return;
    this.time += dt;
    for (const key of ['boost', 'slow', 'invincible', 'duck', 'comboTimer', 'jumpBuffer']) this[key] = Math.max(0, this[key] - dt);
    if (!this.comboTimer) this.combo = 0;
    const targetSpeed = (17 + Math.min(11, this.distance / 200)) * (this.boost > 0 ? 1.35 : 1) * (this.slow > 0 ? .65 : 1);
    this.speed += (targetSpeed - this.speed) * (1 - Math.exp(-5 * dt));
    const travel = this.speed * dt;
    this.distance += travel; this.score += travel;
    this.x += (LANES[this.lane] - this.x) * (1 - Math.exp(-20 * dt));
    for (const e of this.entities) e.d -= travel;
    const pit = this.entities.find(e => e.type === 'gap' && Math.abs(e.d) < 2.7 && Math.abs(LANES[e.lane] - this.x) < 1.22);
    const supported = !pit || this.boost > 0 || this.invincible > 0;
    if (this.grounded && !supported) { this.grounded = false; this.sinceGround = 0; }
    if (this.grounded) this.sinceGround = 0; else this.sinceGround += dt;
    if (this.jumpBuffer > 0 && (this.grounded || this.sinceGround <= RULES.coyote)) {
      this.y = Math.max(0, this.y); this.vy = RULES.jumpVelocity; this.grounded = false; this.sinceGround = 1;
      this.jumpBuffer = 0; this.duck = 0; this.emit('jump');
    }
    if (!this.grounded) {
      this.vy -= RULES.gravity * dt; this.y += this.vy * dt;
      if (this.y <= 0 && supported) { this.y = 0; this.vy = 0; this.grounded = true; this.emit('land'); }
      // A fall must register even when the far lip arrives quickly at top speed.
      // This threshold still leaves the full coyote window to recover with a jump.
      if (this.y < -.26 && this.sinceGround > RULES.coyote) {
        const e = pit || { type: 'gap', lane: this.lane, d: 0 };
        if (!e.checked) { e.checked = true; this.damage(e); }
        this.y = 0; this.vy = 0; this.grounded = true;
        this.invincible = Math.max(this.invincible, .7);
        this.emit('rescue');
      }
    }
    if (this.phase !== 'running') return;
    for (const e of this.entities) {
      if (this.phase !== 'running') break;
      if (e.taken) continue;
      const dx = Math.abs(LANES[e.lane] - this.x);
      const collectible = ['shoe', 'carrot', 'apple'].includes(e.type);
      if (collectible) {
        const targetY = e.high ? 1.65 : .55;
        if (Math.abs(e.d) < 1.25 && dx < 1.05 && Math.abs(this.y - targetY) < (e.high ? 1.05 : 1.5)) this.collect(e);
        continue;
      }
      if (e.type === 'gap' || e.checked || e.d > .7) continue;
      e.checked = true;
      if (e.d < -1.5) continue;
      if (dx < 1.03) {
        const clear = (e.type === 'fence' && this.y > 1.0) || (e.type === 'branch' && this.duck > 0 && this.y < .25) || (e.type === 'mud' && this.y > .3);
        if (clear) { this.score += 25; this.dodges++; this.emit('clear', { entity: e }); }
        else if (e.type === 'mud' && this.boost <= 0) { this.slow = 1.8; this.combo = 0; this.emit('mud', { entity: e }); }
        else { this.damage(e); e.taken = true; }
      } else if (dx < 2.2) { this.score += 20; this.dodges++; this.emit('near', { entity: e }); }
    }
    this.entities = this.entities.filter(e => e.d > -14);
    this.populate();
  }
}
