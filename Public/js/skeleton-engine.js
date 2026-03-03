/**
 * skeleton-engine.js — Skeletal Animation Engine for 9DTTT
 *
 * Provides a proper bone hierarchy with FK traversal, keyframe animation
 * clips with easing curves, and an AnimationPlayer that drives both a
 * standalone SkeletonRenderer and the legacy HumanoidRenderer /
 * CharacterRenderer drawing functions via a compatibility snapshot.
 *
 * Exposed as: window.SkeletonEngine
 *
 * Architecture:
 *   Bone           — single bone with parent/children, localAngle, world pos
 *   Skeleton       — tree of bones; update() does FK traversal from root
 *   Track          — keyframe array for one animation channel
 *   AnimationClip  — named collection of tracks with duration & loop flag
 *   AnimationPlayer— plays / seeks a clip, outputs getSnapshot() for renderers
 *   SkeletonRenderer — draws bones directly onto a canvas (debug / alt render)
 *
 *   Built-in clips (humanoid): idle, walk, run, punch, kick, jump, hurt, death, crouch
 *   Built-in clips (fighter):  idle_fight, walk_back, special_attack, block
 *
 * Usage (legacy renderer bridge):
 *   const player = new SkeletonEngine.AnimationPlayer();
 *   player.setAbsoluteTime(animTimeMs, clipName);   // uses Date.now() style
 *   const snap = player.getSnapshot();              // {bob, lean, hurtTilt, …}
 */
(function () {
    'use strict';

    /* ============================================================
       EASING FUNCTIONS
       ============================================================ */

    const Easing = {
        linear:       t => t,
        'ease-in':    t => t * t,
        'ease-out':   t => 1 - (1 - t) * (1 - t),
        'ease-in-out': t => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t),
        'ease-back':  t => {               // anticipation / slight pull-back
            const c = 1.70158;
            return t * t * ((c + 1) * t - c);
        },
        'ease-spring': t => {              // slight overshoot on impact
            if (t === 0 || t === 1) return t;
            const c = (2 * Math.PI) / 3;
            return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
        },
    };

    function applyEasing(t, name) {
        const fn = Easing[name] || Easing.linear;
        return fn(Math.max(0, Math.min(1, t)));
    }

    /* ============================================================
       BONE
       ============================================================ */

    /**
     * A single bone in a FK hierarchy.
     *
     * worldX/worldY — base of this bone (= parent tip) after FK update
     * worldAngle    — absolute angle in canvas space (degrees; 0=right, 90=down)
     * localAngle    — additional rotation set by the animation player (degrees)
     * tipX / tipY   — computed tip position (read-only getters)
     */
    class Bone {
        constructor(name, length, restAngle) {
            this.name       = name;
            this.length     = length     || 0;   // px at scale=1
            this.restAngle  = restAngle  || 0;   // degrees, relative to parent world angle
            this.parent     = null;
            this.children   = [];
            this.localAngle = 0;                 // set per-frame by AnimationPlayer

            // Computed by Skeleton.update():
            this.worldX     = 0;
            this.worldY     = 0;
            this.worldAngle = 0;
        }

        get tipX() {
            return this.worldX + Math.cos(this.worldAngle * Math.PI / 180) * this.length;
        }
        get tipY() {
            return this.worldY + Math.sin(this.worldAngle * Math.PI / 180) * this.length;
        }
    }

    /* ============================================================
       SKELETON  (FK tree)
       ============================================================ */

    /**
     * Holds a tree of Bone objects. Call update(rootX, rootY) every frame
     * to propagate worldX/Y/Angle from the root outward via FK.
     */
    class Skeleton {
        constructor() {
            this.root   = null;
            this._bones = {};
        }

        /**
         * Add a bone.
         * @param {string}      name        Unique bone name
         * @param {string|null} parentName  Parent bone name, or null for root
         * @param {number}      length      Bone length in px (scale=1)
         * @param {number}      restAngle   Resting angle relative to parent (degrees)
         */
        addBone(name, parentName, length, restAngle) {
            const bone = new Bone(name, length, restAngle || 0);
            this._bones[name] = bone;
            if (parentName === null) {
                this.root = bone;
            } else {
                const parent = this._bones[parentName];
                if (!parent) throw new Error('[SkeletonEngine] Parent bone not found: ' + parentName);
                bone.parent = parent;
                parent.children.push(bone);
            }
            return bone;
        }

        /** Returns the Bone with this name, or null. */
        getBone(name) { return this._bones[name] || null; }

        /** FK traversal from root. rootX/Y = world position of root bone base. */
        update(rootX, rootY) {
            if (!this.root) return;
            this._updateBone(this.root, rootX || 0, rootY || 0, 0);
        }

        _updateBone(bone, px, py, parentWorldAngle) {
            bone.worldX     = px;
            bone.worldY     = py;
            bone.worldAngle = parentWorldAngle + bone.restAngle + bone.localAngle;
            const tx = bone.tipX;
            const ty = bone.tipY;
            for (const child of bone.children) {
                this._updateBone(child, tx, ty, bone.worldAngle);
            }
        }
    }

    /* ============================================================
       TRACK  (keyframe curve for one channel)
       ============================================================ */

    /**
     * Animation track for one named channel.
     * channel: bone name (e.g. 'thigh_l') or pseudo-channel (e.g. 'body.bob')
     * keyframes: [{time, value, easing}]  — time in seconds, easing on the NEXT keyframe
     */
    class Track {
        constructor(channel, keyframes) {
            this.channel   = channel;
            this.keyframes = keyframes.slice().sort((a, b) => a.time - b.time);
        }

        /** Sample the track at time t (seconds). Returns interpolated value. */
        sample(t) {
            const kfs = this.keyframes;
            if (!kfs.length) return 0;
            if (t <= kfs[0].time) return kfs[0].value;
            if (t >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;

            let lo = 0;
            while (lo < kfs.length - 2 && kfs[lo + 1].time <= t) lo++;
            const k0 = kfs[lo], k1 = kfs[lo + 1];
            const raw = (t - k0.time) / (k1.time - k0.time);
            const ease = applyEasing(raw, k1.easing || 'linear');
            return k0.value + (k1.value - k0.value) * ease;
        }
    }

    /* ============================================================
       ANIMATION CLIP
       ============================================================ */

    /**
     * A named animation clip: collection of tracks + duration + loop flag.
     */
    class AnimationClip {
        constructor(name, duration, loop, tracks) {
            this.name     = name;
            this.duration = duration;
            this.loop     = loop !== undefined ? loop : true;
            this.tracks   = tracks || [];
            this._map     = {};
            for (const tr of this.tracks) this._map[tr.channel] = tr;
        }

        /** Sample channel at time t. Returns 0 if no track for that channel. */
        sample(channel, t) {
            const tr = this._map[channel];
            return tr ? tr.sample(t) : 0;
        }
    }

    /* ============================================================
       ANIMATION PLAYER
       ============================================================ */

    /**
     * Plays one AnimationClip at a time.
     *
     * Two usage patterns:
     *   (A) Delta-time driven: player.update(dt)  — typical game-loop usage
     *   (B) Absolute-time seek: player.setAbsoluteTime(ms, clipName)
     *       — drop-in for callers that pass Date.now() as animTime
     */
    class AnimationPlayer {
        constructor() {
            this.clip     = null;
            this.time     = 0;
            this.playing  = false;
            this.finished = false;
        }

        /** Start playing a clip. If loop is undefined, uses clip.loop. */
        play(clip, loop) {
            if (!clip) return;
            this.clip     = clip;
            this._loop    = loop !== undefined ? loop : clip.loop;
            this.time     = 0;
            this.playing  = true;
            this.finished = false;
        }

        /** Advance by delta-time (seconds). Call once per game-loop frame. */
        update(dt) {
            if (!this.playing || !this.clip || this.finished) return;
            this.time += Math.min(dt, 0.1);          // cap at 100 ms to avoid jumps
            if (this.time >= this.clip.duration) {
                if (this._loop) {
                    this.time %= this.clip.duration;
                } else {
                    this.time     = this.clip.duration;
                    this.finished = true;
                }
            }
        }

        /**
         * Seek using an absolute timestamp (ms) — for callers that pass Date.now().
         * All clips always loop in this mode so the animation is continuous.
         * @param {number} absMs   Absolute time in milliseconds (e.g. Date.now())
         * @param {string} [clipName] Optionally look up a clip by name before seeking
         */
        setAbsoluteTime(absMs, clipName) {
            if (clipName !== undefined) {
                const c = CLIPS[clipName];
                if (c && c !== this.clip) { this.clip = c; this.finished = false; }
            }
            if (!this.clip) return;
            this.time = (absMs / 1000) % this.clip.duration;
        }

        /** Read a single channel value at current time. */
        get(channel) {
            return this.clip ? this.clip.sample(channel, this.time) : 0;
        }

        /**
         * Returns a snapshot object with all parameters needed by the legacy
         * HumanoidRenderer and CharacterRenderer drawing functions.
         *
         * Channel naming convention:
         *   body.*   — overall body transform offsets (pixels or degrees)
         *   leg.*    — leg bone rotations (degrees; positive = swing forward)
         *   arm.*    — arm swing (degrees) with rest-position baked in
         */
        getSnapshot() {
            const g = ch => this.get(ch);
            return {
                bob:        g('body.bob'),       // px, vertical body offset (neg = up)
                lean:       g('body.lean'),      // px, horizontal body translate
                hurtTilt:   g('body.tilt'),      // degrees, whole-body tilt
                jumpOffset: g('body.jumpY'),     // px, jump vertical offset (neg = up)
                legSpread:  g('leg.spread'),     // px, lateral leg spread (jump/crouch)
                legRotL:    g('leg.rotL'),       // degrees, LEFT  thigh (pos = forward)
                legRotR:    g('leg.rotR'),       // degrees, RIGHT thigh (pos = forward)
                legKneeL:   g('leg.kneeL'),      // degrees, LEFT  knee bend
                legKneeR:   g('leg.kneeR'),      // degrees, RIGHT knee bend
                kickAngle:  g('leg.kick'),       // degrees, front-leg kick angle
                armBack:    g('arm.back'),       // degrees, back arm swing (rest ≈ −4)
                armFront:   g('arm.front'),      // degrees, front arm swing (rest ≈ +6)
                punchExt:   g('arm.punchExt'),   // px, forearm punch extension
                deadSlump:  g('body.dead') > 0.5,
            };
        }
    }

    /* ============================================================
       CLIP BUILDER HELPERS
       ============================================================ */

    function kf(time, value, easing) {
        return { time, value, easing: easing || 'linear' };
    }

    function track(channel, keyframes) {
        return new Track(channel, keyframes);
    }

    /* ============================================================
       BUILT-IN HUMANOID CLIPS
       arm.back  = back arm swing;  rest position baked-in at −4
       arm.front = front arm swing; rest position baked-in at +6
       leg.rotL/R = thigh rotation in degrees  (+ = swing forward in canvas)
       leg.kneeL/R = knee bend degrees (0 = straight, + = bent)
       ============================================================ */

    const CLIPS = {};

    /* ─────────────────────────────────────── idle (1.2 s loop) ── */
    CLIPS.idle = new AnimationClip('idle', 1.2, true, [
        track('body.bob',   [
            kf(0.0,  0.0, 'ease-in-out'),
            kf(0.3, -2.5, 'ease-in-out'),
            kf(0.6,  0.0, 'ease-in-out'),
            kf(0.9, -1.8, 'ease-in-out'),
            kf(1.2,  0.0, 'ease-in-out'),
        ]),
        track('body.lean',  [kf(0, 0, 'ease-in-out'), kf(0.6, 1.0, 'ease-in-out'), kf(1.2, 0, 'ease-in-out')]),
        // Back arm: rest ≈ −4, gentle sway
        track('arm.back',   [kf(0, -4, 'ease-in-out'), kf(0.6, -6, 'ease-in-out'), kf(1.2, -4, 'ease-in-out')]),
        // Front arm: rest ≈ +6, opposite sway
        track('arm.front',  [kf(0,  6, 'ease-in-out'), kf(0.6,  8, 'ease-in-out'), kf(1.2,  6, 'ease-in-out')]),
        // Very slight idle leg shift
        track('leg.rotL',   [kf(0,  1, 'ease-in-out'), kf(0.6, -1, 'ease-in-out'), kf(1.2,  1, 'ease-in-out')]),
        track('leg.rotR',   [kf(0, -1, 'ease-in-out'), kf(0.6,  1, 'ease-in-out'), kf(1.2, -1, 'ease-in-out')]),
    ]);

    /* ──────────────────────────────────────── walk (0.8 s loop) ── */
    // Proper bipedal gait: arms oppose contralateral legs,
    // knee bends on recovery stroke, body bobs twice per cycle.
    CLIPS.walk = new AnimationClip('walk', 0.8, true, [
        track('body.bob',  [
            kf(0.0, -1.0, 'ease-in-out'),
            kf(0.2, -4.0, 'ease-in-out'),
            kf(0.4, -1.0, 'ease-in-out'),
            kf(0.6, -4.0, 'ease-in-out'),
            kf(0.8, -1.0, 'ease-in-out'),
        ]),
        track('body.lean', [kf(0, 1.5)]),                // constant slight forward lean

        // Left thigh forward → right arm forward, and vice-versa
        track('leg.rotL',  [kf(0, -18, 'ease-in-out'), kf(0.4,  18, 'ease-in-out'), kf(0.8, -18, 'ease-in-out')]),
        track('leg.rotR',  [kf(0,  18, 'ease-in-out'), kf(0.4, -18, 'ease-in-out'), kf(0.8,  18, 'ease-in-out')]),

        // Knee bends during recovery (heel-off to toe-off phase)
        track('leg.kneeL', [kf(0, 0, 'ease-in-out'), kf(0.15, 20, 'ease-in-out'), kf(0.4, 0), kf(0.8, 0)]),
        track('leg.kneeR', [kf(0, 0, 'ease-in-out'), kf(0.55, 20, 'ease-in-out'), kf(0.8, 0)]),

        // Arms swing opposite to contralateral leg
        track('arm.back',  [kf(0, -4 + 14, 'ease-in-out'), kf(0.4, -4 - 14, 'ease-in-out'), kf(0.8, -4 + 14, 'ease-in-out')]),
        track('arm.front', [kf(0,  6 - 14, 'ease-in-out'), kf(0.4,  6 + 14, 'ease-in-out'), kf(0.8,  6 - 14, 'ease-in-out')]),
    ]);

    /* ───────────────────────────────────────── run (0.5 s loop) ── */
    CLIPS.run = new AnimationClip('run', 0.5, true, [
        track('body.bob',  [
            kf(0.00, -2, 'ease-in-out'), kf(0.125, -7, 'ease-in-out'),
            kf(0.25, -2, 'ease-in-out'), kf(0.375, -7, 'ease-in-out'),
            kf(0.50, -2, 'ease-in-out'),
        ]),
        track('body.lean', [kf(0, 5)]),                  // more lean when sprinting

        track('leg.rotL',  [kf(0, -28, 'ease-in-out'), kf(0.25,  28, 'ease-in-out'), kf(0.5, -28, 'ease-in-out')]),
        track('leg.rotR',  [kf(0,  28, 'ease-in-out'), kf(0.25, -28, 'ease-in-out'), kf(0.5,  28, 'ease-in-out')]),

        track('leg.kneeL', [kf(0, 0), kf(0.12, 38, 'ease-in-out'), kf(0.25, 0), kf(0.5, 0)]),
        track('leg.kneeR', [kf(0, 0), kf(0.37, 38, 'ease-in-out'), kf(0.5,  0)]),

        track('arm.back',  [kf(0, -4 + 22, 'ease-in-out'), kf(0.25, -4 - 22, 'ease-in-out'), kf(0.5, -4 + 22, 'ease-in-out')]),
        track('arm.front', [kf(0,  6 - 22, 'ease-in-out'), kf(0.25,  6 + 22, 'ease-in-out'), kf(0.5,  6 - 22, 'ease-in-out')]),
    ]);

    /* ─────────────────────────────── punch / attack (0.4 s, loops) ── */
    // Anticipation → fast strike → brief hold → retract.
    CLIPS.punch = new AnimationClip('punch', 0.4, true, [
        track('arm.back',    [
            kf(0.00, -4,  'ease-in'),
            kf(0.06, -16, 'ease-out'),   // back arm pulls back (loads counter)
            kf(0.20, -10, 'ease-in-out'),
            kf(0.40, -4,  'ease-in-out'),
        ]),
        track('arm.front',   [
            kf(0.00,   6, 'ease-back'),  // slight pull-back anticipation
            kf(0.06,  -2, 'ease-spring'),// anticipation dip
            kf(0.18,  32, 'ease-spring'),// strike — spring overshoot
            kf(0.28,  30),               // hold at extension
            kf(0.40,   6, 'ease-in-out'),// retract
        ]),
        track('arm.punchExt',[
            kf(0.00,  0,  'ease-out'),
            kf(0.06,  0,  'ease-out'),
            kf(0.18, 26,  'ease-spring'),// forearm snaps out
            kf(0.28, 26),
            kf(0.40,  0,  'ease-in'),
        ]),
        track('body.lean',   [
            kf(0.00, 0, 'ease-out'),
            kf(0.18, 8, 'ease-out'),    // body weight transfers forward
            kf(0.40, 2, 'ease-in-out'),
        ]),
        track('body.bob',    [kf(0, -1, 'ease-in'), kf(0.18, -3, 'ease-out'), kf(0.4, -1)]),
        track('leg.rotL',    [kf(0, -3), kf(0.18, -6), kf(0.4, -3)]),
        track('leg.rotR',    [kf(0,  3), kf(0.18,  6), kf(0.4,  3)]),
    ]);

    /* ────────────────────────────────────── kick (0.5 s, loops) ── */
    // Wind-up → snap → hold → retract.
    CLIPS.kick = new AnimationClip('kick', 0.5, true, [
        track('leg.kick',    [
            kf(0.00,   0, 'ease-in'),
            kf(0.07, -12, 'ease-out'),  // wind-up / chamber
            kf(0.22,  72, 'ease-spring'),// snap out with overshoot
            kf(0.34,  68),              // hold
            kf(0.50,   0, 'ease-in-out'),// retract
        ]),
        track('body.lean',   [kf(0, 0), kf(0.22, -10, 'ease-out'), kf(0.5, 0, 'ease-in-out')]),
        track('arm.back',    [kf(0, -4), kf(0.22, -18, 'ease-out'), kf(0.5, -4, 'ease-in-out')]),
        track('arm.front',   [kf(0,  6), kf(0.22,  14, 'ease-out'), kf(0.5,  6, 'ease-in-out')]),
        track('body.bob',    [kf(0, 0),  kf(0.15, -4, 'ease-out'), kf(0.5, 0)]),
        track('leg.rotL',    [kf(0,  2), kf(0.15,  8, 'ease-out'), kf(0.5,  2)]),
    ]);

    /* ───────────────────────────────────── jump (0.6 s, loops) ── */
    CLIPS.jump = new AnimationClip('jump', 0.6, true, [
        track('body.jumpY',  [
            kf(0.00,   0, 'ease-out'),
            kf(0.04,   3, 'ease-out'),  // small crouch-down before push
            kf(0.25, -42, 'ease-in'),   // at apex
            kf(0.50, -12, 'ease-in'),   // falling
            kf(0.60,   0, 'ease-out'),  // land
        ]),
        track('leg.spread',  [kf(0, 0, 'ease-out'), kf(0.15, 14, 'ease-in-out'), kf(0.48, 12), kf(0.58, 0, 'ease-in')]),
        track('leg.rotL',    [kf(0, 0, 'ease-out'), kf(0.15, -10, 'ease-in-out'), kf(0.48, -8), kf(0.58, 0)]),
        track('leg.rotR',    [kf(0, 0, 'ease-out'), kf(0.15, -10, 'ease-in-out'), kf(0.48, -8), kf(0.58, 0)]),
        track('leg.kneeL',   [kf(0, 0, 'ease-out'), kf(0.15, 22, 'ease-in-out'),  kf(0.48, 18), kf(0.58, 0)]),
        track('leg.kneeR',   [kf(0, 0, 'ease-out'), kf(0.15, 22, 'ease-in-out'),  kf(0.48, 18), kf(0.58, 0)]),
        track('arm.back',    [kf(0, -4, 'ease-out'), kf(0.15, -32, 'ease-in-out'), kf(0.48, -28), kf(0.60, -4, 'ease-in-out')]),
        track('arm.front',   [kf(0,  6, 'ease-out'), kf(0.15, -24, 'ease-in-out'), kf(0.48, -20), kf(0.60,  6, 'ease-in-out')]),
    ]);

    /* ──────────────────────────────────── hurt (0.3 s, loops) ── */
    CLIPS.hurt = new AnimationClip('hurt', 0.3, true, [
        track('body.tilt',   [kf(0, 0, 'ease-out'), kf(0.05, 16, 'ease-out'), kf(0.3, 6, 'ease-in-out')]),
        track('body.lean',   [kf(0, 0, 'ease-out'), kf(0.05, -11, 'ease-out'), kf(0.3, -7, 'ease-in-out')]),
        track('body.bob',    [kf(0, 0, 'ease-out'), kf(0.05,  5, 'ease-out'),  kf(0.3,  2, 'ease-in-out')]),
        track('arm.back',    [kf(0, -4, 'ease-out'), kf(0.05, -26, 'ease-out'), kf(0.3, -10, 'ease-in-out')]),
        track('arm.front',   [kf(0,  6, 'ease-out'), kf(0.05, -18, 'ease-out'), kf(0.3,  -4, 'ease-in-out')]),
        track('leg.rotL',    [kf(0,  0, 'ease-out'), kf(0.05,  10, 'ease-out'), kf(0.3,   4, 'ease-in-out')]),
        track('leg.rotR',    [kf(0,  0, 'ease-out'), kf(0.05, -10, 'ease-out'), kf(0.3,  -4, 'ease-in-out')]),
    ]);

    /* ─────────────────────────────────── death (0.8 s, loops) ── */
    CLIPS.death = new AnimationClip('death', 0.8, true, [
        track('body.tilt',   [kf(0, 0, 'ease-in'), kf(0.40, 32, 'ease-in'), kf(0.78, 90, 'ease-out'), kf(0.8, 90)]),
        track('body.jumpY',  [kf(0, 0, 'ease-in'), kf(0.50,  0, 'ease-in'), kf(0.80, 52, 'ease-out')]),
        track('body.lean',   [kf(0, 0, 'ease-in'), kf(0.80, 22, 'ease-in')]),
        track('arm.back',    [kf(0, -4, 'ease-in'), kf(0.30, -36, 'ease-out'), kf(0.80, -18)]),
        track('arm.front',   [kf(0,  6, 'ease-in'), kf(0.30,  28, 'ease-out'), kf(0.80,  44)]),
        track('body.dead',   [kf(0, 0), kf(0.72, 0), kf(0.80, 1)]),
    ]);

    /* ──────────────────────────────────── crouch (1.0 s loop) ── */
    CLIPS.crouch = new AnimationClip('crouch', 1.0, true, [
        track('body.bob',    [kf(0, 14)]),
        track('leg.spread',  [kf(0,  6)]),
        track('arm.back',    [kf(0, -12, 'ease-in-out'), kf(0.5, -4, 'ease-in-out'), kf(1.0, -12, 'ease-in-out')]),
        track('arm.front',   [kf(0,  14, 'ease-in-out'), kf(0.5,  6, 'ease-in-out'), kf(1.0,  14, 'ease-in-out')]),
    ]);

    /* ============================================================
       FIGHTER-SPECIFIC CLIPS
       (used by CharacterRenderer; arm.back rest ≈ −4, arm.front rest ≈ 0)
       ============================================================ */

    /* ───────────────────────── idle_fight (1.0 s loop) ── */
    // Low-guard fighting stance with slight weight-shift bob.
    CLIPS.idle_fight = new AnimationClip('idle_fight', 1.0, true, [
        track('body.bob',    [kf(0, -1, 'ease-in-out'), kf(0.5, -3.5, 'ease-in-out'), kf(1.0, -1, 'ease-in-out')]),
        track('body.lean',   [kf(0, -4, 'ease-in-out'), kf(0.5, -5,   'ease-in-out'), kf(1.0, -4, 'ease-in-out')]),
        // Guard hands: front hand up (negative = forward/up in ctx), back hand lower
        track('arm.back',    [kf(0, -14, 'ease-in-out'), kf(0.5, -18, 'ease-in-out'), kf(1.0, -14, 'ease-in-out')]),
        track('arm.front',   [kf(0,  12, 'ease-in-out'), kf(0.5,  16, 'ease-in-out'), kf(1.0,  12, 'ease-in-out')]),
        track('leg.rotL',    [kf(0,  6, 'ease-in-out'),  kf(0.5,  8, 'ease-in-out'),  kf(1.0,  6, 'ease-in-out')]),
        track('leg.rotR',    [kf(0, -6, 'ease-in-out'),  kf(0.5, -8, 'ease-in-out'),  kf(1.0, -6, 'ease-in-out')]),
    ]);

    /* ──────────────────────── walk_back (0.8 s loop) ── */
    CLIPS.walk_back = new AnimationClip('walk_back', 0.8, true, [
        track('body.bob',  [
            kf(0.0, -1, 'ease-in-out'), kf(0.2, -4, 'ease-in-out'),
            kf(0.4, -1, 'ease-in-out'), kf(0.6, -4, 'ease-in-out'), kf(0.8, -1, 'ease-in-out'),
        ]),
        track('body.lean', [kf(0, -5)]),
        // Legs: reversed gait direction
        track('leg.rotL',  [kf(0,  14, 'ease-in-out'), kf(0.4, -14, 'ease-in-out'), kf(0.8,  14, 'ease-in-out')]),
        track('leg.rotR',  [kf(0, -14, 'ease-in-out'), kf(0.4,  14, 'ease-in-out'), kf(0.8, -14, 'ease-in-out')]),
        track('leg.kneeL', [kf(0, 0, 'ease-in-out'), kf(0.55, 16, 'ease-in-out'), kf(0.8, 0)]),
        track('leg.kneeR', [kf(0, 0, 'ease-in-out'), kf(0.15, 16, 'ease-in-out'), kf(0.4, 0), kf(0.8, 0)]),
        // Arms: maintain guard while walking back
        track('arm.back',  [kf(0, -14 + 10, 'ease-in-out'), kf(0.4, -14 - 10, 'ease-in-out'), kf(0.8, -14 + 10, 'ease-in-out')]),
        track('arm.front', [kf(0,  12 - 10, 'ease-in-out'), kf(0.4,  12 + 10, 'ease-in-out'), kf(0.8,  12 - 10, 'ease-in-out')]),
    ]);

    /* ──────────────────── special_attack (0.7 s, loops) ── */
    // Large circular overhead smash / special move.
    CLIPS.special_attack = new AnimationClip('special_attack', 0.7, true, [
        track('arm.back',    [
            kf(0.00, -14, 'ease-in'),
            kf(0.08, -32, 'ease-out'),
            kf(0.28,  50, 'ease-spring'),
            kf(0.40,  46),
            kf(0.70, -14, 'ease-in-out'),
        ]),
        track('arm.front',   [
            kf(0.00,  12, 'ease-in'),
            kf(0.10, -24, 'ease-out'),
            kf(0.28, -38, 'ease-spring'),
            kf(0.70,  12, 'ease-in-out'),
        ]),
        track('arm.punchExt',[
            kf(0.00,  0,  'ease-out'),
            kf(0.28, 34,  'ease-spring'),
            kf(0.40, 32),
            kf(0.70,  0,  'ease-in'),
        ]),
        track('body.lean',   [kf(0, -4, 'ease-out'), kf(0.28, 14, 'ease-out'), kf(0.7, -4, 'ease-in-out')]),
        track('body.bob',    [kf(0, -2, 'ease-in'), kf(0.28, -7, 'ease-out'), kf(0.7, -2)]),
        track('leg.rotL',    [kf(0,  6, 'ease-out'), kf(0.28, -12, 'ease-out'), kf(0.7,  6)]),
        track('leg.rotR',    [kf(0, -6, 'ease-out'), kf(0.28,   8, 'ease-out'), kf(0.7, -6)]),
    ]);

    /* ─────────────────────────────────── block (0.3 s loop) ── */
    // Baked-in guard position (no separate blockRaise flag needed).
    // arm.front at −25 = equivalent of stanceAngle(−28)+swing(10)+blockAngle(−35) − stanceAngle = 10−35 = −25
    CLIPS.block = new AnimationClip('block', 0.3, true, [
        track('body.lean',  [kf(0, -5)]),
        track('body.bob',   [kf(0, -2, 'ease-in-out'), kf(0.15, -4, 'ease-in-out'), kf(0.3, -2, 'ease-in-out')]),
        track('arm.back',   [kf(0, -14, 'ease-in-out'), kf(0.15, -18, 'ease-in-out'), kf(0.3, -14, 'ease-in-out')]),
        track('arm.front',  [kf(0, -25, 'ease-in-out'), kf(0.15, -28, 'ease-in-out'), kf(0.3, -25, 'ease-in-out')]),
        track('leg.rotL',   [kf(0,  4)]),
        track('leg.rotR',   [kf(0, -4)]),
    ]);

    /* ============================================================
       STATE → CLIP NAME MAP
       ============================================================ */

    const STATE_CLIP_MAP = {
        idle:           'idle',
        walk:           'walk',
        run:            'run',
        attack:         'punch',
        punch:          'punch',
        kick:           'kick',
        jump:           'jump',
        hurt:           'hurt',
        dead:           'death',
        death:          'death',
        crouch:         'crouch',
        block:          'block',
        idle_fight:     'idle_fight',
        walk_back:      'walk_back',
        special_attack: 'special_attack',
    };

    function getClipForState(state) {
        const name = STATE_CLIP_MAP[state] || 'idle';
        return CLIPS[name] || CLIPS.idle;
    }

    /* ============================================================
       SKELETON FACTORIES
       ============================================================ */

    /**
     * Standard humanoid skeleton (used by HumanoidRenderer).
     *
     * Origin = hips.  Angle convention:
     *   worldAngle = parentWorldAngle + bone.restAngle
     *   0° = right, −90° = up (canvas −Y), +90° = down (canvas +Y)
     *
     * For a bone that continues in the SAME direction as its parent use restAngle=0.
     * For a bone that branches, use restAngle = (desired_worldAngle − parent.worldAngle).
     *
     * Example chain pointing straight up (each bone restAngle=0 after the first):
     *   hips(world=0°) → spine(rest=−90° → world=−90°) → neck(rest=0° → world=−90°) → …
     *
     * All lengths in px at scale=1, matching humanoid-renderer.js pixel layout.
     */
    function createHumanoidSkeleton() {
        const sk = new Skeleton();

        // Root — hips pivot (no length)
        sk.addBone('hips',        null,        0,    0);   // world=0°

        // ── Spine chain: straight up (−90°) ──────────────────────────
        sk.addBone('spine',       'hips',     23,  -90);   // world=−90°; tip = shoulder level
        sk.addBone('neck',        'spine',     6,    0);   // world=−90°; continue up
        sk.addBone('head',        'neck',     14,    0);   // world=−90°; tip = top of head

        // ── Left arm: branch LEFT from spine.tip (shoulder) ──────────
        // desired: shoulder_l worldAngle = 180° (going left)
        // restAngle = 180 − (−90) = 270°
        sk.addBone('shoulder_l',  'spine',     9,  270);   // world=180° (left)
        // upper_arm: from shoulder_l.tip, go DOWN (90°): restAngle = 90 − 180 = −90°
        sk.addBone('upper_arm_l', 'shoulder_l', 18, -90);  // world=90° (down)
        sk.addBone('lower_arm_l', 'upper_arm_l', 17,   0); // world=90°
        sk.addBone('hand_l',      'lower_arm_l',  5,   0); // world=90°

        // ── Right arm: branch RIGHT from spine.tip ────────────────────
        // desired: shoulder_r worldAngle = 0° (going right)
        // restAngle = 0 − (−90) = 90°
        sk.addBone('shoulder_r',  'spine',     9,   90);   // world=0° (right)
        // upper_arm: go DOWN from shoulder: restAngle = 90 − 0 = 90°
        sk.addBone('upper_arm_r', 'shoulder_r', 18,  90);  // world=90° (down)
        sk.addBone('lower_arm_r', 'upper_arm_r', 17,   0); // world=90°
        sk.addBone('hand_r',      'lower_arm_r',  5,   0); // world=90°

        // ── Left leg: hip socket 7 px to the LEFT of hips ────────────
        // hip_l points left (180°): restAngle = 180 − 0 = 180°
        sk.addBone('hip_l',       'hips',      7,  180);   // world=180° (left); tip=(−7,0)
        // thigh: go DOWN (90°): restAngle = 90 − 180 = −90°
        sk.addBone('thigh_l',     'hip_l',    22,  -90);   // world=90° (down)
        sk.addBone('shin_l',      'thigh_l',  29,    0);   // world=90°
        // foot angled forward (135°): restAngle = 135 − 90 = 45°
        sk.addBone('foot_l',      'shin_l',   10,   45);   // world=135°

        // ── Right leg: hip socket 7 px to the RIGHT of hips ──────────
        sk.addBone('hip_r',       'hips',      7,    0);   // world=0° (right); tip=(7,0)
        // thigh: go DOWN: restAngle = 90 − 0 = 90°
        sk.addBone('thigh_r',     'hip_r',    22,   90);   // world=90° (down)
        sk.addBone('shin_r',      'thigh_r',  29,    0);   // world=90°
        sk.addBone('foot_r',      'shin_r',   10,   45);   // world=135°

        return sk;
    }

    /**
     * Fighter skeleton — wider chest, taller torso, wider fighting stance.
     * Used by CharacterRenderer (tournament-fighters).
     */
    function createFighterSkeleton() {
        const sk = new Skeleton();

        sk.addBone('hips',        null,        0,    0);   // world=0°

        // Taller torso: belt-to-shoulder ≈ 40px in character-renderer
        sk.addBone('spine',       'hips',     40,  -90);   // world=−90°
        sk.addBone('neck',        'spine',     8,    0);   // world=−90°
        sk.addBone('head',        'neck',     16,    0);   // world=−90°

        // Left arm — fighter arms are wider (more out from body)
        sk.addBone('shoulder_l',  'spine',    13,  270);   // world=180°
        sk.addBone('upper_arm_l', 'shoulder_l', 20, -90);  // world=90°
        sk.addBone('lower_arm_l', 'upper_arm_l', 18,  0);
        sk.addBone('hand_l',      'lower_arm_l',  7,  0);

        // Right arm
        sk.addBone('shoulder_r',  'spine',    13,   90);   // world=0°
        sk.addBone('upper_arm_r', 'shoulder_r', 20,  90);  // world=90°
        sk.addBone('lower_arm_r', 'upper_arm_r', 18,  0);
        sk.addBone('hand_r',      'lower_arm_r',  7,  0);

        // Left leg — wider fighting stance (9px hip offset)
        sk.addBone('hip_l',       'hips',      9,  180);   // world=180°
        sk.addBone('thigh_l',     'hip_l',    26,  -90);   // world=90°
        sk.addBone('shin_l',      'thigh_l',  30,    0);   // world=90°
        sk.addBone('foot_l',      'shin_l',   11,   45);   // world=135°

        // Right leg
        sk.addBone('hip_r',       'hips',      9,    0);   // world=0°
        sk.addBone('thigh_r',     'hip_r',    26,   90);   // world=90°
        sk.addBone('shin_r',      'thigh_r',  30,    0);
        sk.addBone('foot_r',      'shin_r',   11,   45);

        return sk;
    }

    /* ============================================================
       SKELETON RENDERER  (debug / direct bone drawing)
       ============================================================ */

    /**
     * Draws skeleton bones directly onto a canvas context.
     * Uses the same tapered-limb bezier style as the existing renderers.
     *
     *   skeletonRenderer.draw(ctx, skeleton, { scale, color, lineWidth })
     *   skeletonRenderer.drawBone(ctx, bone, wRoot, wTip, fillStyle)
     */
    class SkeletonRenderer {

        /**
         * Draw a single bone as a tapered bezier capsule.
         * The bone's worldX/Y (base) and tipX/Y are used directly.
         */
        drawBone(ctx, bone, wRoot, wTip, fillStyle) {
            if (!bone || bone.length <= 0) return;
            const x0 = bone.worldX, y0 = bone.worldY;
            const x1 = bone.tipX,   y1 = bone.tipY;
            const ang  = Math.atan2(y1 - y0, x1 - x0);
            const perp = ang + Math.PI / 2;
            const rx = Math.cos(perp), ry = Math.sin(perp);

            ctx.beginPath();
            ctx.moveTo(x0 - rx * wRoot, y0 - ry * wRoot);
            ctx.bezierCurveTo(
                x0 - rx * wRoot + (x1 - x0) * 0.4,
                y0 - ry * wRoot + (y1 - y0) * 0.4,
                x1 - rx * wTip  - (x1 - x0) * 0.2,
                y1 - ry * wTip  - (y1 - y0) * 0.2,
                x1 - rx * wTip,
                y1 - ry * wTip
            );
            ctx.lineTo(x1 + rx * wTip, y1 + ry * wTip);
            ctx.bezierCurveTo(
                x1 + rx * wTip  - (x1 - x0) * 0.2,
                y1 + ry * wTip  - (y1 - y0) * 0.2,
                x0 + rx * wRoot + (x1 - x0) * 0.4,
                y0 + ry * wRoot + (y1 - y0) * 0.4,
                x0 + rx * wRoot,
                y0 + ry * wRoot
            );
            ctx.closePath();
            ctx.fillStyle = fillStyle || '#e8c090';
            ctx.fill();
        }

        /**
         * Draw the full skeleton tree (good for debugging or alternative rendering).
         * @param {CanvasRenderingContext2D} ctx
         * @param {Skeleton} skeleton  Must have been update()'d first
         * @param {object}  opts      { scale, color, boneWidth }
         */
        draw(ctx, skeleton, opts) {
            opts = opts || {};
            const scale = opts.scale || 1;
            const color = opts.color || '#e8c090';
            const bw    = opts.boneWidth || 6;
            ctx.save();
            ctx.scale(scale, scale);
            if (skeleton.root) this._drawRecursive(ctx, skeleton.root, color, bw);
            ctx.restore();
        }

        _drawRecursive(ctx, bone, color, bw) {
            this.drawBone(ctx, bone, bw, bw * 0.65, color);
            for (const child of bone.children) {
                this._drawRecursive(ctx, child, color, bw);
            }
        }
    }

    /* ============================================================
       CONVENIENCE: shared singleton player  (stateless use via setAbsoluteTime)
       ============================================================ */

    const _sharedPlayer = new AnimationPlayer();

    /**
     * One-call snapshot suitable for the legacy renderer switch() blocks.
     *
     * @param {string} state     e.g. 'idle', 'walk', 'punch', 'kick' …
     * @param {number} animTimeMs  Absolute timestamp (ms); Date.now() works perfectly
     * @returns {object}  Snapshot with all legacy rendering parameters
     */
    function getSnapshot(state, animTimeMs) {
        const clip = getClipForState(state);
        _sharedPlayer.setAbsoluteTime(animTimeMs, clip.name);
        // Override the clip reference properly
        _sharedPlayer.clip = clip;
        _sharedPlayer.time = (animTimeMs / 1000) % clip.duration;
        return _sharedPlayer.getSnapshot();
    }

    /* ============================================================
       EXPORT
       ============================================================ */

    window.SkeletonEngine = {
        // Classes
        Bone,
        Skeleton,
        Track,
        AnimationClip,
        AnimationPlayer,
        SkeletonRenderer,

        // Built-in clip library
        CLIPS,
        STATE_CLIP_MAP,

        // Factories
        createHumanoidSkeleton,
        createFighterSkeleton,

        // Helpers
        getClipForState,
        getSnapshot,           // ← one-liner for legacy renderers
        Easing,
        applyEasing,
    };

    console.log('[SkeletonEngine] loaded — clips:', Object.keys(CLIPS).join(', '));

})();
