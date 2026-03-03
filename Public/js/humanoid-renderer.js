/**
 * HumanoidRenderer — General-purpose premium canvas humanoid character renderer
 * Used by: street-brawlers (beat-em-up-engine), dragon-fist, contra-commando, mega-heroes
 *
 * Uses the same volumetric gradients, bezier-curve anatomy, and specular highlight
 * techniques as character-renderer.js — applied to all action-game characters.
 *
 * API:
 *   window.humanoidRenderer.draw(ctx, x, y, opts)
 *
 * opts:
 *   facing      : 1 (right, default) | -1 (left)
 *   scale       : number (default 1). At scale=1 character is ~90px tall.
 *   state       : 'idle'|'walk'|'attack'|'punch'|'kick'|'hurt'|'jump'|'dead'|'crouch'
 *   animTime    : timestamp in ms (for walk cycle, idle sway)
 *   skin        : hex skin colour  (default '#e8c090')
 *   cloth       : hex body colour  (default '#3060c0')
 *   accent      : hex belt/trim    (default '#f0c040')
 *   hair        : hex hair         (default '#1a1a1a')
 *   boot        : hex boot         (default '#3a2810')
 *   muscular    : boolean          (default false)
 *   headStyle   : 'normal'|'mohawk'|'bandana'|'helmet'|'bald'|'mask'|'hood' (default 'normal')
 *   headColor   : hex for accessory (default null → uses accent)
 *   weapon      : null|'gun'|'rifle' (default null)
 */
(function () {
    'use strict';

    /* ------------------------------------------------------------------ */
    /*  Geometry / colour helpers (mirrors character-renderer.js)           */
    /* ------------------------------------------------------------------ */

    function rr(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function tl(ctx, x, yT, yB, wT, wB) {
        ctx.beginPath();
        ctx.moveTo(x - wT, yT);
        ctx.bezierCurveTo(x - wT, yT + (yB - yT) * 0.4, x - wB, yT + (yB - yT) * 0.6, x - wB, yB);
        ctx.lineTo(x + wB, yB);
        ctx.bezierCurveTo(x + wB, yB - (yB - yT) * 0.4, x + wT, yB - (yB - yT) * 0.6, x + wT, yT);
        ctx.closePath();
    }

    function ss(ctx, x, y, rx, ry) {
        ctx.save();
        for (const s of [{ f: 1.0, a: 0.18 }, { f: 0.7, a: 0.18 }, { f: 0.4, a: 0.14 }]) {
            ctx.globalAlpha = s.a;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(x, y, rx * s.f, ry * s.f, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function sd(ctx, x, y, rx, ry, col) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
        g.addColorStop(0, col || 'rgba(255,255,255,0.6)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function vg(ctx, x1, y1, x2, y2, hi, mid, lo) {
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, hi);
        g.addColorStop(0.5, mid);
        g.addColorStop(1, lo);
        return g;
    }

    function hexRGB(hex) {
        const h = (hex || '#888888').replace('#', '');
        return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    }

    function toHex(r, g, b) {
        return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    }

    function lh(hex, n) {
        if (!hex || hex.length < 7) return hex || '#888888';
        const c = hexRGB(hex);
        return toHex(c.r + n, c.g + n, c.b + n);
    }

    function dh(hex, n) {
        if (!hex || hex.length < 7) return hex || '#222222';
        const c = hexRGB(hex);
        return toHex(c.r - n, c.g - n, c.b - n);
    }

    /* ------------------------------------------------------------------ */
    /*  HumanoidRenderer class                                              */
    /* ------------------------------------------------------------------ */

    class HumanoidRenderer {

        /**
         * Draw a humanoid character.
         * x, y = feet-centre position in ctx coordinates.
         */
        draw(ctx, x, y, opts = {}) {
            const {
                facing    = 1,
                scale     = 1,
                state     = 'idle',
                animTime  = 0,
                skin      = '#e8c090',
                cloth     = '#3060c0',
                accent    = '#f0c040',
                hair      = '#1a1a1a',
                boot      = '#3a2810',
                muscular  = false,
                headStyle = 'normal',
                headColor = null,
                weapon    = null,
            } = opts;

            const p = {
                skin, skinMid: lh(skin, -14), skinSh: dh(skin, 30),
                cloth, clothMid: lh(cloth, -10), clothSh: dh(cloth, 28),
                accent, accentMid: lh(accent, -10), accentSh: dh(accent, 22),
                hair, boot, bootSh: dh(boot, 20),
                spec: 'rgba(255,255,255,0.52)',
            };

            // ── Skeletal animation: use SkeletonEngine if loaded, else fall back ──
            let bob = 0, lean = 0, hurtTilt = 0, jumpOffset = 0;
            let legSpread = 0, punchExt = 0, kickAngle = 0, deadSlump = false;
            // Per-limb rotation angles (degrees) — populated by snapshot or fallback
            let legRotL = 0, legRotR = 0, legKneeL = 0, legKneeR = 0;
            let armBack = -4, armFront = 6;  // rest positions

            if (window.SkeletonEngine) {
                // ── Proper keyframe animation via skeleton engine ──────────────
                const snap = window.SkeletonEngine.getSnapshot(state, animTime);
                bob        = snap.bob;
                lean       = snap.lean;
                hurtTilt   = snap.hurtTilt;
                jumpOffset = snap.jumpOffset;
                legSpread  = snap.legSpread;
                legRotL    = snap.legRotL;
                legRotR    = snap.legRotR;
                legKneeL   = snap.legKneeL;
                legKneeR   = snap.legKneeR;
                kickAngle  = snap.kickAngle;
                armBack    = snap.armBack;
                armFront   = snap.armFront;
                punchExt   = snap.punchExt;
                deadSlump  = snap.deadSlump;
            } else {
                // ── Legacy fallback (original Math.sin behavior) ───────────────
                const t = animTime / 1000;
                let armSwing = 0, walkPhase = 0;
                switch (state) {
                    case 'idle':
                        bob = Math.sin(t * Math.PI * 1.6) * 1.8;
                        armSwing = Math.sin(t * Math.PI * 1.6) * 2;
                        break;
                    case 'walk': case 'run':
                        walkPhase = t * (state === 'run' ? 6 : 4);
                        armSwing  = Math.sin(walkPhase) * (state === 'run' ? 18 : 12);
                        bob       = Math.abs(Math.sin(walkPhase)) * -2.5;
                        break;
                    case 'attack': case 'punch':
                        punchExt = Math.sin(Math.min(t * Math.PI * 2, Math.PI)) * 24;
                        lean     = punchExt * 0.25;
                        break;
                    case 'kick':
                        kickAngle = Math.sin(Math.min(t * Math.PI * 2, Math.PI)) * 60;
                        lean      = kickAngle * 0.08;
                        break;
                    case 'hurt':   hurtTilt = 13; lean = -8; break;
                    case 'jump':   jumpOffset = -18; legSpread = 14; armSwing = -15; break;
                    case 'crouch': bob = 14; legSpread = 6; break;
                    case 'dead':   deadSlump = true; hurtTilt = 25; break;
                }
                // Map legacy single armSwing into separate back/front values
                armBack  = armSwing - 4;
                armFront = -armSwing + 6;
                // Map walkPhase into per-leg degree rotations via the sine formula
                legRotL  = legSpread > 0 ? -legSpread : Math.sin( walkPhase) * 20;
                legRotR  = legSpread > 0 ?  legSpread : Math.sin(-walkPhase) * 20;
                // Knee: half of thigh rotation (anatomically backward = negative sign applied in _drawLeg)
                legKneeL = Math.abs(legRotL) * 0.5;
                legKneeR = Math.abs(legRotR) * 0.5;
            }

            ctx.save();
            ctx.translate(x, y + bob + jumpOffset);
            if (facing === -1) ctx.scale(-1, 1);
            ctx.scale(scale, scale);
            ctx.rotate(hurtTilt * Math.PI / 180);

            // Ground shadow
            ss(ctx, lean, 1, 18, 5);

            ctx.translate(lean, 0);

            if (!deadSlump) {
                // Draw order: back leg → back arm → torso → front arm → head → front leg
                this._drawLeg(ctx, p, muscular,  7, legRotL, legKneeL, false);
                this._drawArm(ctx, p, muscular, -1, armBack,  0,         state, false);
                this._drawTorso(ctx, p, muscular, state);
                this._drawArm(ctx, p, muscular,  1, armFront, punchExt,  state, true);
                this._drawHead(ctx, p, headStyle, headColor || accent, state, animTime / 1000);
                this._drawLeg(ctx, p, muscular, -7, legRotR, legKneeR, true, kickAngle);
            } else {
                // Dead — draw flat
                ctx.save();
                ctx.globalAlpha = 0.75;
                tl(ctx, 0, -4, -55, 16, 12);
                ctx.fillStyle = vg(ctx, -16, -55, 16, 0, p.clothMid, p.cloth, p.clothSh);
                ctx.fill();
                ctx.restore();
            }

            if (weapon) this._drawWeapon(ctx, weapon, p, state, punchExt);

            // Hurt flash
            if (state === 'hurt') {
                ctx.save();
                ctx.globalAlpha = 0.22;
                ctx.fillStyle = '#fff';
                ctx.fillRect(-18, -105, 36, 110);
                ctx.restore();
            }

            ctx.restore();
        }

        /* ---------------------------------------------------------------- */

        /**
         * Draw one leg.
         * legRotDeg  : thigh rotation in degrees  (+= swing forward, canvas-space)
         * kneeBendDeg: knee bend in degrees        (+= calf bends anatomically backward)
         */
        _drawLeg(ctx, p, muscular, sideX, legRotDeg, kneeBendDeg, isFront, kickAng = 0) {
            const mw = muscular ? 1.25 : 1;
            const tw = 7 * mw, cw = 5.5 * mw;

            ctx.save();
            ctx.translate(sideX, 0);

            if (kickAng && isFront) {
                // Raised kick leg
                ctx.rotate(-kickAng * Math.PI / 180);
                ctx.translate(0, -32);
                tl(ctx, 0, -26, 0, tw, cw * 0.8);
                ctx.fillStyle = vg(ctx, -tw, -26, tw, 0, lh(p.cloth, 10), p.cloth, p.clothSh);
                ctx.fill();
                ctx.restore();
                return;
            }

            // Thigh rotation: direct degrees from skeleton or legacy phase
            const rot = (legRotDeg || 0) * Math.PI / 180;
            ctx.rotate(rot);

            // Thigh
            const thighT = -56, thighB = -34;
            tl(ctx, 0, thighT, thighB, tw, tw * 0.88);
            ctx.fillStyle = vg(ctx, -tw, thighT, tw, thighB,
                isFront ? lh(p.cloth, 10) : p.cloth,
                p.clothMid, p.clothSh);
            ctx.fill();

            // Knee
            const kg = ctx.createRadialGradient(-1, thighB, 0, -1, thighB, cw + 1);
            kg.addColorStop(0, isFront ? p.clothMid : p.clothSh);
            kg.addColorStop(1, p.clothSh);
            ctx.fillStyle = kg;
            ctx.beginPath();
            ctx.ellipse(0, thighB, cw * 1.05, cw * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();

            // Calf — knee bend driven by kneeBendDeg (skeleton) or half of thigh rotation (legacy)
            ctx.save();
            const kneeBendRad = (kneeBendDeg !== undefined && kneeBendDeg !== null)
                ? -(kneeBendDeg || 0) * Math.PI / 180
                : (rot !== 0 ? -rot * 0.5 : 0);
            ctx.rotate(kneeBendRad);
            tl(ctx, 0, thighB, -5, cw, cw * 0.68);
            ctx.fillStyle = vg(ctx, -cw, thighB, cw, -5,
                p.clothMid, p.clothSh, dh(p.clothSh, 8));
            ctx.fill();

            // AO at knee
            ctx.save(); ctx.globalAlpha = 0.17; ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(0, thighB + 2, cw * 0.85, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Boot/shoe
            const bootG = vg(ctx, -cw - 2, -12, cw + 6, -3, lh(p.boot, 18), p.boot, p.bootSh);
            ctx.fillStyle = bootG;
            rr(ctx, -cw - 2, -12, (cw + 2) * 2 + 2, 9, 3);
            ctx.fill();
            // Sole stripe
            ctx.fillStyle = p.bootSh;
            rr(ctx, -cw - 2, -4, (cw + 2) * 2 + 2, 3, 1.5);
            ctx.fill();
            sd(ctx, -cw + 1, -9, 3, 2, 'rgba(255,255,255,0.30)');

            ctx.restore(); // calf group
            ctx.restore(); // leg translate
        }

        _drawTorso(ctx, p, muscular, state) {
            const bw = muscular ? 14 : 11;  // half-width at belt
            const sw = muscular ? 18 : 14;  // half-width at shoulder
            const bY = -58, shY = -81;

            // Torso shape
            ctx.beginPath();
            ctx.moveTo(-bw, bY);
            ctx.bezierCurveTo(-bw - 1, bY - 10, -sw - 1, shY + 10, -sw, shY);
            ctx.lineTo(sw, shY);
            ctx.bezierCurveTo(sw + 1, shY + 10, bw + 1, bY - 10, bw, bY);
            ctx.closePath();
            ctx.fillStyle = vg(ctx, -sw, shY, sw, bY, lh(p.cloth, 16), p.clothMid, p.clothSh);
            ctx.fill();

            // Shoulder caps
            for (const side of [-1, 1]) {
                const sg = ctx.createRadialGradient(side * (sw - 2), shY + 3, 0, side * (sw - 2), shY + 3, 7);
                sg.addColorStop(0, lh(p.cloth, 10));
                sg.addColorStop(1, p.clothSh);
                ctx.fillStyle = sg;
                ctx.beginPath();
                ctx.ellipse(side * sw, shY + 4, 6, 5.5, 0, 0, Math.PI * 2);
                ctx.fill();
                sd(ctx, side * sw - side * 2, shY, 3, 2.5, p.spec);
            }

            // Chest specular
            sd(ctx, -sw * 0.38, shY + 8, sw * 0.4, 8, p.spec);

            // Centre seam
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, shY + 2); ctx.lineTo(0, bY); ctx.stroke();
            ctx.restore();

            // Belt
            const belg = vg(ctx, -bw, bY, bw, bY + 8, lh(p.accent, 20), p.accent, dh(p.accent, 18));
            ctx.fillStyle = belg;
            rr(ctx, -bw, bY, bw * 2, 8, 2);
            ctx.fill();
            ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff';
            ctx.fillRect(-bw + 1, bY + 1, bw * 2 - 2, 2); ctx.restore();
            // Belt buckle
            const bkg = vg(ctx, -4, bY, 4, bY + 8, lh(p.accent, 12), p.accent, dh(p.accent, 25));
            ctx.fillStyle = bkg; rr(ctx, -4, bY - 1, 8, 10, 2.5); ctx.fill();

            // Muscle / pec lines
            if (muscular) {
                ctx.save();
                ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(-6, shY + 14, 7, 0.3, Math.PI - 0.3); ctx.stroke();
                ctx.beginPath(); ctx.arc( 6, shY + 14, 7, 0.3, Math.PI - 0.3); ctx.stroke();
                ctx.lineWidth = 0.7;
                ctx.beginPath(); ctx.moveTo(0, shY + 8); ctx.lineTo(0, shY + 22); ctx.stroke();
                ctx.restore();
            }

            // AO under arms
            ctx.save(); ctx.globalAlpha = 0.13; ctx.fillStyle = '#000';
            for (const s of [-1, 1]) {
                ctx.beginPath(); ctx.ellipse(s * (sw - 1), shY + 8, 5, 3, s * 0.3, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }

        _drawArm(ctx, p, muscular, side, swing, ext, state, isFront) {
            const sw = muscular ? 18 : 14;
            const uw = muscular ? 6 : 4.8;
            const lw = muscular ? 5 : 3.8;
            const uLen = muscular ? 22 : 18;
            const lLen = muscular ? 20 : 17;
            const shY = -81;
            const shX = side * sw;

            // Natural fighting-stance angle
            const baseAng = (isFront ? -22 : -10) * Math.PI / 180;

            ctx.save();
            ctx.translate(shX, shY);
            ctx.rotate(baseAng + swing * Math.PI / 180);

            const col    = isFront ? p.skin    : p.skinMid;
            const colMid = isFront ? p.skinMid : p.skinSh;
            const colSh  = p.skinSh;

            // Upper arm
            tl(ctx, 0, 0, uLen, uw, uw * 0.82);
            ctx.fillStyle = vg(ctx, -uw, 0, uw, uLen, col, colMid, colSh);
            ctx.fill();
            if (isFront) sd(ctx, -uw * 0.4, 4, uw * 0.4, 3, p.spec);

            // Elbow joint
            const eg = ctx.createRadialGradient(0, uLen, 0, 0, uLen, lw + 1);
            eg.addColorStop(0, colMid); eg.addColorStop(1, colSh);
            ctx.fillStyle = eg;
            ctx.beginPath(); ctx.ellipse(0, uLen, lw, lw * 0.9, 0, 0, Math.PI * 2); ctx.fill();

            // Forearm (punch extends this)
            ctx.save();
            ctx.translate(0, uLen * 0.96);
            if (ext > 0) ctx.rotate(-ext * 0.01);
            const fLen = lLen + ext * 0.85;
            tl(ctx, 0, 0, fLen, lw, lw * 0.7);
            ctx.fillStyle = vg(ctx, -lw, 0, lw, fLen, colMid, colSh, dh(colSh, 8));
            ctx.fill();

            // Fist
            ctx.translate(0, fLen - 1);
            const fw = lw * 1.3;
            const fg = ctx.createRadialGradient(-fw * 0.3, -fw * 0.3, 0, 0, 0, fw * 1.1);
            fg.addColorStop(0, p.skin); fg.addColorStop(0.5, p.skinMid); fg.addColorStop(1, p.skinSh);
            ctx.fillStyle = fg;
            rr(ctx, -fw, -fw * 0.45, fw * 2, fw * 1.2, 3);
            ctx.fill();
            sd(ctx, -fw * 0.3, -fw * 0.2, fw * 0.32, fw * 0.22, p.spec);

            ctx.restore(); // forearm
            ctx.restore(); // arm
        }

        _drawHead(ctx, p, headStyle, hColor, state, t) {
            const headCY = -93;
            const rx = 11, ry = 12;

            ctx.save();

            // Hair / headgear behind head
            if (headStyle === 'mohawk') {
                const mg = vg(ctx, -3, headCY - 22, 3, headCY - 10, lh(p.hair, 18), p.hair, dh(p.hair, 14));
                ctx.fillStyle = mg;
                ctx.beginPath();
                ctx.moveTo(-4, headCY - 10);
                ctx.bezierCurveTo(-5, headCY - 17, -3, headCY - 24, 0, headCY - 28);
                ctx.bezierCurveTo(3, headCY - 24, 5, headCY - 17, 4, headCY - 10);
                ctx.closePath(); ctx.fill();
                sd(ctx, -1, headCY - 22, 2, 4, 'rgba(255,255,255,0.35)');
            } else if (headStyle !== 'bald' && headStyle !== 'mask' && headStyle !== 'helmet' && headStyle !== 'hood') {
                // Normal hair behind
                const hg = ctx.createRadialGradient(-3, headCY - 5, 0, 0, headCY - 3, rx * 1.3);
                hg.addColorStop(0, lh(p.hair, 16));
                hg.addColorStop(0.6, p.hair);
                hg.addColorStop(1, dh(p.hair, 18));
                ctx.fillStyle = hg;
                ctx.beginPath();
                ctx.ellipse(0, headCY - 3, rx * 1.05, ry * 0.88, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            if (headStyle === 'hood') {
                ctx.fillStyle = lh(hColor, 6);
                ctx.beginPath();
                ctx.moveTo(-rx - 3, headCY + ry);
                ctx.lineTo(0, headCY - ry - 14);
                ctx.lineTo(rx + 3, headCY + ry);
                ctx.closePath(); ctx.fill();
            }

            // Head base
            const headG = ctx.createRadialGradient(-rx * 0.35, headCY - ry * 0.35, 1, rx * 0.1, headCY, rx * 1.35);
            headG.addColorStop(0, lh(p.skin, 12));
            headG.addColorStop(0.45, p.skin);
            headG.addColorStop(0.8, p.skinMid);
            headG.addColorStop(1, p.skinSh);
            ctx.fillStyle = headG;
            ctx.beginPath();
            ctx.ellipse(0, headCY, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();

            // Outline
            ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.ellipse(0, headCY, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // Head specular
            sd(ctx, -rx * 0.35, headCY - ry * 0.52, rx * 0.38, ry * 0.28, p.spec);

            // --- Bandana ---
            if (headStyle === 'bandana') {
                const bY = headCY - ry * 0.38;
                ctx.fillStyle = vg(ctx, -rx, bY, rx, bY + 6, lh(hColor, 20), hColor, dh(hColor, 14));
                rr(ctx, -rx, bY, rx * 2, 6, 1.5); ctx.fill();
                ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#fff';
                ctx.fillRect(-rx + 1, bY + 1, rx * 2 - 2, 1.5); ctx.restore();
            }

            // --- Helmet ---
            if (headStyle === 'helmet') {
                const helmG = ctx.createRadialGradient(-rx * 0.3, headCY - ry * 0.4, 1, 0, headCY - ry * 0.1, rx * 1.6);
                helmG.addColorStop(0, lh(hColor, 22));
                helmG.addColorStop(0.5, hColor);
                helmG.addColorStop(1, dh(hColor, 20));
                ctx.fillStyle = helmG;
                ctx.beginPath();
                ctx.ellipse(0, headCY - 2, rx + 2, ry, 0, Math.PI, Math.PI * 2);
                ctx.lineTo(rx + 2, headCY - 2);
                ctx.closePath(); ctx.fill();
                // Visor
                ctx.fillStyle = 'rgba(20,20,30,0.85)';
                rr(ctx, -rx + 1, headCY - ry * 0.18, (rx - 1) * 2, ry * 0.32, 2);
                ctx.fill();
                sd(ctx, -rx * 0.3, headCY - ry * 0.38, rx * 0.42, 2.5, 'rgba(255,255,255,0.35)');
            }

            // --- Full mask ---
            if (headStyle === 'mask') {
                const mG = ctx.createRadialGradient(-rx * 0.3, headCY - ry * 0.35, 0, 0, headCY, rx * 1.25);
                mG.addColorStop(0, lh(hColor, 10)); mG.addColorStop(1, dh(hColor, 20));
                ctx.fillStyle = mG;
                ctx.beginPath(); ctx.ellipse(0, headCY, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                // Slit eyes
                const eyeY = headCY - ry * 0.22;
                for (const ex of [-rx * 0.38, rx * 0.06]) {
                    ctx.fillStyle = '#f33';
                    ctx.beginPath(); ctx.ellipse(ex + rx * 0.22, eyeY, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
                    // Glow
                    const glw = ctx.createRadialGradient(ex + rx * 0.22, eyeY, 0, ex + rx * 0.22, eyeY, 6);
                    glw.addColorStop(0, 'rgba(255,30,30,0.4)'); glw.addColorStop(1, 'rgba(255,30,30,0)');
                    ctx.fillStyle = glw;
                    ctx.beginPath(); ctx.ellipse(ex + rx * 0.22, eyeY, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore(); return;
            }

            // --- Neck ---
            const nkG = vg(ctx, -3, headCY + ry - 1, 3, headCY + ry + 8, p.skinMid, p.skin, p.skinSh);
            ctx.fillStyle = nkG; rr(ctx, -3, headCY + ry - 1, 6, 8, 2); ctx.fill();

            // --- Eyes ---
            const eyeOpenH = state === 'hurt' ? 2 : 4;
            const eyeY = headCY - ry * 0.24;
            for (const ep of [{ cx: -rx * 0.38 + 2 }, { cx: rx * 0.12 + 2 }]) {
                // Sclera
                ctx.fillStyle = '#f5f5f8';
                ctx.beginPath(); ctx.ellipse(ep.cx, eyeY, 4, eyeOpenH * 0.55, 0, 0, Math.PI * 2); ctx.fill();
                // Iris
                const iG = ctx.createRadialGradient(ep.cx - 0.5, eyeY - 0.5, 0, ep.cx, eyeY, 2.8);
                iG.addColorStop(0, '#5a7050'); iG.addColorStop(0.7, '#3a5035'); iG.addColorStop(1, '#1a2a18');
                ctx.fillStyle = iG;
                ctx.beginPath(); ctx.ellipse(ep.cx, eyeY, 2.2, Math.min(eyeOpenH * 0.5, 2.5), 0, 0, Math.PI * 2); ctx.fill();
                // Pupil
                ctx.fillStyle = '#080808';
                ctx.beginPath(); ctx.ellipse(ep.cx, eyeY, 1.1, Math.min(eyeOpenH * 0.35, 1.3), 0, 0, Math.PI * 2); ctx.fill();
                // Eye highlight
                ctx.fillStyle = 'rgba(255,255,255,0.82)';
                ctx.beginPath(); ctx.ellipse(ep.cx - 1, eyeY - 1, 0.8, 0.65, 0, 0, Math.PI * 2); ctx.fill();
                // Eyelid
                ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.moveTo(ep.cx - 3.5, eyeY - eyeOpenH * 0.5);
                ctx.quadraticCurveTo(ep.cx + 0.5, eyeY - eyeOpenH * 0.65, ep.cx + 4.5, eyeY - eyeOpenH * 0.45);
                ctx.stroke(); ctx.restore();
            }

            // Eyebrows (arched)
            const browY = headCY - ry * 0.46;
            ctx.save(); ctx.strokeStyle = dh(p.hair, 5) || '#2a1a0a'; ctx.lineWidth = 2.1; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-rx * 0.52, browY + 1.5); ctx.quadraticCurveTo(-rx * 0.24, browY - 2.5, -rx * 0.05, browY + 0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo( rx * 0.02, browY + 0.5);  ctx.quadraticCurveTo( rx * 0.22, browY - 2.5,  rx * 0.5,  browY + 1.5); ctx.stroke();
            ctx.restore();

            // Nose
            ctx.save(); ctx.strokeStyle = p.skinSh; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(1, headCY + ry * 0.08);
            ctx.bezierCurveTo(2, headCY + ry * 0.2, 2.5, headCY + ry * 0.28, 1, headCY + ry * 0.3);
            ctx.stroke();
            ctx.fillStyle = dh(p.skinSh, 8);
            ctx.beginPath(); ctx.ellipse(1, headCY + ry * 0.33, 1.1, 0.75, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Mouth
            const mY = headCY + ry * 0.54;
            ctx.save(); ctx.strokeStyle = dh(p.skinSh, 14); ctx.lineWidth = 1.2; ctx.lineCap = 'round';
            if (state === 'attack' || state === 'punch' || state === 'kick') {
                ctx.fillStyle = '#1a0404';
                ctx.beginPath(); ctx.ellipse(0, mY, 4, 2.8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.arc(0, mY, 4, 0, Math.PI); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(-4, mY); ctx.quadraticCurveTo(0, mY - 1.5, 4, mY); ctx.stroke();
                ctx.lineWidth = 0.9;
                ctx.beginPath(); ctx.moveTo(-3.5, mY); ctx.quadraticCurveTo(0, mY + 2, 3.5, mY); ctx.stroke();
            }
            ctx.restore();

            // Bald sheen (bonus specular)
            if (headStyle === 'bald') {
                sd(ctx, -rx * 0.3, headCY - ry * 0.62, rx * 0.52, ry * 0.32, 'rgba(255,255,255,0.28)');
            }

            ctx.restore(); // head group
        }

        _drawWeapon(ctx, weapon, p, state, punchExt) {
            if (weapon === 'gun') {
                ctx.save();
                // Position at right fist approximate location
                ctx.translate(12, -70);
                const gG = vg(ctx, 0, 0, 28, 0, '#888', '#555', '#333');
                ctx.fillStyle = gG; rr(ctx, 0, -3, 20, 6, 2); ctx.fill();
                // Barrel
                ctx.fillStyle = '#444'; rr(ctx, 20, -2, 10, 4, 1.5); ctx.fill();
                // Handle
                ctx.fillStyle = '#6a5a4a'; rr(ctx, 3, 3, 7, 10, 2); ctx.fill();
                ctx.restore();
            } else if (weapon === 'rifle') {
                ctx.save();
                ctx.translate(10, -72);
                const rG = vg(ctx, 0, 0, 40, 0, '#666', '#444', '#222');
                ctx.fillStyle = rG; rr(ctx, 0, -4, 38, 7, 2); ctx.fill();
                ctx.fillStyle = '#888'; rr(ctx, 38, -2.5, 8, 4, 1.5); ctx.fill();
                ctx.fillStyle = '#5a4a3a'; rr(ctx, 2, 3, 12, 12, 3); ctx.fill();
                ctx.restore();
            }
        }
    }

    window.HumanoidRenderer = HumanoidRenderer;
    window.humanoidRenderer = new HumanoidRenderer();

})();
