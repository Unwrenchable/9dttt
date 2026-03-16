/**
 * 9-Dimensional Oregon Trail
 * A nostalgic Oregon Trail-inspired game with a strategic 9-dimensional twist.
 * Canvas-based, fully standalone, vanilla JS only.
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const DIMENSION_NAMES = [
  '', // index 0 unused
  'Plains',
  'Rocky Mountains',
  'Desert Wasteland',
  'Frozen Tundra',
  'Dark Forest',
  'River Valley',
  'Volcanic Lands',
  'Sky Realm',
  'Dimension Zero',
];

const DIMENSION_PALETTES = [
  null,
  { sky: ['#87CEEB', '#b0e0ff'], ground: '#5a8a3a', accent: '#7ec850', particle: '#90ee90' },
  { sky: ['#8899aa', '#c0ccd8'], ground: '#7a7a8a', accent: '#ffffff', particle: '#e0e8f0' },
  { sky: ['#e8842a', '#f5c060'], ground: '#c8a040', accent: '#ff6020', particle: '#ffe070' },
  { sky: ['#b0c8e8', '#e8f4ff'], ground: '#d0e8f8', accent: '#80b8e0', particle: '#ffffff' },
  { sky: ['#0a2010', '#142a18'], ground: '#1a3020', accent: '#2d5030', particle: '#00ff80' },
  { sky: ['#3a7a5a', '#5aaa7a'], ground: '#2a6040', accent: '#40c080', particle: '#60f0a0' },
  { sky: ['#220000', '#440800'], ground: '#3a1000', accent: '#ff4400', particle: '#ff8830' },
  { sky: ['#1a0040', '#3a00a0'], ground: '#180038', accent: '#9040ff', particle: '#c080ff' },
  { sky: ['#000000', '#100020'], ground: '#0a0015', accent: '#8800ff', particle: '#ff00ff' },
];

const DAYS_PER_DIMENSION = 30;
const TOTAL_DIMENSIONS = 9;
const CANVAS_W = 800;
const CANVAS_H = 500;

const HUD_H = 70;      // top HUD height
const STATUS_H = 110;  // bottom status panel height
const TRAVEL_H = CANVAS_H - HUD_H - STATUS_H; // 320 middle travel view

const EVENT_MESSAGES = {
  disease:       ['A plague sweeps the party!', 'Dimensional flu strikes your crew.', 'Someone ate quantum berries. Bad idea.'],
  wheel:         ['Your wagon wheel shattered on a rift stone.', 'Axle cracked crossing a warp seam.', 'Wheel splintered on a crystal outcrop.'],
  weather:       ['Warm dimensional winds boost morale!', 'A cosmic rainbow lifts everyone\'s spirits.', 'The air smells of fresh possibility.'],
  hunting:       ['Wild game spotted nearby!', 'A crystal beast shimmers in the distance!', 'Dimensional deer graze ahead!'],
  bandit:        ['Temporal bandits raided your wagon!', 'Rift pirates stole your supplies!', 'Dimension thieves struck in the night!'],
  ox_died:       ['An ox was absorbed by a spatial rift.', 'A quantum wolf claimed your ox.', 'One ox phased out of existence.'],
  supplies:      ['Found an abandoned dimensional cache!', 'Discovered a pioneer\'s lost wagon!', 'Ancient trail supplies materialized!'],
  rift:          ['A dimensional rift opens before you!', 'Reality flickers — a rift event!', 'Space-time folds — a crystal rift appears!'],
  rain:          ['Heavy dimensional rain floods the path.', 'Quantum storms slow your progress.', 'A space-rain front slows travel.'],
  sick:          ['A party member has rift-sickness.', 'Dimensional vertigo strikes someone.', 'A traveller phased out briefly — they\'re sick.'],
};

const DEATH_MESSAGES = [
  'You have been scattered across dimensions.',
  'Your party dissolved into the rift.',
  'You have died of quantum dysentery.',
  'The 9th dimension reclaimed your soul.',
  'Your wagon phased out of existence.',
  'Reality collapsed. Your journey ended.',
];

const ANIMALS = [
  { name: 'Rabbit',        emoji: '🐇', food: 20,  crystals: 0, speed: 3.5, size: 18, color: '#c8a070', score: 10  },
  { name: 'Deer',          emoji: '🦌', food: 80,  crystals: 0, speed: 2.5, size: 28, color: '#a06030', score: 25  },
  { name: 'Buffalo',       emoji: '🦬', food: 300, crystals: 0, speed: 1.8, size: 44, color: '#704020', score: 50  },
  { name: 'Crystal Beast', emoji: '💎', food: 50,  crystals: 3, speed: 2.0, size: 36, color: '#a040ff', score: 100 },
];

const STORE_PRICES = [ // base prices, multiplied per dimension tier
  { id: 'food',     name: 'Food (50 lbs)',   base: 15  },
  { id: 'water',    name: 'Water (20 gal)',  base: 10  },
  { id: 'oxen',     name: 'Ox',              base: 80  },
  { id: 'ammo',     name: 'Ammo (50)',       base: 20  },
  { id: 'medicine', name: 'Medicine (dose)', base: 30  },
];

// ─── Particle ─────────────────────────────────────────────────────────────────

class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }
  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  get alive() { return this.life > 0; }
}

// ─── Main Game Class ────────────────────────────────────────────────────────

class OregonTrailGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas 2D context unavailable');

    // Game state
    this.gameState = 'title'; // title | setup | traveling | event | hunting | store | river | gameover | victory
    this.dimension = 1;
    this.dayInDimension = 1;
    this.totalDay = 1;

    // Resources
    this.resources = {
      food: 500, water: 100, health: 100,
      money: 500, oxen: 6, ammo: 200,
      medicine: 10, morale: 75, crystals: 0,
    };

    // Travel
    this.scrollX       = 0;
    this.wagonX        = 200;
    this.wagonY        = HUD_H + TRAVEL_H / 2 + 30;
    this.wheelAngle    = 0;
    this.travelSpeed   = 60; // pixels/sec
    this.moving        = false;
    this.travelPaused  = false;

    // Particles
    this.particles = [];

    // Status messages (bottom panel)
    this.statusLog = ['Welcome, pioneer! Your journey begins.', 'Press SPACE or click "Travel" to advance.'];
    this.statusScroll = 0;

    // Event data
    this.currentEvent    = null;
    this.eventChoices    = [];
    this.eventResult     = null;
    this.eventResultTimer = 0;

    // River crossing
    this.riverDepth = 0;
    this.riverSpeed = 0;

    // Hunting
    this.huntAnimals  = [];
    this.huntTimer    = 30;
    this.huntAmmoUsed = 0;
    this.huntFood     = 0;
    this.huntCrystals = 0;
    this.huntShots    = [];
    this.huntDone     = false;

    // Store
    this.storeMessage = '';
    this.storePrices  = [];

    // UI buttons (computed on render, clicked by coords)
    this.buttons = [];

    // Animation
    this.lastTime   = 0;
    this.frameId    = null;
    this.cloudX     = [80, 250, 420, 600, 740];

    // End-game
    this.finalScore = 0;
    this.deathMsg   = '';

    // Party size (narrative)
    this.partySurvivors = 4;
    this.partyStarted   = false;

    // Day counter for auto-advance
    this.dayTimer = 0;
    this.dayDuration = 3; // seconds per travel day

    // Input guard
    this._inputSetup = false;

    // Terrain features per dimension (for scrolling)
    this.terrainFeatures = [];
    this._rebuildTerrain();
  }

  // ─── Init ────────────────────────────────────────────────────────────────

  init() {
    this._setupInput();
    this._loop(0);
  }

  _setupInput() {
    if (this._inputSetup) return;
    this._inputSetup = true;

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top)  * scaleY;
      this.handleClick(x, y);
    });

    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  // ─── Game Loop ───────────────────────────────────────────────────────────

  _loop(ts) {
    const dt = Math.min((ts - this.lastTime) / 1000, 0.1);
    this.lastTime = ts;
    this.update(dt);
    this.render(this.ctx);
    this.frameId = requestAnimationFrame((t) => this._loop(t));
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(dt) {
    // Advance particles
    this.particles = this.particles.filter(p => { p.update(dt); return p.alive; });
    this._spawnAmbientParticles(dt);

    // Cloud drift
    for (let i = 0; i < this.cloudX.length; i++) {
      this.cloudX[i] -= 12 * dt;
      if (this.cloudX[i] < -120) this.cloudX[i] = CANVAS_W + 80;
    }

    switch (this.gameState) {
      case 'traveling': this._updateTravel(dt); break;
      case 'hunting':   this._updateHunting(dt); break;
      case 'event':
        if (this.eventResultTimer > 0) {
          this.eventResultTimer -= dt;
          if (this.eventResultTimer <= 0) {
            this.eventResult = null;
            this.gameState = 'traveling';
          }
        }
        break;
    }
  }

  _updateTravel(dt) {
    if (this.travelPaused || !this.moving) return;

    // Scroll landscape
    this.scrollX += this.travelSpeed * dt;
    this.wheelAngle += dt * 3;

    // Day timer
    this.dayTimer += dt;
    if (this.dayTimer >= this.dayDuration) {
      this.dayTimer = 0;
      this.advanceDay();
    }
  }

  _updateHunting(dt) {
    if (this.huntDone) return;
    this.huntTimer -= dt;
    if (this.huntTimer <= 0) { this._endHunting(); return; }

    // Move animals
    for (const a of this.huntAnimals) {
      a.x -= a.speed * 60 * dt;
      if (a.x < -60) {
        a.x = CANVAS_W + 60;
        a.y = HUD_H + 20 + Math.random() * (TRAVEL_H - 40);
      }
    }

    // Move shot indicators
    this.huntShots = this.huntShots.filter(s => {
      s.life -= dt;
      return s.life > 0;
    });
  }

  // ─── Day Advance ─────────────────────────────────────────────────────────

  advanceDay() {
    const dim = this.dimension;

    // Daily consumption
    let foodRate  = 5 + dim;
    let waterRate = 3 + (dim === 3 ? 4 : 0); // desert doubles water
    let healthLoss = 0;

    if (dim === 4) foodRate *= 2; // tundra: double food
    if (dim === 9) { foodRate = Math.ceil(foodRate * 1.5); waterRate = Math.ceil(waterRate * 1.5); }

    // Morale affects health
    if (this.resources.morale < 30) healthLoss += 1;
    if (this.resources.health < 50)  healthLoss += 1;

    this.resources.food  = Math.max(0, this.resources.food  - foodRate);
    this.resources.water = Math.max(0, this.resources.water - waterRate);
    this.resources.health = Math.max(0, this.resources.health - healthLoss);
    this.resources.morale = Math.max(0, Math.min(100, this.resources.morale - 0.5 + (Math.random() > 0.7 ? 1 : 0)));

    // Starvation
    if (this.resources.food === 0)  { this.resources.health -= 5; this._log('⚠️ No food! Health dropping.'); }
    if (this.resources.water === 0) { this.resources.health -= 7; this._log('⚠️ No water! Health failing!'); }

    // Check oxen
    if (this.resources.oxen < 2) {
      this._lose('Not enough oxen to pull the wagon.');
      return;
    }

    // Check health
    if (this.resources.health <= 0) {
      this.partySurvivors = Math.max(0, this.partySurvivors - 1);
      if (this.partySurvivors <= 0) { this._lose('Your entire party perished.'); return; }
      this.resources.health = 20 + Math.floor(Math.random() * 20);
      this._log(`💀 A party member died! ${this.partySurvivors} survivors remain.`);
    }

    this.dayInDimension++;
    this.totalDay++;

    // Random event (40% chance)
    if (Math.random() < 0.40) {
      this._triggerRandomEvent();
    }

    // River crossing check (certain days)
    if (this.dayInDimension === 10 || (dim === 6 && this.dayInDimension % 7 === 0)) {
      this._triggerRiverCrossing();
      return;
    }

    // Dimension complete?
    this.checkDimensionComplete();
  }

  checkDimensionComplete() {
    if (this.dayInDimension > DAYS_PER_DIMENSION) {
      this.dayInDimension = 1;
      if (this.dimension >= TOTAL_DIMENSIONS) {
        this._win();
      } else {
        this.dimension++;
        this._log(`✨ Entering Dimension ${this.dimension}: ${DIMENSION_NAMES[this.dimension]}!`);
        this._rebuildTerrain();
        this.scrollX = 0;
        // Gain a crystal for completing a dimension
        this.resources.crystals++;
        this.moving = false;
        this.gameState = 'store';
        this._buildStorePrices();
      }
    }
  }

  // ─── Events ──────────────────────────────────────────────────────────────

  _triggerRandomEvent() {
    const events = [
      'disease','wheel','weather','hunting',
      'bandit','ox_died','supplies','rift','rain','sick',
    ];
    // Weight towards dimension-specific events
    let pool = [...events];
    if (this.dimension === 3) pool.push('rain','rain'); // desert has more events
    if (this.dimension === 9) pool.push('rift','rift','rift');

    const type = pool[Math.floor(Math.random() * pool.length)];
    const msgs  = EVENT_MESSAGES[type] || ['Something happened.'];
    const msg   = msgs[Math.floor(Math.random() * msgs.length)];

    this.currentEvent = { type, msg };
    this.eventChoices = [];
    this.moving = false;

    switch (type) {
      case 'disease':
        this.eventChoices = [
          { label: 'Use Medicine (-1 dose)', action: () => {
            if (this.resources.medicine > 0) {
              this.resources.medicine--;
              this.resources.health = Math.min(100, this.resources.health + 15);
              this._showResult('Medicine administered. Health improved.');
            } else {
              this.resources.health -= 20;
              this._showResult('No medicine! Health worsened.');
            }
          }},
          { label: 'Rest and hope', action: () => {
            this.resources.health -= 10;
            this.resources.morale -= 5;
            this._showResult('You rested. Health declined slightly.');
          }},
        ]; break;

      case 'wheel':
        this.eventChoices = [
          { label: `Repair (costs $${20 + this.dimension * 5})`, action: () => {
            const cost = 20 + this.dimension * 5;
            if (this.resources.money >= cost) {
              this.resources.money -= cost;
              this._showResult('Wheel repaired. Journey continues.');
            } else {
              this.resources.morale -= 15;
              this._showResult('Not enough money! Morale takes a hit.');
            }
          }},
          { label: 'Improvise (lose 2 days)', action: () => {
            this.dayInDimension += 2;
            this.totalDay += 2;
            this._showResult('Improvised repair done — lost 2 days.');
          }},
        ]; break;

      case 'weather':
        this.resources.morale = Math.min(100, this.resources.morale + 15);
        this._log('☀️ ' + msg);
        this.moving = true;
        return;

      case 'hunting':
        this.eventChoices = [
          { label: 'Go Hunting!', action: () => this._startHunting() },
          { label: 'Keep moving', action: () => {
            this._showResult('You pressed on. No food gathered.');
          }},
        ]; break;

      case 'bandit':
        this.resources.food  = Math.max(0, this.resources.food  - 60);
        this.resources.money = Math.max(0, this.resources.money - 50);
        this.resources.ammo  = Math.max(0, this.resources.ammo  - 20);
        this.resources.morale -= 20;
        this.eventChoices = [
          { label: 'Continue on...', action: () => {
            this._showResult('You lost supplies but survived the raid.');
          }},
        ]; break;

      case 'ox_died':
        this.resources.oxen = Math.max(0, this.resources.oxen - (Math.random() < 0.3 ? 2 : 1));
        this.resources.morale -= 10;
        this.eventChoices = [
          { label: 'Mourn and press on', action: () => {
            if (this.resources.oxen < 2) {
              this._lose('Not enough oxen remain to pull the wagon.');
            } else {
              this._showResult(`You have ${this.resources.oxen} ox(en) left.`);
            }
          }},
        ]; break;

      case 'supplies':
        this.resources.food     += 80;
        this.resources.medicine += Math.random() < 0.5 ? 2 : 0;
        this.resources.ammo     += Math.random() < 0.5 ? 30 : 0;
        this.resources.morale    = Math.min(100, this.resources.morale + 10);
        this.eventChoices = [
          { label: 'Collect supplies!', action: () => {
            this._showResult('Supplies loaded! Spirits lifted.');
          }},
        ]; break;

      case 'rift':
        this.eventChoices = [
          { label: 'Enter the rift', action: () => {
            const gain = Math.random() < 0.5;
            if (gain) {
              this.resources.crystals += 2;
              this.dayInDimension = Math.max(1, this.dayInDimension - 3);
              this._showResult('The rift warped you forward! +2 crystals.');
            } else {
              this.resources.health -= 15;
              this.dayInDimension += 3;
              this.totalDay += 3;
              this._showResult('The rift was unstable! Lost 3 days & health.');
            }
          }},
          { label: 'Avoid the rift', action: () => {
            this._showResult('You detoured safely around the rift.');
          }},
        ]; break;

      case 'rain':
        this.dayInDimension++;
        this.totalDay++;
        this.resources.water = Math.min(200, this.resources.water + 20);
        this.resources.morale -= 5;
        this.eventChoices = [
          { label: 'Wait it out', action: () => {
            this._showResult('Rain let up. Trail is muddy but passable.');
          }},
        ]; break;

      case 'sick':
        this.eventChoices = [
          { label: 'Treat with medicine (-1)', action: () => {
            if (this.resources.medicine > 0) {
              this.resources.medicine--;
              this._showResult('Medicine administered. Party member recovers.');
            } else {
              this.resources.health -= 12;
              this._showResult('No medicine — health dropped.');
            }
          }},
          { label: 'Rest 1 day', action: () => {
            this.dayInDimension++;
            this.totalDay++;
            this.resources.health = Math.min(100, this.resources.health + 5);
            this._showResult('Rest helped. Back on the trail.');
          }},
        ]; break;

      default:
        this.moving = true;
        return;
    }

    this.gameState = 'event';
    this._log('📢 ' + msg);
  }

  _showResult(msg) {
    this.eventResult = msg;
    this.eventResultTimer = 2.5;
    this._log(msg);
    this.gameState = 'event';
    setTimeout(() => {
      if (this.gameState === 'event') {
        this.gameState = 'traveling';
        this.moving = true;
      }
    }, 2500);
  }

  // ─── River Crossing ──────────────────────────────────────────────────────

  _triggerRiverCrossing() {
    this.riverDepth = 1 + Math.random() * 5 * (this.dimension / 3);
    this.riverSpeed = 0.5 + Math.random() * 3;
    this.moving = false;
    this.gameState = 'river';
    this._log(`🌊 River crossing! Depth: ${this.riverDepth.toFixed(1)}ft, Speed: ${this.riverSpeed.toFixed(1)} mph`);
  }

  _resolveRiver(choice) {
    const d = this.riverDepth;
    const s = this.riverSpeed;

    switch (choice) {
      case 'ford': {
        const risk = d / 5 + s / 4;
        if (Math.random() < risk * 0.4) {
          this.resources.food  = Math.max(0, this.resources.food  - 50);
          this.resources.oxen  = Math.max(0, this.resources.oxen  - 1);
          this._log('💧 Fording went badly! Lost supplies and an ox.');
        } else {
          this._log('✅ Forded the river safely!');
        }
        break;
      }
      case 'caulk': {
        const risk = s / 5;
        if (Math.random() < risk * 0.5) {
          this.resources.food  = Math.max(0, this.resources.food  - 100);
          this.resources.ammo  = Math.max(0, this.resources.ammo  - 40);
          this._log('🌀 The wagon flipped! Lost food and ammo.');
        } else {
          this._log('✅ Floated across safely!');
        }
        break;
      }
      case 'ferry': {
        const cost = Math.round(10 + (d + s) * 5);
        if (this.resources.money >= cost) {
          this.resources.money -= cost;
          this._log(`✅ Ferry ride cost $${cost}. Safe crossing!`);
        } else {
          this._log('💸 Not enough money for ferry. Forced to ford!');
          this._resolveRiver('ford');
          return;
        }
        break;
      }
      case 'wait': {
        this.dayInDimension += 2;
        this.totalDay += 2;
        this.riverDepth = Math.max(0.5, this.riverDepth - 1.5);
        this._log('⏳ Waited 2 days. River level dropped.');
        // Now ford it
        this._resolveRiver('ford');
        return;
      }
    }

    this.gameState = 'traveling';
    this.moving = true;
    this.checkDimensionComplete();
  }

  // ─── Hunting ─────────────────────────────────────────────────────────────

  _startHunting() {
    this.huntAnimals  = [];
    this.huntTimer    = 30;
    this.huntAmmoUsed = 0;
    this.huntFood     = 0;
    this.huntCrystals = 0;
    this.huntShots    = [];
    this.huntDone     = false;
    this.currentEvent = null;

    // Spawn animals
    const count = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const template = ANIMALS[Math.random() < 0.15 ? 3 : Math.floor(Math.random() * 3)];
      this.huntAnimals.push({
        ...template,
        x: CANVAS_W + 60 + Math.random() * 200,
        y: HUD_H + 20 + Math.random() * (TRAVEL_H - 40),
        id: Math.random(),
        hit: false,
      });
    }

    this.gameState = 'hunting';
    this._log('🦌 Hunting started! Click animals to shoot. 30 seconds!');
  }

  _shootAt(x, y) {
    if (this.huntDone) return;
    if (this.resources.ammo <= 0) {
      this._log('❌ Out of ammo!');
      return;
    }
    this.resources.ammo--;
    this.huntAmmoUsed++;
    this.huntShots.push({ x, y, life: 0.5 });

    for (const a of this.huntAnimals) {
      if (a.hit) continue;
      const dx = a.x - x;
      const dy = a.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < a.size + 10) {
        a.hit = true;
        this.huntFood     += a.food;
        this.huntCrystals += a.crystals;
        this._spawnHitParticles(a.x, a.y, a.color);
        break;
      }
    }
  }

  _endHunting() {
    if (this.huntDone) return;
    this.huntDone = true;
    this.resources.food     += this.huntFood;
    this.resources.crystals += this.huntCrystals;
    const msg = `Hunting over: gained ${this.huntFood} lbs food${this.huntCrystals ? `, ${this.huntCrystals} crystals` : ''}.`;
    this._log('🍖 ' + msg);
    setTimeout(() => {
      this.gameState = 'traveling';
      this.moving = true;
    }, 2000);
  }

  // ─── Store ───────────────────────────────────────────────────────────────

  _buildStorePrices() {
    const tier = Math.ceil(this.dimension / 3); // 1-3
    this.storePrices = STORE_PRICES.map(item => ({
      ...item,
      price: Math.round(item.base * (1 + (tier - 1) * 0.5)),
    }));
    this.storeMessage = `Frontier Store — Dimension ${this.dimension} prices`;
  }

  _buyItem(id) {
    const item = this.storePrices.find(i => i.id === id);
    if (!item) return;
    if (this.resources.money < item.price) {
      this.storeMessage = `Not enough gold! Need $${item.price}.`;
      return;
    }
    this.resources.money -= item.price;
    switch (id) {
      case 'food':     this.resources.food     += 50;  break;
      case 'water':    this.resources.water     += 20;  break;
      case 'oxen':     this.resources.oxen      += 1;   break;
      case 'ammo':     this.resources.ammo      += 50;  break;
      case 'medicine': this.resources.medicine  += 1;   break;
    }
    this.storeMessage = `Purchased: ${item.name} for $${item.price}.`;
  }

  // ─── Win / Lose ──────────────────────────────────────────────────────────

  _win() {
    this.gameState = 'victory';
    this.moving    = false;
    // Calculate score
    const r = this.resources;
    this.finalScore =
      this.partySurvivors * 1000 +
      r.crystals * 500 +
      Math.floor(r.food / 10) +
      r.money * 2 +
      r.medicine * 100 +
      Math.max(0, (DAYS_PER_DIMENSION * TOTAL_DIMENSIONS - this.totalDay)) * 50;
    this._log(`🏆 VICTORY! Score: ${this.finalScore}`);
    this._submitScore(this.finalScore);
  }

  _lose(reason) {
    this.gameState = 'gameover';
    this.moving    = false;
    this.deathMsg  = DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
    this._log(`💀 ${reason}`);
  }

  _log(msg) {
    this.statusLog.unshift(msg);
    if (this.statusLog.length > 50) this.statusLog.pop();
  }

  // ─── Score Reporting ─────────────────────────────────────────────────────

  async _submitScore(score) {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: '9d-oregon-trail', score }),
      });
      if (!res.ok) throw new Error('Score submit failed');
    } catch (_) { /* silently ignore — game works offline */ }
  }

  // ─── Particles ───────────────────────────────────────────────────────────

  _spawnAmbientParticles(dt) {
    const p = DIMENSION_PALETTES[this.dimension] || DIMENSION_PALETTES[1];
    const rate = 0.15 * dt;
    if (Math.random() < rate) {
      const x = Math.random() * CANVAS_W;
      const y = Math.random() * TRAVEL_H + HUD_H;
      this.particles.push(new Particle(x, y, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, p.particle, 1.5 + Math.random(), 2 + Math.random() * 3));
    }

    // Dimension-specific effects
    switch (this.dimension) {
      case 4: // snow
        if (Math.random() < 0.3) {
          this.particles.push(new Particle(Math.random() * CANVAS_W, HUD_H - 5, -5 + Math.random() * 10, 40 + Math.random() * 20, '#ffffff', 2, 2 + Math.random() * 2));
        }
        break;
      case 7: // ash
        if (Math.random() < 0.25) {
          this.particles.push(new Particle(Math.random() * CANVAS_W, HUD_H + TRAVEL_H, -10 + Math.random() * 20, -30 - Math.random() * 30, '#ff8830', 2, 3 + Math.random() * 3));
        }
        break;
      case 9: // glitch
        if (Math.random() < 0.1) {
          this.particles.push(new Particle(Math.random() * CANVAS_W, Math.random() * CANVAS_H, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, Math.random() < 0.5 ? '#ff00ff' : '#00ffff', 0.5, 4 + Math.random() * 4));
        }
        break;
    }
  }

  _spawnHitParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      this.particles.push(new Particle(x, y, Math.cos(angle) * 80, Math.sin(angle) * 80, color, 0.6, 4));
    }
  }

  // ─── Terrain Builder ─────────────────────────────────────────────────────

  _rebuildTerrain() {
    this.terrainFeatures = [];
    for (let i = 0; i < 20; i++) {
      this.terrainFeatures.push({
        x: i * 160 + Math.random() * 60,
        type: Math.floor(Math.random() * 4),
        scale: 0.5 + Math.random() * 1.5,
      });
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  render(ctx) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    switch (this.gameState) {
      case 'title':       this.renderTitle(ctx);    break;
      case 'setup':       this.renderSetup(ctx);    break;
      case 'traveling':   this.renderTravel(ctx);   break;
      case 'event':       this.renderEvent(ctx);    break;
      case 'hunting':     this.renderHunting(ctx);  break;
      case 'store':       this.renderStore(ctx);    break;
      case 'river':       this.renderRiver(ctx);    break;
      case 'gameover':    this.renderGameOver(ctx); break;
      case 'victory':     this.renderVictory(ctx);  break;
    }
  }

  // ─── Title Screen ────────────────────────────────────────────────────────

  renderTitle(ctx) {
    this._drawDimBackground(ctx, 9); // use dramatic dimension 9 backdrop
    ctx.save();
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Title
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur  = 30;
    ctx.fillStyle   = '#ffee44';
    ctx.font        = 'bold 52px "Courier New", monospace';
    ctx.fillText('9D OREGON TRAIL', CANVAS_W / 2, 130);

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = '#aaffff';
    ctx.font        = '22px "Courier New", monospace';
    ctx.fillText('Survive the Dimensional Frontier', CANVAS_W / 2, 175);

    ctx.shadowBlur  = 0;
    ctx.fillStyle   = '#888888';
    ctx.font        = '14px "Courier New", monospace';
    ctx.fillText('Travel 9 bizarre dimensions — Oregon Trail never looked like this.', CANVAS_W / 2, 210);

    // Wagon art (centered)
    this.drawWagon(ctx, CANVAS_W / 2 - 60, 270, 0);

    ctx.restore();

    // Buttons
    this.buttons = [];
    this._drawButton(ctx, CANVAS_W / 2, 380, 200, 44, '▶  START JOURNEY', '#ffee44', '#222', 'start');
    this._drawButton(ctx, CANVAS_W / 2, 440, 200, 36, '? HOW TO PLAY',     '#00ffff', '#000', 'howto');
  }

  // ─── Setup ───────────────────────────────────────────────────────────────

  renderSetup(ctx) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffee44';
    ctx.font      = 'bold 30px "Courier New", monospace';
    ctx.fillText('FRONTIER OUTPOST', CANVAS_W / 2, 60);

    ctx.fillStyle = '#aaffaa';
    ctx.font      = '16px "Courier New", monospace';
    ctx.fillText('You begin with:', CANVAS_W / 2, 100);

    const items = [
      `🌽 Food: 500 lbs`,
      `💧 Water: 100 gallons`,
      `❤️  Health: 100%`,
      `💰 Money: $500`,
      `🐂 Oxen: 6`,
      `🔫 Ammo: 200 bullets`,
      `💊 Medicine: 10 doses`,
      `😊 Morale: 75%`,
      `💎 Dimension Crystals: 0`,
    ];

    ctx.textAlign = 'left';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#dddddd';
    items.forEach((item, i) => {
      const col = i < 5 ? 180 : 460;
      const row = (i < 5 ? i : i - 5);
      ctx.fillText(item, col, 135 + row * 28);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc00';
    ctx.font      = '13px "Courier New", monospace';
    ctx.fillText('Travel 9 dimensions, 30 days each. Survive!', CANVAS_W / 2, 310);

    ctx.fillStyle = '#aaaaff';
    ctx.fillText('Click "Travel" to advance days. Watch your resources.', CANVAS_W / 2, 333);
    ctx.fillText('Random events will test your pioneer spirit!', CANVAS_W / 2, 356);

    this.buttons = [];
    this._drawButton(ctx, CANVAS_W / 2, 415, 220, 46, '🪄  BEGIN JOURNEY!', '#ffee44', '#1a1a00', 'begin');
    this._drawButton(ctx, CANVAS_W / 2, 470, 180, 34, '← Back', '#888888', '#111', 'title');
  }

  // ─── Traveling Screen ────────────────────────────────────────────────────

  renderTravel(ctx) {
    this.drawLandscape(ctx, this.dimension, this.scrollX);
    this.drawParticles(ctx);
    this.drawWagon(ctx, this.wagonX, this.wagonY, this.wheelAngle);
    this.drawHUD(ctx);
    this._drawStatusPanel(ctx);
    this._drawTravelButtons(ctx);
  }

  // ─── Event Screen ────────────────────────────────────────────────────────

  renderEvent(ctx) {
    this.drawLandscape(ctx, this.dimension, this.scrollX);
    this.drawParticles(ctx);
    this.drawWagon(ctx, this.wagonX, this.wagonY, this.wheelAngle);
    this.drawHUD(ctx);

    // Event modal
    const mw = 520, mh = this.eventChoices.length > 0 ? 200 + this.eventChoices.length * 54 : 200;
    const mx = (CANVAS_W - mw) / 2;
    const my = HUD_H + (TRAVEL_H - mh) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeStyle = '#ffee44';
    ctx.lineWidth   = 3;
    this._roundRect(ctx, mx, my, mw, mh, 12);
    ctx.fill(); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffee44';
    ctx.font      = 'bold 18px "Courier New", monospace';
    ctx.fillText('— EVENT —', CANVAS_W / 2, my + 35);

    ctx.fillStyle = '#ffffff';
    ctx.font      = '15px "Courier New", monospace';
    this._wrapText(ctx, this.currentEvent?.msg || '', CANVAS_W / 2, my + 70, mw - 40, 22);

    if (this.eventResult) {
      ctx.fillStyle = '#00ff88';
      ctx.font      = 'bold 14px "Courier New", monospace';
      ctx.fillText(this.eventResult, CANVAS_W / 2, my + 110);
    }

    this.buttons = [];
    if (!this.eventResult && this.eventChoices.length > 0) {
      this.eventChoices.forEach((choice, i) => {
        this._drawButton(ctx, CANVAS_W / 2, my + 120 + i * 54, 380, 42, choice.label, '#ffee44', '#1a1a00', `choice_${i}`);
      });
    }

    ctx.restore();
  }

  // ─── Hunting Screen ──────────────────────────────────────────────────────

  renderHunting(ctx) {
    // Draw dimension background (slightly dimmed)
    this.drawLandscape(ctx, this.dimension, this.scrollX);
    this.drawParticles(ctx);
    this.drawHUD(ctx);

    // Hunting overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, HUD_H, CANVAS_W, TRAVEL_H);

    // Animals
    for (const a of this.huntAnimals) {
      if (a.hit) continue;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, a.size, a.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font      = `${a.size * 1.2}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.emoji, 0, 0);
      ctx.restore();
    }

    // Shot indicators
    for (const s of this.huntShots) {
      ctx.save();
      ctx.globalAlpha = s.life * 2;
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Timer
    ctx.textAlign = 'center';
    ctx.fillStyle = this.huntTimer < 10 ? '#ff4444' : '#ffee44';
    ctx.font      = 'bold 24px "Courier New", monospace';
    ctx.fillText(`🕐 ${Math.ceil(this.huntTimer)}s`, CANVAS_W / 2, HUD_H + 40);

    ctx.fillStyle = '#ffffff';
    ctx.font      = '14px "Courier New", monospace';
    ctx.fillText(`Ammo: ${this.resources.ammo}  |  Food bagged: ${this.huntFood} lbs  |  Click to shoot!`, CANVAS_W / 2, HUD_H + 65);

    if (this.huntDone) {
      ctx.fillStyle = '#00ff88';
      ctx.font      = 'bold 22px "Courier New", monospace';
      ctx.fillText(`Hunting over! +${this.huntFood} lbs food${this.huntCrystals ? `, +${this.huntCrystals} crystals` : ''}`, CANVAS_W / 2, CANVAS_H / 2);
    }

    ctx.restore();
    this._drawStatusPanel(ctx);

    // Stop / done button
    this.buttons = [];
    if (!this.huntDone) {
      this._drawButton(ctx, CANVAS_W - 80, HUD_H + TRAVEL_H - 30, 120, 36, 'Stop Hunt', '#ff8888', '#2a0000', 'stop_hunt');
    }
  }

  // ─── Store Screen ────────────────────────────────────────────────────────

  renderStore(ctx) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffee44';
    ctx.font      = 'bold 26px "Courier New", monospace';
    ctx.fillText('🏪 FRONTIER STORE', CANVAS_W / 2, 55);

    ctx.fillStyle = '#aaffaa';
    ctx.font      = '15px "Courier New", monospace';
    ctx.fillText(this.storeMessage, CANVAS_W / 2, 85);

    ctx.fillStyle = '#ffcc66';
    ctx.font      = '16px "Courier New", monospace';
    ctx.fillText(`Your Gold: $${this.resources.money}`, CANVAS_W / 2, 115);

    this.buttons = [];
    const startY = 150;
    this.storePrices.forEach((item, i) => {
      const bx = CANVAS_W / 2;
      const by = startY + i * 56;
      const label = `Buy ${item.name} — $${item.price}`;
      this._drawButton(ctx, bx, by, 380, 42, label, '#88ffaa', '#0a2010', `buy_${item.id}`);
    });

    // Resource summary
    const r = this.resources;
    const summaryY = startY + this.storePrices.length * 56 + 20;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '13px "Courier New", monospace';
    ctx.fillText(`Food: ${r.food}  Water: ${r.water}  Oxen: ${r.oxen}  Ammo: ${r.ammo}  Medicine: ${r.medicine}`, CANVAS_W / 2, summaryY);
    ctx.fillText(`Dimension ${this.dimension} → ${this.dimension + 1 <= TOTAL_DIMENSIONS ? DIMENSION_NAMES[this.dimension + 1] : 'VICTORY'}`, CANVAS_W / 2, summaryY + 24);

    this._drawButton(ctx, CANVAS_W / 2, summaryY + 68, 220, 44, '▶  Leave Store', '#ffee44', '#1a1a00', 'leave_store');
  }

  // ─── River Screen ────────────────────────────────────────────────────────

  renderRiver(ctx) {
    this.drawLandscape(ctx, this.dimension, this.scrollX);
    this.drawHUD(ctx);

    const mw = 560, mh = 320;
    const mx = (CANVAS_W - mw) / 2;
    const my = HUD_H + (TRAVEL_H - mh) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,20,60,0.92)';
    ctx.strokeStyle = '#4499ff';
    ctx.lineWidth   = 3;
    this._roundRect(ctx, mx, my, mw, mh, 12);
    ctx.fill(); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#4499ff';
    ctx.font      = 'bold 20px "Courier New", monospace';
    ctx.fillText('🌊 RIVER CROSSING', CANVAS_W / 2, my + 38);

    ctx.fillStyle = '#aaddff';
    ctx.font      = '14px "Courier New", monospace';
    ctx.fillText(`Depth: ${this.riverDepth.toFixed(1)} ft  |  Current Speed: ${this.riverSpeed.toFixed(1)} mph`, CANVAS_W / 2, my + 66);

    this.buttons = [];
    const opts = [
      { key: 'ford',  label: 'Ford the River (Free, Risky)',    color: '#ffaa44' },
      { key: 'caulk', label: 'Caulk & Float (Free, Risky)',     color: '#ffcc44' },
      { key: 'ferry', label: `Ferry ($${Math.round(10 + (this.riverDepth + this.riverSpeed) * 5)}, Safe)`, color: '#44ffaa' },
      { key: 'wait',  label: 'Wait for Lower Water (2 days)',   color: '#aaaaff' },
    ];
    opts.forEach((o, i) => {
      this._drawButton(ctx, CANVAS_W / 2, my + 108 + i * 52, 380, 42, o.label, o.color, '#001020', `river_${o.key}`);
    });

    ctx.restore();
    this._drawStatusPanel(ctx);
  }

  // ─── Game Over ───────────────────────────────────────────────────────────

  renderGameOver(ctx) {
    ctx.fillStyle = '#050005';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    this.drawParticles(ctx);

    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur  = 30;
    ctx.fillStyle   = '#ff4444';
    ctx.font        = 'bold 48px "Courier New", monospace';
    ctx.fillText('GAME OVER', CANVAS_W / 2, 170);

    ctx.shadowBlur  = 0;
    ctx.fillStyle   = '#ff8888';
    ctx.font        = '20px "Courier New", monospace';
    ctx.fillText(this.deathMsg, CANVAS_W / 2, 225);

    ctx.fillStyle   = '#888888';
    ctx.font        = '15px "Courier New", monospace';
    ctx.fillText(`You reached Dimension ${this.dimension}: ${DIMENSION_NAMES[this.dimension]}`, CANVAS_W / 2, 268);
    ctx.fillText(`Day ${this.totalDay} of ${DAYS_PER_DIMENSION * TOTAL_DIMENSIONS}  |  Crystals: ${this.resources.crystals}`, CANVAS_W / 2, 295);

    this.buttons = [];
    this._drawButton(ctx, CANVAS_W / 2, 365, 220, 46, '🔄 Try Again', '#ffee44', '#1a1a00', 'restart');
    this._drawButton(ctx, CANVAS_W / 2, 425, 220, 36, '← Title',      '#888888', '#111',    'title');
  }

  // ─── Victory ─────────────────────────────────────────────────────────────

  renderVictory(ctx) {
    // Glorious background
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#000040');
    grad.addColorStop(1, '#200060');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.drawParticles(ctx);

    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffee00';
    ctx.shadowBlur  = 40;
    ctx.fillStyle   = '#ffee44';
    ctx.font        = 'bold 48px "Courier New", monospace';
    ctx.fillText('YOU MADE IT!', CANVAS_W / 2, 140);

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = '#00ffff';
    ctx.font        = '22px "Courier New", monospace';
    ctx.fillText('All 9 Dimensions Conquered!', CANVAS_W / 2, 186);

    ctx.shadowBlur  = 0;
    ctx.fillStyle   = '#ffcc00';
    ctx.font        = 'bold 30px "Courier New", monospace';
    ctx.fillText(`FINAL SCORE: ${this.finalScore.toLocaleString()}`, CANVAS_W / 2, 240);

    ctx.fillStyle   = '#aaaaff';
    ctx.font        = '14px "Courier New", monospace';
    const r = this.resources;
    ctx.fillText(`Survivors: ${this.partySurvivors}  |  Crystals: ${r.crystals}  |  Food left: ${r.food} lbs`, CANVAS_W / 2, 278);
    ctx.fillText(`Gold remaining: $${r.money}  |  Day reached: ${this.totalDay}`, CANVAS_W / 2, 302);

    this.buttons = [];
    this._drawButton(ctx, CANVAS_W / 2, 370, 220, 46, '🔄 Play Again', '#ffee44', '#1a1a00', 'restart');
    this._drawButton(ctx, CANVAS_W / 2, 430, 220, 36, '← Title',       '#888888', '#111',    'title');
  }

  // ─── Drawing Helpers ─────────────────────────────────────────────────────

  drawWagon(ctx, x, y, wheelAngle) {
    ctx.save();
    ctx.translate(x, y);

    // Wagon bed (main body)
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(-55, -20, 110, 32);
    // Wagon sides (boards)
    ctx.strokeStyle = '#5a3010';
    ctx.lineWidth = 2;
    for (let i = -45; i <= 45; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, -20);
      ctx.lineTo(i, 12);
      ctx.stroke();
    }

    // Canvas cover
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath();
    ctx.moveTo(-55, -20);
    ctx.quadraticCurveTo(-50, -65, 0, -60);
    ctx.quadraticCurveTo(50, -65, 55, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c0a868';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cover stripes
    ctx.strokeStyle = '#a08850';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 14, -62 + Math.abs(i) * 3);
      ctx.lineTo(i * 14, -20);
      ctx.stroke();
    }

    // Wheels (4)
    const wheelPositions = [[-40, 12], [40, 12], [-38, 8], [38, 8]];
    const wheelSizes     = [18, 18, 14, 14];
    wheelPositions.forEach(([wx, wy], idx) => {
      const r = wheelSizes[idx];
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(wheelAngle);
      // Rim
      ctx.strokeStyle = '#3a2010';
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      // Spokes
      ctx.lineWidth = 2;
      for (let s = 0; s < 6; s++) {
        const angle = (s * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        ctx.stroke();
      }
      // Hub
      ctx.fillStyle = '#8B5E3C';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Tongue/yoke
    ctx.strokeStyle = '#5a3010';
    ctx.lineWidth   = 4;
    ctx.beginPath();
    ctx.moveTo(-55, 5);
    ctx.lineTo(-95, 5);
    ctx.stroke();

    // Oxen (simple shapes)
    for (let ox = 0; ox < Math.min(this.resources?.oxen ?? 2, 4); ox++) {
      const oxX = -95 - ox * 28;
      ctx.fillStyle = '#7a5030';
      ctx.fillRect(oxX - 18, -8, 22, 14);
      // Head
      ctx.fillRect(oxX - 20, -12, 8, 9);
      // Legs
      ctx.fillStyle = '#5a3010';
      ctx.fillRect(oxX - 14, 6, 4, 8);
      ctx.fillRect(oxX - 6, 6, 4, 8);
    }

    ctx.restore();
  }

  drawLandscape(ctx, dim, scrollX) {
    const p = DIMENSION_PALETTES[dim] || DIMENSION_PALETTES[1];

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, HUD_H, 0, HUD_H + TRAVEL_H * 0.6);
    skyGrad.addColorStop(0, p.sky[0]);
    skyGrad.addColorStop(1, p.sky[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, HUD_H, CANVAS_W, TRAVEL_H);

    // Clouds (dims 1-6 have white clouds, dim 8 has purple)
    if (dim !== 9) {
      ctx.fillStyle = dim === 8 ? 'rgba(200,150,255,0.5)' : 'rgba(255,255,255,0.7)';
      this.cloudX.forEach((cx, i) => {
        const cy = HUD_H + 30 + (i % 3) * 25;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 40 + i * 5, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 30, cy - 8, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Ground
    const groundY = HUD_H + TRAVEL_H * 0.65;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, HUD_H + TRAVEL_H);
    groundGrad.addColorStop(0, p.ground);
    groundGrad.addColorStop(1, this._darken(p.ground, 0.3));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, CANVAS_W, HUD_H + TRAVEL_H - groundY);

    // Trail path
    ctx.fillStyle = 'rgba(160,120,60,0.6)';
    ctx.fillRect(0, groundY - 5, CANVAS_W, 16);
    // Wagon ruts
    ctx.strokeStyle = 'rgba(100,70,30,0.6)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([20, 15]);
    ctx.beginPath(); ctx.moveTo(0, groundY + 2); ctx.lineTo(CANVAS_W, groundY + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, groundY + 8); ctx.lineTo(CANVAS_W, groundY + 8); ctx.stroke();
    ctx.setLineDash([]);

    // Terrain features (trees, rocks, cactus, etc.)
    const offset = scrollX % (160 * 20);
    this.terrainFeatures.forEach(f => {
      const fx = ((f.x - offset) % (160 * 20) + CANVAS_W + 80) % (CANVAS_W + 160) - 60;
      ctx.save();
      ctx.translate(fx, groundY - 5);
      ctx.scale(f.scale, f.scale);
      this._drawTerrainFeature(ctx, dim, f.type);
      ctx.restore();
    });

    // Dimension-specific overlays
    if (dim === 3) { // desert heat shimmer
      ctx.fillStyle = 'rgba(255,180,0,0.05)';
      ctx.fillRect(0, HUD_H, CANVAS_W, TRAVEL_H);
    }
    if (dim === 9) { // glitch overlay
      ctx.fillStyle = 'rgba(128,0,255,0.08)';
      ctx.fillRect(0, HUD_H, CANVAS_W, TRAVEL_H);
      // Random glitch lines
      if (Math.random() < 0.05) {
        ctx.strokeStyle = Math.random() < 0.5 ? '#ff00ff' : '#00ffff';
        ctx.lineWidth   = 1;
        const ly = HUD_H + Math.random() * TRAVEL_H;
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(CANVAS_W, ly); ctx.stroke();
      }
    }
  }

  _drawTerrainFeature(ctx, dim, type) {
    switch (dim) {
      case 1: // Plains: trees, bushes
        if (type === 0) { // tree
          ctx.fillStyle = '#5a8a3a'; ctx.fillRect(-5, -35, 10, 35);
          ctx.fillStyle = '#3a6020'; ctx.beginPath(); ctx.arc(0, -40, 20, 0, Math.PI*2); ctx.fill();
        } else { // bush
          ctx.fillStyle = '#4a7030'; ctx.beginPath(); ctx.ellipse(0, -8, 15, 10, 0, 0, Math.PI*2); ctx.fill();
        }
        break;
      case 2: // Mountains: rocks, pine trees
        if (type < 2) { // rock
          ctx.fillStyle = '#888898'; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(0, -30); ctx.lineTo(15, 0); ctx.closePath(); ctx.fill();
        } else { // pine
          ctx.fillStyle = '#5a6a4a'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(0, -40); ctx.lineTo(12, 0); ctx.closePath(); ctx.fill();
        }
        break;
      case 3: // Desert: cactus, rocks
        if (type === 0) { // cactus
          ctx.fillStyle = '#40a030';
          ctx.fillRect(-5, -40, 10, 40);
          ctx.fillRect(-20, -26, 15, 8);
          ctx.fillRect(5, -20, 15, 8);
        } else { // desert rock
          ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.ellipse(0, -6, 14, 9, 0, 0, Math.PI*2); ctx.fill();
        }
        break;
      case 4: // Tundra: snow mounds
        ctx.fillStyle = '#ddeeff'; ctx.beginPath(); ctx.ellipse(0, -4, 20, 8, 0, 0, Math.PI*2); ctx.fill();
        break;
      case 5: // Dark Forest: dead trees
        ctx.strokeStyle = '#1a2a18'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -50); ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-20, -10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(20, -5); ctx.stroke();
        break;
      case 6: // River Valley: reeds, river marks
        ctx.fillStyle = '#40c080'; ctx.fillRect(-3, -25, 6, 25);
        ctx.beginPath(); ctx.ellipse(0, -26, 4, 8, 0, 0, Math.PI*2); ctx.fill();
        break;
      case 7: // Volcanic: lava rocks, flames
        ctx.fillStyle = '#3a1000'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(0, -25); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill();
        if (type === 0) {
          ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.ellipse(0, -24, 4, 7, 0, 0, Math.PI*2); ctx.fill();
        }
        break;
      case 8: // Sky: clouds as ground features
        ctx.fillStyle = 'rgba(200,180,255,0.6)'; ctx.beginPath(); ctx.ellipse(0, -8, 22, 12, 0, 0, Math.PI*2); ctx.fill();
        break;
      case 9: // Dimension Zero: strange pillars
        ctx.fillStyle = '#8800ff'; ctx.fillRect(-6, -45, 12, 45);
        ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(0, -47, 8, 0, Math.PI*2); ctx.fill();
        break;
    }
  }

  drawHUD(ctx) {
    // HUD background
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,30,0.92)';
    ctx.fillRect(0, 0, CANVAS_W, HUD_H);
    ctx.strokeStyle = '#442288';
    ctx.lineWidth   = 2;
    ctx.strokeRect(0, 0, CANVAS_W, HUD_H);

    const r = this.resources;
    const items = [
      { icon: '📅', val: `D${this.dimension}/9 Day ${this.dayInDimension}/30`,  color: '#aaffff' },
      { icon: '🌽', val: `${r.food}`,    color: r.food < 100 ? '#ff8888' : '#aaffaa', label: 'Food' },
      { icon: '💧', val: `${r.water}`,   color: r.water < 20 ? '#ff8888' : '#88aaff', label: 'H₂O' },
      { icon: '❤️', val: `${r.health}%`, color: r.health < 30 ? '#ff4444' : '#ff8888', label: 'HP' },
      { icon: '💰', val: `$${r.money}`,  color: '#ffcc44', label: 'Gold' },
      { icon: '🐂', val: `${r.oxen}`,    color: r.oxen < 2 ? '#ff4444' : '#ddaa88', label: 'Oxen' },
      { icon: '🔫', val: `${r.ammo}`,    color: '#cccccc', label: 'Ammo' },
      { icon: '💊', val: `${r.medicine}`,color: '#88ff88', label: 'Med' },
      { icon: '💎', val: `${r.crystals}`,color: '#cc88ff', label: 'Crys' },
      { icon: '😊', val: `${Math.round(r.morale)}%`, color: r.morale < 30 ? '#ff8888' : '#ffdd88', label: 'Morale' },
    ];

    const cellW = CANVAS_W / items.length;
    items.forEach((item, i) => {
      const cx = i * cellW + cellW / 2;
      ctx.textAlign  = 'center';
      ctx.font       = '11px "Courier New", monospace';
      ctx.fillStyle  = '#777799';
      if (item.label) ctx.fillText(item.label, cx, 16);

      ctx.fillStyle  = item.color;
      ctx.font       = '10px "Courier New", monospace';
      ctx.fillText(item.icon + ' ' + item.val, cx, 38);
    });

    // Dimension name banner
    ctx.fillStyle  = '#442288';
    ctx.fillRect(0, HUD_H - 22, CANVAS_W, 22);
    ctx.textAlign  = 'center';
    ctx.fillStyle  = '#ddbbff';
    ctx.font       = 'bold 13px "Courier New", monospace';
    ctx.fillText(`⬡ DIMENSION ${this.dimension}: ${DIMENSION_NAMES[this.dimension].toUpperCase()} ⬡`, CANVAS_W / 2, HUD_H - 6);

    ctx.restore();
  }

  drawParticles(ctx) {
    for (const p of this.particles) p.draw(ctx);
  }

  _drawStatusPanel(ctx) {
    ctx.save();
    const panelY = HUD_H + TRAVEL_H;
    ctx.fillStyle = 'rgba(8,6,20,0.95)';
    ctx.fillRect(0, panelY, CANVAS_W, STATUS_H);
    ctx.strokeStyle = '#332266';
    ctx.lineWidth   = 1;
    ctx.strokeRect(0, panelY, CANVAS_W, STATUS_H);

    // Show last 4 messages
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = 'left';
    const maxMsgs = 4;
    for (let i = 0; i < maxMsgs && i < this.statusLog.length; i++) {
      const alpha = 1 - i * 0.2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = i === 0 ? '#ffffff' : '#aaaacc';
      ctx.fillText(this.statusLog[i], 12, panelY + 16 + i * 20);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _drawTravelButtons(ctx) {
    this.buttons = [];
    const panelY = HUD_H + TRAVEL_H;
    const btnY   = panelY + STATUS_H - 28;
    const isMoving = this.moving;

    this._drawButton(ctx, 100, btnY, 140, 30,
      isMoving ? '⏸ Pause' : '▶ Travel',
      isMoving ? '#ff8844' : '#44ff88', '#001a00', 'toggle_travel');

    this._drawButton(ctx, 270, btnY, 140, 30, '🏪 Store',   '#ffcc44', '#1a1000', 'open_store');
    this._drawButton(ctx, 440, btnY, 140, 30, '🦌 Hunt',    '#88ffcc', '#001a10', 'open_hunt');
  }

  _drawButton(ctx, cx, cy, w, h, label, fillColor, textColor, id) {
    const x = cx - w / 2;
    const y = cy - h / 2;

    ctx.save();
    ctx.fillStyle   = fillColor;
    ctx.strokeStyle = this._lighten(fillColor, 0.4);
    ctx.lineWidth   = 2;
    this._roundRect(ctx, x, y, w, h, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle  = textColor;
    ctx.font       = `bold ${Math.min(14, Math.floor(h * 0.4))}px "Courier New", monospace`;
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
    ctx.textBaseline = 'alphabetic';

    ctx.restore();

    // Register hitbox
    this.buttons.push({ x, y, w, h, id });
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  _wrapText(ctx, text, cx, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, y);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx, y);
  }

  _darken(hex, amt) {
    return this._adjustColor(hex, -amt);
  }
  _lighten(hex, amt) {
    return this._adjustColor(hex, amt);
  }
  _adjustColor(hex, amt) {
    try {
      const c = parseInt(hex.replace('#',''), 16);
      const r = Math.max(0, Math.min(255, ((c >> 16) & 0xff) + Math.round(amt * 255)));
      const g = Math.max(0, Math.min(255, ((c >>  8) & 0xff) + Math.round(amt * 255)));
      const b = Math.max(0, Math.min(255, ( c        & 0xff) + Math.round(amt * 255)));
      return `rgb(${r},${g},${b})`;
    } catch(_) { return hex; }
  }

  _drawDimBackground(ctx, dim) {
    this.drawLandscape(ctx, dim, this.scrollX);
  }

  // ─── Input Handlers ──────────────────────────────────────────────────────

  handleClick(x, y) {
    // Hunting: shooting
    if (this.gameState === 'hunting' && !this.huntDone) {
      // Check stop hunt button first
      const stopBtn = this.buttons.find(b => b.id === 'stop_hunt');
      if (stopBtn && x >= stopBtn.x && x <= stopBtn.x + stopBtn.w && y >= stopBtn.y && y <= stopBtn.y + stopBtn.h) {
        this._endHunting();
        return;
      }
      this._shootAt(x, y);
      return;
    }

    // Check button registry
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        this._handleButtonAction(btn.id);
        return;
      }
    }
  }

  handleKeydown(e) {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (this.gameState === 'traveling') {
          this.moving = !this.moving;
        }
        break;
      case 'Enter':
        if (this.gameState === 'title')   this._handleButtonAction('start');
        if (this.gameState === 'setup')   this._handleButtonAction('begin');
        if (this.gameState === 'gameover' || this.gameState === 'victory') this._handleButtonAction('restart');
        break;
    }
  }

  _handleButtonAction(id) {
    switch (id) {
      case 'start':
        this.gameState = 'setup';
        break;
      case 'howto':
        this._showHowTo();
        break;
      case 'begin':
        this._beginJourney();
        break;
      case 'title':
        this._resetGame();
        this.gameState = 'title';
        break;
      case 'restart':
        this._resetGame();
        this._beginJourney();
        break;
      case 'toggle_travel':
        this.moving = !this.moving;
        if (this.moving) this._log('▶ Moving...');
        else this._log('⏸ Paused.');
        break;
      case 'open_store':
        if (this.gameState === 'traveling') {
          this.moving = false;
          this.gameState = 'store';
          this._buildStorePrices();
          this._log('🏪 Entered the frontier store.');
        }
        break;
      case 'leave_store':
        this.gameState = 'traveling';
        this.moving    = false;
        this.checkDimensionComplete();
        break;
      case 'open_hunt':
        if (this.gameState === 'traveling') {
          this.moving = false;
          this._startHunting();
        }
        break;
      case 'stop_hunt':
        this._endHunting();
        break;
      default:
        if (id.startsWith('choice_')) {
          const idx = parseInt(id.replace('choice_', ''), 10);
          if (!isNaN(idx) && this.eventChoices[idx]) {
            this.eventChoices[idx].action();
            this.eventChoices = []; // clear choices after selection
          }
        } else if (id.startsWith('buy_')) {
          const itemId = id.replace('buy_', '');
          this._buyItem(itemId);
        } else if (id.startsWith('river_')) {
          const choice = id.replace('river_', '');
          this._resolveRiver(choice);
        }
        break;
    }
  }

  _showHowTo() {
    this.gameState = 'event';
    this.currentEvent = {
      type: 'info',
      msg: 'Travel 9 Dimensions, 30 days each. Manage Food, Water, Health, Oxen & Ammo. Random events test your survival. Hunt for food, trade at stores, cross rivers, and collect Dimension Crystals. Reach Dimension Zero to win!',
    };
    this.eventChoices = [{ label: 'Got it! Begin!', action: () => { this.gameState = 'setup'; this.currentEvent = null; } }];
  }

  _beginJourney() {
    this._resetGame();
    this.partyStarted = true;
    this.gameState    = 'traveling';
    this.moving       = false;
    this._log('🌄 Your journey across 9 dimensions begins!');
    this._log('Press SPACE or click Travel to move forward.');
  }

  _resetGame() {
    this.dimension       = 1;
    this.dayInDimension  = 1;
    this.totalDay        = 1;
    this.resources = {
      food: 500, water: 100, health: 100,
      money: 500, oxen: 6, ammo: 200,
      medicine: 10, morale: 75, crystals: 0,
    };
    this.scrollX         = 0;
    this.wheelAngle      = 0;
    this.moving          = false;
    this.particles       = [];
    this.statusLog       = ['Your wagon is ready. The trail awaits.'];
    this.currentEvent    = null;
    this.eventChoices    = [];
    this.eventResult     = null;
    this.huntAnimals     = [];
    this.huntDone        = false;
    this.dayTimer        = 0;
    this.finalScore      = 0;
    this.deathMsg        = '';
    this.partySurvivors  = 4;
    this._rebuildTerrain();
  }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

function initOregonTrail() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) { console.error('[oregon-trail] Canvas element not found'); return; }

  // Responsive scaling
  function scaleCanvas() {
    const parent = canvas.parentElement;
    const maxW   = Math.min(CANVAS_W, parent ? parent.clientWidth - 20 : CANVAS_W);
    const scale  = maxW / CANVAS_W;
    canvas.style.width  = `${CANVAS_W * scale}px`;
    canvas.style.height = `${CANVAS_H * scale}px`;
  }
  scaleCanvas();
  window.addEventListener('resize', scaleCanvas);

  try {
    const game = new OregonTrailGame(canvas);
    window._oregonTrailGame = game; // expose for debugging
    game.init();
    console.log('[oregon-trail] 9D Oregon Trail started!');
  } catch (err) {
    console.error('[oregon-trail] Failed to start:', err);
  }
}

// Export for DOMContentLoaded + gameReady pattern
window.initOregonTrail = initOregonTrail;
