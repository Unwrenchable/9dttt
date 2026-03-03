/**
 * CharacterRenderer — Premium Canvas-Based Fighter Character System
 * Draws high-fidelity, animated fighter sprites for 9DTTT Tournament Fighters.
 * Uses volumetric gradients, bezier-curve anatomy, specular highlights,
 * ambient occlusion, and per-fighter premium detail passes.
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------------ */
    /*  Fighter profile definitions                                         */
    /* ------------------------------------------------------------------ */
    const FIGHTER_PROFILES = {
        ryu: {
            name: 'RYU',
            palette: {
                gi: '#f0f0e8', giMid: '#d8d8c8', giShade: '#b0b098', giBelt: '#f0c040',
                skin: '#e8c090', skinMid: '#d4a870', skinShade: '#b08848',
                hair: '#1a1a1a', headband: '#e03030', eyes: '#2a2a2a',
                foot: '#8b7355', footShade: '#5a4a30', accent: '#e03030',
                specular: 'rgba(255,255,255,0.55)'
            },
            traits: { headband: true, gi: true, muscular: false }
        },
        chun: {
            name: 'CHUN-LI',
            palette: {
                gi: '#4060d0', giMid: '#3050b8', giShade: '#1a3090', giBelt: '#f0d060',
                skin: '#e8c090', skinMid: '#d4a870', skinShade: '#b08848',
                hair: '#1a1a1a', headband: null, eyes: '#3a3a60',
                foot: '#4060d0', footShade: '#1a3090', accent: '#f0d060',
                specular: 'rgba(255,255,255,0.45)'
            },
            traits: { hairBuns: true, gi: false, qipao: true, muscular: false }
        },
        zangief: {
            name: 'ZANGIEF',
            palette: {
                gi: '#cc2020', giMid: '#aa1010', giShade: '#780808', giBelt: '#f0d000',
                skin: '#d09060', skinMid: '#b87848', skinShade: '#906030',
                hair: '#a83020', headband: null, eyes: '#5a3020',
                foot: '#cc2020', footShade: '#780808', accent: '#f0d000',
                specular: 'rgba(255,255,255,0.35)'
            },
            traits: { mohawk: true, beard: true, gi: false, trunks: true, muscular: true }
        },
        guile: {
            name: 'GUILE',
            palette: {
                gi: '#4a7040', giMid: '#3a5830', giShade: '#243820', giBelt: '#8a7040',
                skin: '#e0b080', skinMid: '#c89060', skinShade: '#a07040',
                hair: '#d4c060', headband: null, eyes: '#4a6040',
                foot: '#4a5030', footShade: '#2a3018', accent: '#c8d040',
                specular: 'rgba(255,255,255,0.40)'
            },
            traits: { flattop: true, military: true, muscular: true }
        },
        blanka: {
            name: 'BLANKA',
            palette: {
                gi: '#206028', giMid: '#185020', giShade: '#0c3010', giBelt: '#d04010',
                skin: '#208030', skinMid: '#186828', skinShade: '#0c4818',
                hair: '#d04010', headband: null, eyes: '#f08020',
                foot: '#206028', footShade: '#0c3010', accent: '#f08020',
                specular: 'rgba(160,255,160,0.35)'
            },
            traits: { wildHair: true, fangs: true, muscular: true, beast: true }
        },
        dhalsim: {
            name: 'DHALSIM',
            palette: {
                gi: '#e0a020', giMid: '#c08010', giShade: '#905800', giBelt: '#c03010',
                skin: '#c08040', skinMid: '#a06830', skinShade: '#784820',
                hair: '#c09040', headband: null, eyes: '#c03010',
                foot: '#c08040', footShade: '#784820', accent: '#c03010',
                specular: 'rgba(255,220,140,0.40)'
            },
            traits: { bald: true, yogaWrap: true, muscular: false, skulls: true }
        },
        ken: {
            name: 'KEN',
            palette: {
                gi: '#e03020', giMid: '#c02010', giShade: '#880808', giBelt: '#f0c040',
                skin: '#e8c080', skinMid: '#d4a860', skinShade: '#b08840',
                hair: '#e0a020', headband: null, eyes: '#2a4080',
                foot: '#8b7355', footShade: '#5a4a30', accent: '#f0c040',
                specular: 'rgba(255,255,255,0.50)'
            },
            traits: { longHair: true, gi: true, muscular: false }
        },
        sagat: {
            name: 'SAGAT',
            palette: {
                gi: '#e8b840', giMid: '#c09820', giShade: '#906000', giBelt: '#c06020',
                skin: '#c08040', skinMid: '#a06830', skinShade: '#784820',
                hair: '#1a1a1a', headband: null, eyes: '#1a1a1a',
                foot: '#e8b840', footShade: '#906000', accent: '#c06020',
                specular: 'rgba(255,220,140,0.35)'
            },
            traits: { eyepatch: true, shirtless: true, thaiWrap: true, muscular: true, bald: true, scar: true }
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Low-level geometry helpers                                          */
    /* ------------------------------------------------------------------ */

    /** Rounded rectangle path (clockwise, no fill/stroke) */
    function roundRect(ctx, x, y, w, h, r) {
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

    /**
     * Tapered limb using a bezier trapezoid.
     * (x, yTop) = top-centre, (x, yBot) = bottom-centre
     * wTop/wBot = half-widths at top and bottom
     */
    function taperedLimb(ctx, x, yTop, yBot, wTop, wBot) {
        ctx.beginPath();
        ctx.moveTo(x - wTop, yTop);
        ctx.bezierCurveTo(x - wTop, yTop + (yBot - yTop) * 0.4,
                          x - wBot, yTop + (yBot - yTop) * 0.6,
                          x - wBot, yBot);
        ctx.lineTo(x + wBot, yBot);
        ctx.bezierCurveTo(x + wBot, yBot - (yBot - yTop) * 0.4,
                          x + wTop, yBot - (yBot - yTop) * 0.6,
                          x + wTop, yTop);
        ctx.closePath();
    }

    /** Soft multi-ring ellipse to simulate a blurred shadow */
    function softShadow(ctx, x, y, rx, ry) {
        const rings = [
            { s: 1.0, a: 0.18 },
            { s: 0.75, a: 0.20 },
            { s: 0.50, a: 0.18 },
        ];
        ctx.save();
        for (const r of rings) {
            ctx.globalAlpha = r.a;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(x, y, rx * r.s, ry * r.s, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /** Small specular gleam drawn on top of a filled shape */
    function specularDot(ctx, x, y, rx, ry, color) {
        const sg = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
        sg.addColorStop(0, color || 'rgba(255,255,255,0.65)');
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /** Volumetric 3-stop linear gradient fill */
    function volGrad(ctx, x1, y1, x2, y2, hi, mid, lo) {
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0,   hi);
        g.addColorStop(0.5, mid);
        g.addColorStop(1,   lo);
        return g;
    }

    /* ------------------------------------------------------------------ */
    /*  CharacterRenderer class                                             */
    /* ------------------------------------------------------------------ */
    class CharacterRenderer {

        constructor() {
            this._cache = new Map();
        }

        /**
         * Draw a fighter at (x, y) — anchor = feet centre.
         * opts: { facing:'right'|'left', animState:'idle'|'attack'|'hurt'|'jump'|'block', frame:number, scale:number }
         */
        drawFighter(ctx, fighterId, x, y, opts = {}) {
            const { facing = 'right', animState = 'idle', frame = 0, scale = 1 } = opts;
            const profile = FIGHTER_PROFILES[fighterId] || FIGHTER_PROFILES.ryu;

            ctx.save();
            ctx.translate(x, y);
            if (facing === 'left') ctx.scale(-1, 1);
            ctx.scale(scale, scale);
            this._drawCharacter(ctx, profile.palette, profile.traits, animState, frame);
            ctx.restore();
        }

        /**
         * Draw a bust portrait for the character select screen.
         */
        drawPortrait(ctx, fighterId, cx, cy, size = 80) {
            const profile = FIGHTER_PROFILES[fighterId] || FIGHTER_PROFILES.ryu;
            const s = size / 100;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(s, s);
            this._drawBust(ctx, profile.palette, profile.traits, profile.name);
            ctx.restore();
        }

        /* ---------------------------------------------------------------- */
        /*  Main character draw                                              */
        /* ---------------------------------------------------------------- */

        _drawCharacter(ctx, p, traits, animState, frame) {
            const t = frame / 60;

            // --- Animation state ---
            let bodyBob = 0, bodyLean = 0, hurtTilt = 0, jumpOffsetY = 0;
            let legSpread = 0, armSwing = 0, punchExtend = 0, blockRaise = 0;
            let hurtFlash = false;

            switch (animState) {
                case 'idle':
                    bodyBob  = Math.sin(t * Math.PI * 2) * 2;
                    bodyLean = Math.sin(t * Math.PI * 2) * 0.8;
                    armSwing = Math.sin(t * Math.PI * 2) * 3;
                    break;
                case 'attack':
                    punchExtend = Math.sin(Math.min(t * Math.PI, Math.PI)) * 26;
                    bodyLean    = punchExtend * 0.3;
                    break;
                case 'hurt':
                    hurtTilt  = 14;
                    bodyLean  = -10;
                    hurtFlash = true;
                    break;
                case 'jump':
                    jumpOffsetY = -22;
                    legSpread   = 16;
                    break;
                case 'block':
                    blockRaise = 1;
                    armSwing   = -10;
                    bodyLean   = -5;
                    break;
            }

            const bodyY = bodyBob + jumpOffsetY;

            // Ground shadow
            softShadow(ctx, bodyLean * 0.5, 1, 24, 7);

            ctx.save();
            ctx.translate(bodyLean, bodyY);
            ctx.rotate(hurtTilt * Math.PI / 180);

            // --- Draw order: back-leg → torso → back-arm → head → front-arm → front-leg ---
            this._drawLeg(ctx, p, traits,  9, legSpread,  false); // back leg
            this._drawTorso(ctx, p, traits, animState);
            this._drawArm(ctx, p, traits,  1, armSwing - 4, 0, blockRaise, false); // back arm (no punch)
            this._drawHead(ctx, p, traits, animState, frame);
            this._drawArm(ctx, p, traits, -1, -armSwing + punchExtend, punchExtend, blockRaise, true); // front arm + punch
            this._drawLeg(ctx, p, traits, -9, -legSpread, true);  // front leg

            // Hurt flash overlay
            if (hurtFlash) {
                ctx.save();
                ctx.globalAlpha = 0.28;
                ctx.fillStyle = '#fff';
                ctx.fillRect(-25, -140, 50, 145);
                ctx.restore();
            }

            ctx.restore();
        }

        /* ---------------------------------------------------------------- */
        /*  Body parts                                                       */
        /* ---------------------------------------------------------------- */

        _drawLeg(ctx, p, traits, side, spread, isFront) {
            // side: +9 = back leg, -9 = front leg
            // Thigh: y=-65 to y=-35, Calf: y=-35 to y=0
            const muscW  = traits.muscular ? 1.35 : 1;
            const thighW = 7 * muscW;
            const calfW  = 5.5 * muscW;
            const footW  = traits.muscular ? 6 : 5;

            const cx = side + spread * (isFront ? 0 : -1);

            // --- Thigh ---
            const thighTop = -66, thighBot = -36;
            const tg = volGrad(ctx,
                cx - thighW, thighTop,
                cx + thighW, thighBot,
                isFront ? p.gi : p.giShade,
                isFront ? p.giMid : p.giShade,
                p.giShade
            );
            taperedLimb(ctx, cx, thighTop, thighBot, thighW, thighW * 0.85);
            ctx.fillStyle = tg;
            ctx.fill();
            if (isFront) specularDot(ctx, cx - thighW * 0.4, thighTop + 6, thighW * 0.35, 4, p.specular);

            // Knee cap
            ctx.save();
            const kg = ctx.createRadialGradient(cx - 1, thighBot, 0, cx - 1, thighBot, calfW + 2);
            kg.addColorStop(0, isFront ? p.gi : p.giMid);
            kg.addColorStop(1, p.giShade);
            ctx.fillStyle = kg;
            ctx.beginPath();
            ctx.ellipse(cx, thighBot, calfW * 1.1, calfW * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Seam line on thigh
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(cx + thighW * 0.55, thighTop + 4);
            ctx.lineTo(cx + calfW * 0.55, thighBot);
            ctx.stroke();
            ctx.restore();

            // --- Calf ---
            const calfTop = thighBot, calfBot = -2;
            const cg = volGrad(ctx,
                cx - calfW, calfTop,
                cx + calfW, calfBot,
                isFront ? p.giMid : p.giShade,
                p.giShade,
                p.giShade
            );
            taperedLimb(ctx, cx, calfTop, calfBot, calfW, calfW * 0.7);
            ctx.fillStyle = cg;
            ctx.fill();

            // Ambient occlusion at knee
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(cx, thighBot + 2, calfW * 0.9, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // --- Foot / shoe ---
            const footX = cx - footW - 2;
            const footY = -10;
            const fg = volGrad(ctx, footX, footY, footX + footW * 2.2 + 4, footY + 9,
                lightenHex(p.foot, 25), p.foot, p.footShade);
            ctx.save();
            ctx.fillStyle = fg;
            roundRect(ctx, footX, footY, footW * 2.2 + 4, 9, 3.5);
            ctx.fill();
            // Shoe sole stripe
            ctx.fillStyle = p.footShade;
            roundRect(ctx, footX, footY + 7, footW * 2.2 + 4, 2.5, 1);
            ctx.fill();
            // Toe cap highlight
            specularDot(ctx, footX + 3, footY + 3, 3.5, 2, 'rgba(255,255,255,0.35)');
            ctx.restore();
        }

        _drawTorso(ctx, p, traits, animState) {
            const muscular = traits.muscular;
            const bw = muscular ? 18 : 14; // half-width at belt
            const sw = muscular ? 22 : 17; // half-width at shoulder
            const beltY = -70, shoulderY = -110, midY = -88;

            // Torso trapezoid path (bezier sides for organic shape)
            ctx.beginPath();
            ctx.moveTo(-bw, beltY);
            ctx.bezierCurveTo(-bw - 2, beltY - 14, -sw - 2, midY - 8, -sw, shoulderY);
            ctx.lineTo( sw, shoulderY);
            ctx.bezierCurveTo( sw + 2, midY - 8,  bw + 2, beltY - 14,  bw, beltY);
            ctx.closePath();

            const tg = volGrad(ctx, -sw, shoulderY, sw, beltY,
                traits.shirtless ? lightenHex(p.skin, 20) : lightenHex(p.gi, 18),
                traits.shirtless ? p.skinMid : p.giMid,
                traits.shirtless ? p.skinShade : p.giShade
            );
            ctx.fillStyle = tg;
            ctx.fill();

            // Shoulder caps (rounded, integrated into torso)
            for (const side of [-1, 1]) {
                const sg = ctx.createRadialGradient(side * (sw - 3), shoulderY + 3, 0,
                                                    side * (sw - 3), shoulderY + 3, 8);
                sg.addColorStop(0, traits.shirtless ? lightenHex(p.skin, 12) : lightenHex(p.gi, 12));
                sg.addColorStop(1, traits.shirtless ? p.skinShade : p.giShade);
                ctx.fillStyle = sg;
                ctx.beginPath();
                ctx.ellipse(side * sw, shoulderY + 5, 7, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                // Shoulder specular
                specularDot(ctx, side * sw - side * 2, shoulderY + 2, 3, 2.5, p.specular);
            }

            // Chest specular highlight
            specularDot(ctx, -sw * 0.4, shoulderY + 10, sw * 0.45, 9, p.specular);

            // --- Gi / Costume details ---
            if (!traits.shirtless) {
                // Gi centre fold line
                ctx.save();
                ctx.strokeStyle = 'rgba(0,0,0,0.18)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, shoulderY + 2);
                ctx.bezierCurveTo(-1, midY, 1, midY + 10, 0, beltY);
                ctx.stroke();
                ctx.restore();

                // Gi lapel / collar fold
                if (!traits.qipao) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(-sw * 0.15, shoulderY + 8);
                    ctx.quadraticCurveTo(-6, midY - 5, -4, beltY);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo( sw * 0.15, shoulderY + 8);
                    ctx.quadraticCurveTo(6, midY - 5, 4, beltY);
                    ctx.stroke();
                    ctx.restore();
                }

                // Qipao trim
                if (traits.qipao) {
                    ctx.save();
                    ctx.strokeStyle = p.accent;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-sw, shoulderY + 4);
                    ctx.lineTo(-sw + 1, beltY);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(sw, shoulderY + 4);
                    ctx.lineTo(sw - 1, beltY);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Thai wrap stripes
            if (traits.thaiWrap) {
                ctx.save();
                for (const yy of [shoulderY + 8, shoulderY + 18]) {
                    ctx.fillStyle = p.accent;
                    ctx.globalAlpha = 0.75;
                    ctx.fillRect(-sw + 1, yy, (sw - 1) * 2, 4);
                }
                ctx.restore();
            }

            // --- Belt ---
            if (!traits.shirtless) {
                const belg = volGrad(ctx, -bw, beltY - 1, bw, beltY + 10,
                    lightenHex(p.giBelt, 22), p.giBelt, darkenHex(p.giBelt, 20));
                ctx.fillStyle = belg;
                roundRect(ctx, -bw, beltY, bw * 2, 10, 2);
                ctx.fill();
                // Belt highlight
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = '#fff';
                ctx.fillRect(-bw + 1, beltY + 1, bw * 2 - 2, 2);
                ctx.restore();
                // Belt knot
                const kg = volGrad(ctx, -5, beltY, 5, beltY + 10,
                    lightenHex(p.giBelt, 15), p.giBelt, darkenHex(p.giBelt, 30));
                ctx.fillStyle = kg;
                roundRect(ctx, -5, beltY - 1, 10, 12, 3);
                ctx.fill();
            }

            // --- Muscle definition ---
            if (traits.shirtless || muscular) {
                ctx.save();
                ctx.strokeStyle = 'rgba(0,0,0,0.22)';
                ctx.lineWidth = 1.2;
                // Pectoral arcs
                ctx.beginPath();
                ctx.arc(-8, shoulderY + 18, 10, 0.2, Math.PI - 0.2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(8, shoulderY + 18, 10, 0.2, Math.PI - 0.2);
                ctx.stroke();
                // Sternum line
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(0, shoulderY + 8);
                ctx.lineTo(0, shoulderY + 28);
                ctx.stroke();
                // Abs (3 pairs)
                if (traits.shirtless) {
                    for (let row = 0; row < 3; row++) {
                        const ay = shoulderY + 34 + row * 10;
                        for (const ax of [-6, 6]) {
                            ctx.save();
                            const ag = volGrad(ctx, ax - 5, ay, ax + 5, ay + 8,
                                p.skinMid, p.skinShade, darkenHex(p.skinShade, 15));
                            ctx.fillStyle = ag;
                            roundRect(ctx, ax - 5, ay, 9, 8, 2.5);
                            ctx.fill();
                            ctx.restore();
                        }
                    }
                }
                ctx.restore();
            }

            // Ambient occlusion under arms
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#000';
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.ellipse(side * (sw - 1), shoulderY + 10, 5, 3, 0.3 * side, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        _drawArm(ctx, p, traits, side, swing, punchExt, blockRaise, isFront) {
            // side: -1 = front/left arm, +1 = back/right arm
            const muscular = traits.muscular;
            // Arm attaches at inner edge of shoulder, much closer to body centreline
            const armAttachX = muscular ? 17 : 13;
            const shoulderX  = side * armAttachX;
            const shoulderY  = -110;
            const upperW  = muscular ? 7 : 5.5;
            const lowerW  = muscular ? 5.5 : 4.5;
            // Longer arms so fists reach mid-thigh (~y=-52)
            const armLen  = muscular ? 55 : 48;

            // Natural fighting-stance base angle:
            // front arm raised ~25 deg forward, back arm ~10 deg forward
            const stanceAngle = (isFront ? -28 : -12) * Math.PI / 180;

            ctx.save();
            ctx.translate(shoulderX, shoulderY);
            ctx.rotate(stanceAngle);
            ctx.rotate(swing * Math.PI / 180);

            const blockAngle = blockRaise && isFront ? -35 * Math.PI / 180 : 0;
            ctx.rotate(blockAngle);

            // Skin or sleeve color for this arm
            const armColor    = isFront ? p.skin    : p.skinShade;
            const armColorMid = isFront ? p.skinMid : p.skinShade;
            const armColorLo  = p.skinShade;

            // --- Upper arm ---
            const uag = volGrad(ctx, -upperW, 0, upperW, armLen * 0.52,
                armColor, armColorMid, armColorLo);
            taperedLimb(ctx, 0, 0, armLen * 0.52, upperW, upperW * 0.85);
            ctx.fillStyle = uag;
            ctx.fill();
            if (isFront) specularDot(ctx, -upperW * 0.4, 5, upperW * 0.45, 3.5, p.specular);

            // Elbow
            ctx.save();
            const eg = ctx.createRadialGradient(0, armLen * 0.52, 0, 0, armLen * 0.52, lowerW + 1);
            eg.addColorStop(0, armColorMid);
            eg.addColorStop(1, armColorLo);
            ctx.fillStyle = eg;
            ctx.beginPath();
            ctx.ellipse(0, armLen * 0.52, lowerW, lowerW * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // --- Forearm (punch extends this segment) ---
            ctx.save();
            ctx.translate(0, armLen * 0.50);
            if (punchExt > 0) ctx.rotate(-punchExt * 0.012);

            const foreLen = armLen * 0.52 + punchExt * 0.85;
            const lag = volGrad(ctx, -lowerW, 0, lowerW, foreLen,
                armColorMid, armColorLo, darkenHex(p.skinShade, 10));
            taperedLimb(ctx, 0, 0, foreLen, lowerW, lowerW * 0.72);
            ctx.fillStyle = lag;
            ctx.fill();

            // Muay Thai wrist wrap (Sagat)
            if (traits.thaiWrap) {
                ctx.save();
                ctx.fillStyle = '#f0f0e0';
                ctx.globalAlpha = 0.80;
                roundRect(ctx, -lowerW - 1, foreLen - 11, (lowerW + 1) * 2, 8, 2);
                ctx.fill();
                ctx.restore();
            }

            // --- Fist ---
            ctx.translate(0, foreLen - 2);
            const fistW = lowerW * 1.35;
            const fg = ctx.createRadialGradient(-fistW * 0.3, -fistW * 0.3, 0,
                                                 0, 0, fistW * 1.2);
            fg.addColorStop(0, p.skin);
            fg.addColorStop(0.5, p.skinMid);
            fg.addColorStop(1, p.skinShade);
            ctx.fillStyle = fg;
            roundRect(ctx, -fistW, -fistW * 0.5, fistW * 2, fistW * 1.3, 3.5);
            ctx.fill();
            specularDot(ctx, -fistW * 0.3, -fistW * 0.2, fistW * 0.35, fistW * 0.25, p.specular);

            ctx.restore(); // forearm translate
            ctx.restore(); // arm translate
        }

        _drawHead(ctx, p, traits, animState, frame) {
            const t = frame / 60;
            const headW = traits.beast ? 15 : 12;  // half-width of ellipse
            const headH = traits.beast ? 16 : 14;  // half-height
            const headCY = -126;  // centre Y of head ellipse

            ctx.save();
            ctx.translate(0, 0);

            // ---- HAIR BEHIND HEAD ----
            if (traits.wildHair || traits.longHair) {
                const hairSway = animState === 'idle' ? Math.sin(t * Math.PI * 2) * 1.5 : 0;
                const hairG = ctx.createRadialGradient(-2, headCY - 6, 0, 0, headCY - 4, headW * 1.5);
                hairG.addColorStop(0, lightenHex(p.hair, 18));
                hairG.addColorStop(0.5, p.hair);
                hairG.addColorStop(1, darkenHex(p.hair, 20));
                ctx.fillStyle = hairG;

                // Main hair mass
                ctx.beginPath();
                ctx.ellipse(0, headCY - 4, headW * 1.1, headH * 0.9, 0, 0, Math.PI * 2);
                ctx.fill();

                if (traits.wildHair) {
                    // Spiky tufts using bezier curves
                    for (let i = 0; i < 7; i++) {
                        const ang = -Math.PI + i * (Math.PI * 0.28) + hairSway * 0.04;
                        const r1 = headW * 1.05, r2 = headW * 1.65, r3 = headW * 1.1;
                        ctx.beginPath();
                        ctx.moveTo(Math.cos(ang - 0.12) * r1, headCY - 4 + Math.sin(ang - 0.12) * r1);
                        ctx.quadraticCurveTo(
                            Math.cos(ang) * r2 + hairSway * 0.3, headCY - 4 + Math.sin(ang) * r2,
                            Math.cos(ang + 0.12) * r1, headCY - 4 + Math.sin(ang + 0.12) * r1
                        );
                        ctx.closePath();
                        ctx.fillStyle = lightenHex(p.hair, 8);
                        ctx.fill();
                    }
                }

                if (traits.longHair) {
                    // Flowing side panels
                    for (const side of [-1, 1]) {
                        ctx.save();
                        const flowG = volGrad(ctx,
                            side * headW, headCY - 8,
                            side * headW, headCY + 24,
                            p.hair, lightenHex(p.hair, 10), darkenHex(p.hair, 25)
                        );
                        ctx.fillStyle = flowG;
                        ctx.beginPath();
                        ctx.moveTo(side * headW * 0.9, headCY - 8);
                        ctx.bezierCurveTo(
                            side * (headW + 5), headCY + 2,
                            side * (headW + 4), headCY + 14,
                            side * (headW - 2), headCY + 24
                        );
                        ctx.lineTo(side * (headW - 7), headCY + 24);
                        ctx.bezierCurveTo(
                            side * (headW - 6), headCY + 12,
                            side * (headW - 5), headCY + 2,
                            side * (headW * 0.2), headCY - 6
                        );
                        ctx.closePath();
                        ctx.fill();
                        // Hair strand lines
                        ctx.strokeStyle = darkenHex(p.hair, 20);
                        ctx.lineWidth = 0.6;
                        for (let si = 0; si < 3; si++) {
                            ctx.beginPath();
                            ctx.moveTo(side * (headW * 0.5 + si * 2), headCY - 4);
                            ctx.bezierCurveTo(
                                side * (headW + si * 1.5), headCY + 8,
                                side * (headW + si * 1.2), headCY + 18,
                                side * (headW - 3 + si), headCY + 24
                            );
                            ctx.stroke();
                        }
                        ctx.restore();
                    }
                }
            }

            if (traits.mohawk) {
                const mhG = volGrad(ctx, -4, headCY - 22, 4, headCY - 8,
                    lightenHex(p.hair, 20), p.hair, darkenHex(p.hair, 15));
                ctx.fillStyle = mhG;
                ctx.beginPath();
                ctx.moveTo(-5, headCY - 8);
                ctx.bezierCurveTo(-6, headCY - 14, -3, headCY - 22, 0, headCY - 26);
                ctx.bezierCurveTo(3, headCY - 22, 6, headCY - 14, 5, headCY - 8);
                ctx.closePath();
                ctx.fill();
                // Highlight on mohawk
                specularDot(ctx, -1, headCY - 18, 2, 4, 'rgba(255,255,255,0.4)');
            }

            if (traits.flattop) {
                const ftG = volGrad(ctx, -headW, headCY - headH * 1.1, headW, headCY - headH * 0.65,
                    lightenHex(p.hair, 12), p.hair, darkenHex(p.hair, 10));
                ctx.fillStyle = ftG;
                ctx.fillRect(-headW * 1.05, headCY - headH * 1.1, headW * 2.1, headH * 0.55);
                // Flat top edge highlight
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#fff';
                ctx.fillRect(-headW * 1.05, headCY - headH * 1.1, headW * 2.1, 2);
                ctx.restore();
                // Side hair
                ctx.fillStyle = darkenHex(p.hair, 10);
                ctx.fillRect(-headW * 1.05, headCY - headH, headW * 0.25, headH * 0.6);
                ctx.fillRect( headW * 0.8,  headCY - headH, headW * 0.25, headH * 0.6);
            }

            if (traits.hairBuns) {
                for (const side of [-1, 1]) {
                    const bx = side * (headW * 1.15);
                    const bunG = ctx.createRadialGradient(bx - side * 2, headCY - 9, 0,
                                                          bx, headCY - 7, 9);
                    bunG.addColorStop(0, lightenHex(p.hair, 20));
                    bunG.addColorStop(0.6, p.hair);
                    bunG.addColorStop(1, darkenHex(p.hair, 15));
                    ctx.fillStyle = bunG;
                    ctx.beginPath();
                    ctx.ellipse(bx, headCY - 7, 8.5, 8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Spiral detail
                    ctx.save();
                    ctx.strokeStyle = darkenHex(p.hair, 20);
                    ctx.lineWidth = 0.7;
                    ctx.beginPath();
                    ctx.arc(bx, headCY - 7, 4.5, 0, Math.PI * 1.5);
                    ctx.stroke();
                    ctx.restore();
                    specularDot(ctx, bx - side * 2, headCY - 11, 2.5, 2, 'rgba(255,255,255,0.4)');
                }
            }

            // ---- HEAD BASE ----
            const hg = ctx.createRadialGradient(-headW * 0.4, headCY - headH * 0.3, 1,
                                                  headW * 0.1, headCY, headW * 1.4);
            hg.addColorStop(0,    lightenHex(p.skin, 12));
            hg.addColorStop(0.45, p.skin);
            hg.addColorStop(0.8,  p.skinMid);
            hg.addColorStop(1,    p.skinShade);
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.ellipse(0, headCY, headW, headH, 0, 0, Math.PI * 2);
            ctx.fill();

            // Subtle head outline
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.ellipse(0, headCY, headW, headH, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Head specular
            specularDot(ctx, -headW * 0.35, headCY - headH * 0.55, headW * 0.38, headH * 0.28, p.specular);

            // Bald highlight (Dhalsim, Sagat)
            if (traits.bald) {
                specularDot(ctx, -headW * 0.3, headCY - headH * 0.65, headW * 0.55, headH * 0.35,
                    'rgba(255,255,255,0.28)');
            }

            // Jaw / chin shadow
            ctx.save();
            ctx.globalAlpha = 0.14;
            ctx.fillStyle = p.skinShade;
            ctx.beginPath();
            ctx.ellipse(0, headCY + headH * 0.55, headW * 0.75, headH * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Neck
            const neckG = volGrad(ctx, -4, headCY + headH - 2, 4, headCY + headH + 10,
                p.skinMid, p.skin, p.skinShade);
            ctx.fillStyle = neckG;
            roundRect(ctx, -4, headCY + headH - 2, 8, 10, 2);
            ctx.fill();

            // ---- FACIAL FEATURES ----

            // Headband
            if (traits.headband) {
                const hbY = headCY - headH * 0.5;
                const hbG = volGrad(ctx, -headW, hbY, headW, hbY + 6,
                    lightenHex(p.headband, 20), p.headband, darkenHex(p.headband, 15));
                ctx.fillStyle = hbG;
                roundRect(ctx, -headW, hbY, headW * 2, 6, 2);
                ctx.fill();
                // Highlight on band
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#fff';
                ctx.fillRect(-headW + 1, hbY + 1, headW * 2 - 2, 1.5);
                ctx.restore();
                // Knot tails
                ctx.fillStyle = darkenHex(p.headband, 10);
                ctx.beginPath();
                ctx.moveTo(headW - 1, hbY);
                ctx.quadraticCurveTo(headW + 7, hbY - 3, headW + 9, hbY + 3);
                ctx.quadraticCurveTo(headW + 6, hbY + 7, headW - 1, hbY + 6);
                ctx.closePath();
                ctx.fill();
            }

            // ---- EYES ----
            const eyeY = headCY - headH * 0.28;
            const eyeOpenH = animState === 'hurt' ? 2.5 : 4.5;
            const eyePositions = [
                { cx: -headW * 0.38, label: 'left' },
                { cx:  headW * 0.12, label: 'right' }
            ];

            for (const ep of eyePositions) {
                // Sclera (white)
                ctx.save();
                ctx.fillStyle = '#f5f5f8';
                ctx.beginPath();
                ctx.ellipse(ep.cx + 2.5, eyeY, 4.5, eyeOpenH * 0.55, 0, 0, Math.PI * 2);
                ctx.fill();

                // Iris
                const irisg = ctx.createRadialGradient(ep.cx + 2.2, eyeY - 0.5, 0,
                                                        ep.cx + 2.5, eyeY, 3);
                irisg.addColorStop(0, lightenHex(p.eyes, 20));
                irisg.addColorStop(0.7, p.eyes);
                irisg.addColorStop(1, darkenHex(p.eyes, 15));
                ctx.fillStyle = irisg;
                ctx.beginPath();
                ctx.ellipse(ep.cx + 2.5, eyeY, 2.5, Math.min(eyeOpenH * 0.5, 2.5), 0, 0, Math.PI * 2);
                ctx.fill();

                // Pupil
                ctx.fillStyle = '#0a0a0a';
                ctx.beginPath();
                ctx.ellipse(ep.cx + 2.5, eyeY, 1.2, Math.min(eyeOpenH * 0.35, 1.4), 0, 0, Math.PI * 2);
                ctx.fill();

                // Eye highlight dot
                ctx.fillStyle = 'rgba(255,255,255,0.82)';
                ctx.beginPath();
                ctx.ellipse(ep.cx + 1.2, eyeY - 1, 0.9, 0.7, 0, 0, Math.PI * 2);
                ctx.fill();

                // Eyelid line (top)
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo(ep.cx - 0.5, eyeY - eyeOpenH * 0.5);
                ctx.quadraticCurveTo(ep.cx + 2.5, eyeY - eyeOpenH * 0.65, ep.cx + 5.5, eyeY - eyeOpenH * 0.45);
                ctx.stroke();
                ctx.restore();
            }

            // Eyebrows (arched)
            const browColor = p.hair && p.hair !== '#c09040' ? p.hair : '#2a1a0a';
            const browY = headCY - headH * 0.48;
            ctx.save();
            ctx.strokeStyle = browColor;
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            // Left brow
            ctx.beginPath();
            ctx.moveTo(-headW * 0.55, browY + 1.5);
            ctx.quadraticCurveTo(-headW * 0.28, browY - 2.5, -headW * 0.08, browY + 0.5);
            ctx.stroke();
            // Right brow
            ctx.beginPath();
            ctx.moveTo( headW * 0.02, browY + 0.5);
            ctx.quadraticCurveTo( headW * 0.24, browY - 2.5,  headW * 0.52, browY + 1.5);
            ctx.stroke();
            ctx.restore();

            // Eyepatch (Sagat)
            if (traits.eyepatch) {
                const epX = -headW * 0.55, epY = eyeY - 4.5;
                ctx.save();
                // Patch body
                const pg = volGrad(ctx, epX, epY, epX + 13, epY + 9,
                    '#3a2a2a', '#1a1a1a', '#0a0a0a');
                ctx.fillStyle = pg;
                roundRect(ctx, epX, epY, 13, 9, 3);
                ctx.fill();
                // Strap
                ctx.strokeStyle = '#2a2020';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(epX - 1, epY + 4);
                ctx.lineTo(-headW - 2, eyeY + 2);
                ctx.stroke();
                ctx.restore();
            }

            // Scar (Sagat)
            if (traits.scar) {
                ctx.save();
                // Scar base
                ctx.strokeStyle = '#7a3030';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-2, headCY - headH * 0.7);
                ctx.bezierCurveTo(2, headCY - headH * 0.45, -1, headCY, 3, headCY + headH * 0.3);
                ctx.stroke();
                // Scar highlight
                ctx.strokeStyle = '#c06060';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(-2.5, headCY - headH * 0.7);
                ctx.bezierCurveTo(1.5, headCY - headH * 0.45, -1.5, headCY, 2.5, headCY + headH * 0.3);
                ctx.stroke();
                ctx.restore();
            }

            // Nose
            ctx.save();
            const noseY = headCY + headH * 0.1;
            ctx.strokeStyle = p.skinShade;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(1, noseY - 5);
            ctx.bezierCurveTo(2, noseY - 2, 3, noseY, 1, noseY + 1);
            ctx.stroke();
            // Nostril dot
            ctx.fillStyle = darkenHex(p.skinShade, 10);
            ctx.beginPath();
            ctx.ellipse(1, noseY + 2, 1.2, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Mouth / Lips
            ctx.save();
            const mouthY = headCY + headH * 0.45;
            if (animState === 'attack') {
                // Open battle cry
                ctx.fillStyle = '#2a0808';
                ctx.beginPath();
                ctx.ellipse(0, mouthY, 4.5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = darkenHex(p.skinShade, 20);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, mouthY, 4.5, 0, Math.PI);
                ctx.stroke();
            } else {
                // Closed mouth — upper and lower lip
                ctx.strokeStyle = darkenHex(p.skinShade, 15);
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.moveTo(-4.5, mouthY);
                ctx.quadraticCurveTo(0, mouthY - 1.5, 4.5, mouthY);
                ctx.stroke();
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo(-4, mouthY);
                ctx.quadraticCurveTo(0, mouthY + 2, 4, mouthY);
                ctx.stroke();
            }
            ctx.restore();

            // Fangs (Blanka)
            if (traits.fangs) {
                ctx.save();
                ctx.fillStyle = '#f8f6ee';
                for (const fx of [-3.5, 1.5]) {
                    ctx.beginPath();
                    ctx.moveTo(fx, headCY + headH * 0.4);
                    ctx.lineTo(fx + 2.5, headCY + headH * 0.4);
                    ctx.lineTo(fx + 1.25, headCY + headH * 0.58);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#cccccc';
                    ctx.lineWidth = 0.4;
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Beard (Zangief) — multi-stroke layered look
            if (traits.beard) {
                ctx.save();
                // Beard base
                const beardG = ctx.createRadialGradient(0, headCY + headH * 0.2, 0,
                                                         0, headCY + headH * 0.3, headW * 0.9);
                beardG.addColorStop(0, p.hair);
                beardG.addColorStop(0.6, darkenHex(p.hair, 10));
                beardG.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = beardG;
                ctx.beginPath();
                ctx.ellipse(0, headCY + headH * 0.28, headW * 0.82, headH * 0.55, 0, 0, Math.PI * 2);
                ctx.fill();
                // Individual hair strokes
                ctx.strokeStyle = darkenHex(p.hair, 20);
                ctx.lineWidth = 0.6;
                for (let bi = -5; bi <= 5; bi++) {
                    ctx.beginPath();
                    ctx.moveTo(bi * 1.5, headCY + headH * 0.15);
                    ctx.quadraticCurveTo(bi * 1.8, headCY + headH * 0.38,
                                         bi * 1.2, headCY + headH * 0.55);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Skull beads (Dhalsim)
            if (traits.skulls) {
                ctx.save();
                const skullY = headCY + headH + 4;
                for (let i = -2; i <= 2; i++) {
                    const sx = i * 5.5;
                    // Skull body
                    const skG = ctx.createRadialGradient(sx - 1, skullY - 1, 0, sx, skullY, 3);
                    skG.addColorStop(0, '#fffff2');
                    skG.addColorStop(1, '#c8c8a8');
                    ctx.fillStyle = skG;
                    ctx.beginPath();
                    ctx.ellipse(sx, skullY, 2.8, 2.8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Skull eye sockets
                    ctx.fillStyle = '#3a3020';
                    ctx.beginPath(); ctx.ellipse(sx - 1.1, skullY + 0.2, 0.8, 0.7, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.ellipse(sx + 1.1, skullY + 0.2, 0.8, 0.7, 0, 0, Math.PI * 2); ctx.fill();
                    // Bead string
                    if (i < 2) {
                        ctx.strokeStyle = '#a09070';
                        ctx.lineWidth = 0.7;
                        ctx.beginPath();
                        ctx.moveTo(sx + 2.8, skullY);
                        ctx.lineTo(sx + 2.7, skullY);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }

            ctx.restore(); // head translate
        }

        /* ---------------------------------------------------------------- */
        /*  Portrait (bust) for character select screen                      */
        /* ---------------------------------------------------------------- */

        _drawBust(ctx, p, traits, name) {
            const muscular = traits.muscular;
            const torsoW = muscular ? 32 : 26;

            // Torso / shoulders
            ctx.beginPath();
            ctx.moveTo(-torsoW * 0.7, 55);
            ctx.bezierCurveTo(-torsoW * 0.7, 30, -torsoW - 2, 20, -(torsoW + 2), 8);
            ctx.lineTo(torsoW + 2, 8);
            ctx.bezierCurveTo(torsoW + 2, 20, torsoW * 0.7, 30, torsoW * 0.7, 55);
            ctx.closePath();
            const tg = volGrad(ctx, -(torsoW + 2), 8, torsoW + 2, 55,
                traits.shirtless ? lightenHex(p.skin, 18) : lightenHex(p.gi, 18),
                traits.shirtless ? p.skinMid : p.giMid,
                traits.shirtless ? p.skinShade : p.giShade
            );
            ctx.fillStyle = tg;
            ctx.fill();

            // Shoulder caps
            for (const side of [-1, 1]) {
                const sg = ctx.createRadialGradient(side * (torsoW + 1), 12, 0, side * (torsoW + 1), 14, 13);
                sg.addColorStop(0, traits.shirtless ? p.skinMid : p.giMid);
                sg.addColorStop(1, traits.shirtless ? p.skinShade : p.giShade);
                ctx.fillStyle = sg;
                ctx.beginPath();
                ctx.ellipse(side * (torsoW + 1), 14, 13, 11, 0, 0, Math.PI * 2);
                ctx.fill();
                specularDot(ctx, side * (torsoW + 1) - side * 4, 8, 5, 4, p.specular);
            }

            // Chest specular
            specularDot(ctx, -(torsoW * 0.35), 12, torsoW * 0.4, 9, p.specular);

            if (!traits.shirtless) {
                ctx.save();
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, 10); ctx.lineTo(0, 50);
                ctx.stroke();
                ctx.restore();
            }

            if (traits.thaiWrap) {
                ctx.save();
                ctx.fillStyle = p.accent;
                ctx.globalAlpha = 0.75;
                ctx.fillRect(-(torsoW + 1), 10, (torsoW + 1) * 2, 5);
                ctx.restore();
            }

            // Belt
            if (!traits.shirtless) {
                const belg = volGrad(ctx, -torsoW, 42, torsoW, 52,
                    lightenHex(p.giBelt, 22), p.giBelt, darkenHex(p.giBelt, 20));
                ctx.fillStyle = belg;
                roundRect(ctx, -torsoW * 0.7, 44, torsoW * 1.4, 9, 2.5);
                ctx.fill();
                ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff';
                ctx.fillRect(-torsoW * 0.7 + 1, 45, torsoW * 1.4 - 2, 2);
                ctx.restore();
            }

            // Muscle lines
            if (traits.shirtless || muscular) {
                ctx.save();
                ctx.strokeStyle = 'rgba(0,0,0,0.22)';
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.arc(-10, 22, 11, 0.2, Math.PI - 0.2); ctx.stroke();
                ctx.beginPath(); ctx.arc( 10, 22, 11, 0.2, Math.PI - 0.2); ctx.stroke();
                ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, 34); ctx.stroke();
                ctx.restore();
            }

            // ---- HEAD ----
            const headW = traits.beast ? 22 : 17;
            const headH = traits.beast ? 20 : 19;
            const headCY = -18;

            // Hair behind head
            if (traits.hairBuns) {
                for (const side of [-1, 1]) {
                    const bx = side * (headW * 1.15);
                    const bg = ctx.createRadialGradient(bx - side * 2, headCY - 5, 0, bx, headCY - 4, 12);
                    bg.addColorStop(0, lightenHex(p.hair, 20));
                    bg.addColorStop(1, darkenHex(p.hair, 15));
                    ctx.fillStyle = bg;
                    ctx.beginPath(); ctx.ellipse(bx, headCY - 4, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.save(); ctx.strokeStyle = darkenHex(p.hair, 20); ctx.lineWidth = 0.8;
                    ctx.beginPath(); ctx.arc(bx, headCY - 4, 6, 0, Math.PI * 1.5); ctx.stroke();
                    ctx.restore();
                    specularDot(ctx, bx - side * 3, headCY - 9, 3, 2.5, 'rgba(255,255,255,0.4)');
                }
            }
            if (traits.wildHair || traits.longHair || traits.mohawk || traits.flattop) {
                const hg2 = ctx.createRadialGradient(-3, headCY - 10, 0, 0, headCY - 6, headW * 1.3);
                hg2.addColorStop(0, lightenHex(p.hair, 18));
                hg2.addColorStop(0.5, p.hair);
                hg2.addColorStop(1, darkenHex(p.hair, 20));
                ctx.fillStyle = hg2;
                ctx.beginPath();
                ctx.ellipse(0, headCY - 6, headW * 1.05, headH * 0.85, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            if (traits.mohawk) {
                const mg = volGrad(ctx, -5, headCY - 32, 5, headCY - 12,
                    lightenHex(p.hair, 20), p.hair, darkenHex(p.hair, 15));
                ctx.fillStyle = mg;
                ctx.beginPath();
                ctx.moveTo(-6, headCY - 12);
                ctx.bezierCurveTo(-7, headCY - 20, -4, headCY - 30, 0, headCY - 34);
                ctx.bezierCurveTo(4, headCY - 30, 7, headCY - 20, 6, headCY - 12);
                ctx.closePath();
                ctx.fill();
            }
            if (traits.flattop) {
                const ftg = volGrad(ctx, -headW, headCY - headH * 1.1, headW, headCY - headH * 0.6,
                    lightenHex(p.hair, 12), p.hair, darkenHex(p.hair, 10));
                ctx.fillStyle = ftg;
                ctx.fillRect(-headW * 1.1, headCY - headH * 1.15, headW * 2.2, headH * 0.65);
            }

            // Head base
            const hg = ctx.createRadialGradient(-headW * 0.4, headCY - headH * 0.35, 1,
                                                  headW * 0.1, headCY, headW * 1.5);
            hg.addColorStop(0,   lightenHex(p.skin, 12));
            hg.addColorStop(0.4, p.skin);
            hg.addColorStop(0.8, p.skinMid);
            hg.addColorStop(1,   p.skinShade);
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.ellipse(0, headCY, headW, headH, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.ellipse(0, headCY, headW, headH, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            specularDot(ctx, -headW * 0.35, headCY - headH * 0.55, headW * 0.38, headH * 0.28, p.specular);
            if (traits.bald) specularDot(ctx, -headW * 0.3, headCY - headH * 0.65, headW * 0.55, headH * 0.35, 'rgba(255,255,255,0.25)');

            // Headband
            if (traits.headband) {
                const hbY = headCY - headH * 0.38;
                const hbG = volGrad(ctx, -headW, hbY, headW, hbY + 7,
                    lightenHex(p.headband, 20), p.headband, darkenHex(p.headband, 15));
                ctx.fillStyle = hbG;
                roundRect(ctx, -headW, hbY, headW * 2, 7, 2);
                ctx.fill();
                ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#fff';
                ctx.fillRect(-headW + 1, hbY + 1, headW * 2 - 2, 2);
                ctx.restore();
            }

            // Eyes
            const eyeY = headCY - headH * 0.2;
            for (const ep of [{ cx: -headW * 0.42 + 3, label: 'l' }, { cx: headW * 0.1 + 3, label: 'r' }]) {
                ctx.fillStyle = '#f5f5f8';
                ctx.beginPath(); ctx.ellipse(ep.cx, eyeY, 5.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
                const ig = ctx.createRadialGradient(ep.cx - 0.5, eyeY - 0.5, 0, ep.cx, eyeY, 3.2);
                ig.addColorStop(0, lightenHex(p.eyes, 25)); ig.addColorStop(1, darkenHex(p.eyes, 10));
                ctx.fillStyle = ig;
                ctx.beginPath(); ctx.ellipse(ep.cx, eyeY, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#080808';
                ctx.beginPath(); ctx.ellipse(ep.cx, eyeY, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.beginPath(); ctx.ellipse(ep.cx - 1, eyeY - 1, 1.1, 0.9, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(ep.cx - 5, eyeY - 3.2);
                ctx.quadraticCurveTo(ep.cx, eyeY - 4.5, ep.cx + 5, eyeY - 3);
                ctx.stroke();
            }

            // Eyebrows
            const browColor = p.hair && p.hair !== '#c09040' ? p.hair : '#2a1a0a';
            const browY = headCY - headH * 0.52;
            ctx.save(); ctx.strokeStyle = browColor; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-headW * 0.6, browY + 2); ctx.quadraticCurveTo(-headW * 0.3, browY - 3, -headW * 0.05, browY + 1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo( headW * 0.05, browY + 1); ctx.quadraticCurveTo( headW * 0.3, browY - 3,  headW * 0.6, browY + 2); ctx.stroke();
            ctx.restore();

            // Eyepatch
            if (traits.eyepatch) {
                const epX = -headW * 0.6, epY = eyeY - 5;
                const pg = volGrad(ctx, epX, epY, epX + 15, epY + 10, '#3a2a2a', '#1a1a1a', '#0a0a0a');
                ctx.fillStyle = pg; roundRect(ctx, epX, epY, 15, 10, 3); ctx.fill();
                ctx.strokeStyle = '#2a2020'; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(epX - 1, epY + 5); ctx.lineTo(-headW - 3, eyeY + 2); ctx.stroke();
            }

            // Scar
            if (traits.scar) {
                ctx.save(); ctx.strokeStyle = '#7a3030'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(-3, headCY - headH * 0.7); ctx.bezierCurveTo(2, headCY - headH * 0.35, -2, headCY + 2, 4, headCY + headH * 0.45); ctx.stroke();
                ctx.strokeStyle = '#c06060'; ctx.lineWidth = 0.9;
                ctx.beginPath(); ctx.moveTo(-3.5, headCY - headH * 0.7); ctx.bezierCurveTo(1.5, headCY - headH * 0.35, -2.5, headCY + 2, 3.5, headCY + headH * 0.45); ctx.stroke();
                ctx.restore();
            }

            // Nose
            const noseY = headCY + headH * 0.18;
            ctx.save(); ctx.strokeStyle = p.skinShade; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(1, noseY - 6); ctx.bezierCurveTo(2.5, noseY - 2, 3.5, noseY + 1, 1, noseY + 2); ctx.stroke();
            ctx.fillStyle = darkenHex(p.skinShade, 10); ctx.beginPath(); ctx.ellipse(1.2, noseY + 3, 1.4, 1, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Mouth
            const mouthY = headCY + headH * 0.57;
            ctx.save(); ctx.strokeStyle = darkenHex(p.skinShade, 15); ctx.lineWidth = 1.5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-5.5, mouthY); ctx.quadraticCurveTo(0, mouthY - 2, 5.5, mouthY); ctx.stroke();
            ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.moveTo(-5, mouthY); ctx.quadraticCurveTo(0, mouthY + 2.5, 5, mouthY); ctx.stroke();
            ctx.restore();

            // Beard
            if (traits.beard) {
                ctx.save();
                const bG = ctx.createRadialGradient(0, headCY + headH * 0.25, 0, 0, headCY + headH * 0.4, headW * 0.95);
                bG.addColorStop(0, p.hair); bG.addColorStop(0.6, darkenHex(p.hair, 10)); bG.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = bG;
                ctx.beginPath(); ctx.ellipse(0, headCY + headH * 0.35, headW * 0.78, headH * 0.52, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = darkenHex(p.hair, 18); ctx.lineWidth = 0.6;
                for (let bi = -5; bi <= 5; bi++) {
                    ctx.beginPath(); ctx.moveTo(bi * 1.8, headCY + headH * 0.15); ctx.quadraticCurveTo(bi * 2, headCY + headH * 0.4, bi * 1.4, headCY + headH * 0.6); ctx.stroke();
                }
                ctx.restore();
            }

            // Fangs
            if (traits.fangs) {
                ctx.save(); ctx.fillStyle = '#f8f6ee';
                for (const fx of [-5, 1]) {
                    ctx.beginPath(); ctx.moveTo(fx, mouthY - 1); ctx.lineTo(fx + 3, mouthY - 1); ctx.lineTo(fx + 1.5, mouthY + 5); ctx.closePath(); ctx.fill();
                }
                ctx.restore();
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Hex colour helpers                                                  */
    /* ------------------------------------------------------------------ */

    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        return {
            r: parseInt(h.substring(0, 2), 16),
            g: parseInt(h.substring(2, 4), 16),
            b: parseInt(h.substring(4, 6), 16)
        };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v)))
            .toString(16).padStart(2, '0')).join('');
    }

    function lightenHex(hex, amount) {
        if (!hex || !hex.startsWith('#') || hex.length < 7) return hex || '#888888';
        const { r, g, b } = hexToRgb(hex);
        return rgbToHex(r + amount, g + amount, b + amount);
    }

    function darkenHex(hex, amount) {
        if (!hex || !hex.startsWith('#') || hex.length < 7) return hex || '#222222';
        const { r, g, b } = hexToRgb(hex);
        return rgbToHex(r - amount, g - amount, b - amount);
    }

    /* ------------------------------------------------------------------ */

    CharacterRenderer.FIGHTER_PROFILES = FIGHTER_PROFILES;
    window.CharacterRenderer = CharacterRenderer;

})();
