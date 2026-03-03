/**
 * CharacterRenderer — Professional Canvas-Based Fighter Character System
 * Draws detailed, animated fighter sprites for 9DTTT Tournament Fighters
 * Each fighter has a unique color palette, costume, and signature visual traits.
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
                gi: '#f0f0e8', giShade: '#c8c8b0', giBelt: '#f0c040',
                skin: '#e8c090', skinShade: '#c09060',
                hair: '#1a1a1a', headband: '#e03030', eyes: '#2a2a2a',
                foot: '#8b7355', accent: '#e03030'
            },
            traits: { headband: true, gi: true, muscular: false }
        },
        chun: {
            name: 'CHUN-LI',
            palette: {
                gi: '#4060d0', giShade: '#2a40a0', giBelt: '#f0d060',
                skin: '#e8c090', skinShade: '#c09060',
                hair: '#1a1a1a', headband: null, eyes: '#3a3a60',
                foot: '#4060d0', accent: '#f0d060'
            },
            traits: { hairBuns: true, gi: false, qipao: true, muscular: false }
        },
        zangief: {
            name: 'ZANGIEF',
            palette: {
                gi: '#cc2020', giShade: '#881010', giBelt: '#f0d000',
                skin: '#d09060', skinShade: '#a07040',
                hair: '#a83020', headband: null, eyes: '#5a3020',
                foot: '#cc2020', accent: '#f0d000'
            },
            traits: { mohawk: true, beard: true, gi: false, trunks: true, muscular: true }
        },
        guile: {
            name: 'GUILE',
            palette: {
                gi: '#4a7040', giShade: '#2a4828', giBelt: '#8a7040',
                skin: '#e0b080', skinShade: '#b88050',
                hair: '#d4c060', headband: null, eyes: '#4a6040',
                foot: '#4a5030', accent: '#c8d040'
            },
            traits: { flattop: true, military: true, muscular: true }
        },
        blanka: {
            name: 'BLANKA',
            palette: {
                gi: '#206028', giShade: '#104018', giBelt: '#d04010',
                skin: '#208030', skinShade: '#104020',
                hair: '#d04010', headband: null, eyes: '#f08020',
                foot: '#206028', accent: '#f08020'
            },
            traits: { wildHair: true, fangs: true, muscular: true, beast: true }
        },
        dhalsim: {
            name: 'DHALSIM',
            palette: {
                gi: '#e0a020', giShade: '#b07010', giBelt: '#c03010',
                skin: '#c08040', skinShade: '#906028',
                hair: '#c09040', headband: null, eyes: '#c03010',
                foot: '#c08040', accent: '#c03010'
            },
            traits: { bald: true, yogaWrap: true, muscular: false, skulls: true }
        },
        ken: {
            name: 'KEN',
            palette: {
                gi: '#e03020', giShade: '#a02010', giBelt: '#f0c040',
                skin: '#e8c080', skinShade: '#c09050',
                hair: '#e0a020', headband: null, eyes: '#2a4080',
                foot: '#8b7355', accent: '#f0c040'
            },
            traits: { longHair: true, gi: true, muscular: false }
        },
        sagat: {
            name: 'SAGAT',
            palette: {
                gi: '#e8b840', giShade: '#b08020', giBelt: '#c06020',
                skin: '#c08040', skinShade: '#906028',
                hair: '#1a1a1a', headband: null, eyes: '#1a1a1a',
                foot: '#e8b840', accent: '#c06020'
            },
            traits: { eyepatch: true, shirtless: true, thaiWrap: true, muscular: true, bald: true, scar: true }
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                             */
    /* ------------------------------------------------------------------ */
    function lerp(a, b, t) { return a + (b - a) * t; }

    function drawRoundRect(ctx, x, y, w, h, r) {
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

    /* ------------------------------------------------------------------ */
    /*  CharacterRenderer class                                             */
    /* ------------------------------------------------------------------ */
    class CharacterRenderer {

        constructor() {
            this._cache = new Map();
        }

        /**
         * Draw a fighter at (x, y) — anchor = feet centre.
         * @param {CanvasRenderingContext2D} ctx
         * @param {string} fighterId  e.g. 'ryu'
         * @param {number} x  feet-centre X
         * @param {number} y  feet Y
         * @param {Object} opts  { facing:'right'|'left', animState:'idle'|'attack'|'hurt'|'jump'|'block', frame:number, scale:number }
         */
        drawFighter(ctx, fighterId, x, y, opts = {}) {
            const {
                facing = 'right',
                animState = 'idle',
                frame = 0,
                scale = 1
            } = opts;

            const profile = FIGHTER_PROFILES[fighterId] || FIGHTER_PROFILES.ryu;
            const p = profile.palette;
            const traits = profile.traits;

            ctx.save();
            ctx.translate(x, y);
            if (facing === 'left') ctx.scale(-1, 1);
            ctx.scale(scale, scale);

            this._drawCharacter(ctx, p, traits, animState, frame);
            ctx.restore();
        }

        /**
         * Draw a bust portrait for the character select screen.
         * @param {CanvasRenderingContext2D} ctx
         * @param {string} fighterId
         * @param {number} cx  centre X
         * @param {number} cy  centre Y
         * @param {number} size  portrait diameter / height
         */
        drawPortrait(ctx, fighterId, cx, cy, size = 80) {
            const profile = FIGHTER_PROFILES[fighterId] || FIGHTER_PROFILES.ryu;
            const p = profile.palette;
            const traits = profile.traits;
            const s = size / 100; // scale factor

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(s, s);
            this._drawBust(ctx, p, traits);
            ctx.restore();
        }

        /* ---------------------------------------------------------------- */
        /*  Internal draw helpers                                            */
        /* ---------------------------------------------------------------- */

        _drawCharacter(ctx, p, traits, animState, frame) {
            // Animation offsets
            const t = frame / 60;
            let bodyBob = 0, attackOffset = 0, hurtTilt = 0, jumpOffsetY = 0;
            let legSpread = 0, armSwing = 0, punchExtend = 0;

            switch (animState) {
                case 'idle':
                    bodyBob = Math.sin(t * Math.PI * 2) * 1.5;
                    armSwing = Math.sin(t * Math.PI * 2) * 2;
                    break;
                case 'attack':
                    punchExtend = Math.sin(Math.min(t * Math.PI, Math.PI)) * 22;
                    attackOffset = punchExtend * 0.15;
                    break;
                case 'hurt':
                    hurtTilt = 12;
                    attackOffset = -8;
                    break;
                case 'jump':
                    jumpOffsetY = -20;
                    legSpread = 14;
                    break;
                case 'block':
                    armSwing = -8;
                    attackOffset = -4;
                    break;
            }

            const bodyY = bodyBob + jumpOffsetY;
            const bodyX = attackOffset;

            // Draw shadow
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(0, 2, 22, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // === LEGS ===
            ctx.save();
            ctx.translate(bodyX, bodyY);

            // Left leg
            this._drawLimb(ctx, -8, -50 + legSpread, 6, 40, p.gi, p.giShade, traits.muscular);
            // Right leg
            this._drawLimb(ctx, 5, -50 - legSpread, 6, 40, p.gi, p.giShade, traits.muscular);

            // Feet
            ctx.fillStyle = p.foot;
            drawRoundRect(ctx, -15, -14, 12, 7, 3); ctx.fill();
            drawRoundRect(ctx, 3, -14, 12, 7, 3); ctx.fill();

            // === TORSO ===
            const torsoW = traits.muscular ? 38 : 30;
            const torsoH = traits.muscular ? 38 : 34;
            ctx.save();
            ctx.rotate(hurtTilt * Math.PI / 180);
            // Body gradient
            const grad = ctx.createLinearGradient(-torsoW / 2, -90, torsoW / 2, -90);
            grad.addColorStop(0, p.gi);
            grad.addColorStop(1, p.giShade);
            ctx.fillStyle = grad;
            drawRoundRect(ctx, -torsoW / 2, -88, torsoW, torsoH, 5);
            ctx.fill();

            // Belt
            if (!traits.shirtless) {
                ctx.fillStyle = p.giBelt;
                ctx.fillRect(-torsoW / 2, -56, torsoW, 7);
            }

            // Chest lines (gi details)
            if (!traits.shirtless && !traits.qipao) {
                ctx.strokeStyle = p.giShade;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, -88); ctx.lineTo(0, -60);
                ctx.stroke();
            }

            // Thai wrap or accent stripe
            if (traits.thaiWrap) {
                ctx.fillStyle = p.accent;
                ctx.fillRect(-torsoW / 2, -80, torsoW, 5);
                ctx.fillRect(-torsoW / 2, -68, torsoW, 5);
            }

            // Shirtless muscle definition
            if (traits.shirtless || traits.muscular) {
                ctx.strokeStyle = p.skinShade;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(-8, -75, 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(8, -75, 8, 0, Math.PI * 2);
                ctx.stroke();
            }

            // === ARMS ===
            // Back arm (right visual)
            this._drawArm(ctx, 14, -83, armSwing - 5, p.skin, p.skinShade, traits.muscular, false);

            // Front arm (left visual) with punch extension
            this._drawArm(ctx, -14, -83, -armSwing + punchExtend * 0.7, p.skin, p.skinShade, traits.muscular, true);

            // === HEAD ===
            const headY = -95;
            this._drawHead(ctx, 0, headY, p, traits, animState, frame);

            ctx.restore(); // torso/legs translate
            ctx.restore(); // body translate
        }

        _drawArm(ctx, x, y, extend, skinColor, skinShade, muscular, isFront) {
            const w = muscular ? 9 : 7;
            const h = muscular ? 28 : 24;
            ctx.save();
            ctx.translate(x, y);

            // Upper arm
            ctx.fillStyle = isFront ? skinColor : skinShade;
            drawRoundRect(ctx, -w / 2, 0, w, h * 0.55, w / 2);
            ctx.fill();

            // Forearm
            ctx.translate(extend * 0.8, h * 0.5);
            ctx.fillStyle = isFront ? skinColor : skinShade;
            drawRoundRect(ctx, -w / 2, 0, w, h * 0.55, w / 2);
            ctx.fill();

            // Fist
            ctx.translate(extend * 0.2, h * 0.45);
            ctx.fillStyle = skinColor;
            drawRoundRect(ctx, -w / 2 - 1, -2, w + 2, w, 3);
            ctx.fill();

            ctx.restore();
        }

        _drawLimb(ctx, x, y, w, h, color, shade, muscular) {
            const lw = muscular ? w + 2 : w;
            ctx.fillStyle = color;
            drawRoundRect(ctx, x - lw / 2, y - h, lw, h, lw / 2);
            ctx.fill();
            ctx.fillStyle = shade;
            ctx.fillRect(x + lw / 4, y - h, lw / 4, h);
        }

        _drawHead(ctx, x, y, p, traits, animState, frame) {
            const t = frame / 60;
            const headW = traits.beast ? 28 : 22;
            const headH = traits.beast ? 26 : 24;

            ctx.save();
            ctx.translate(x, y);

            // --- Hair / skull (behind head) ---
            if (traits.wildHair || traits.longHair) {
                ctx.fillStyle = p.hair;
                ctx.beginPath();
                ctx.arc(0, -headH * 0.4, headW * 0.65, 0, Math.PI * 2);
                ctx.fill();
                // Wild hair spikes
                if (traits.wildHair) {
                    for (let i = 0; i < 6; i++) {
                        const ang = -Math.PI * 0.8 + i * (Math.PI * 0.35);
                        ctx.beginPath();
                        ctx.moveTo(0, -headH * 0.4);
                        ctx.lineTo(Math.cos(ang) * headW * 0.9, -headH * 0.4 + Math.sin(ang) * headW * 0.7);
                        ctx.lineTo(Math.cos(ang + 0.15) * headW * 0.7, -headH * 0.4 + Math.sin(ang + 0.15) * headW * 0.5);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
                if (traits.longHair) {
                    // Long flowing hair sides
                    ctx.fillRect(-headW * 0.65, -headH * 0.6, headW * 0.2, headH * 0.9);
                    ctx.fillRect(headW * 0.45, -headH * 0.6, headW * 0.2, headH * 0.9);
                }
            }

            if (traits.mohawk) {
                ctx.fillStyle = p.hair;
                drawRoundRect(ctx, -4, -headH * 0.9, 8, headH * 0.7, 3);
                ctx.fill();
            }

            if (traits.flattop) {
                ctx.fillStyle = p.hair;
                ctx.fillRect(-headW * 0.5, -headH * 0.9, headW, headH * 0.45);
            }

            if (traits.hairBuns) {
                ctx.fillStyle = p.hair;
                ctx.beginPath(); ctx.arc(-headW * 0.55, -headH * 0.7, 7, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(headW * 0.55, -headH * 0.7, 7, 0, Math.PI * 2); ctx.fill();
            }

            // --- Head base ---
            const hgrad = ctx.createRadialGradient(-4, -headH * 0.5, 2, 0, -headH * 0.3, headW * 0.8);
            hgrad.addColorStop(0, p.skin);
            hgrad.addColorStop(1, p.skinShade);
            ctx.fillStyle = hgrad;
            ctx.beginPath();
            ctx.ellipse(0, -headH / 2, headW / 2, headH / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // --- Headband ---
            if (traits.headband) {
                ctx.fillStyle = p.headband;
                ctx.fillRect(-headW / 2, -headH * 0.65, headW, 5);
                // Knot tails
                ctx.fillRect(headW / 2 - 3, -headH * 0.7, 8, 3);
                ctx.fillRect(headW / 2 - 3, -headH * 0.55, 7, 3);
            }

            // --- Eyes ---
            const eyeBlink = animState === 'hurt' ? 4 : 3;
            ctx.fillStyle = '#fff';
            ctx.fillRect(-headW * 0.35, -headH * 0.5 - 1, 7, eyeBlink);
            ctx.fillRect(headW * 0.1, -headH * 0.5 - 1, 7, eyeBlink);
            ctx.fillStyle = p.eyes;
            ctx.fillRect(-headW * 0.3, -headH * 0.5, 4, eyeBlink - 1);
            ctx.fillRect(headW * 0.14, -headH * 0.5, 4, eyeBlink - 1);

            // Eyebrow
            ctx.strokeStyle = p.hair || '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-headW * 0.38, -headH * 0.55);
            ctx.lineTo(-headW * 0.15, -headH * 0.58);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(headW * 0.08, -headH * 0.58);
            ctx.lineTo(headW * 0.35, -headH * 0.55);
            ctx.stroke();

            // Eyepatch (Sagat)
            if (traits.eyepatch) {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-headW * 0.4, -headH * 0.52, 9, 6);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-headW * 0.4, -headH * 0.49);
                ctx.lineTo(-headW * 0.5, -headH * 0.44);
                ctx.stroke();
            }

            // Scar
            if (traits.scar) {
                ctx.strokeStyle = '#804040';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-2, -headH * 0.7);
                ctx.lineTo(3, -headH * 0.3);
                ctx.stroke();
            }

            // Nose
            ctx.strokeStyle = p.skinShade;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -headH * 0.38);
            ctx.lineTo(-2, -headH * 0.27);
            ctx.lineTo(2, -headH * 0.27);
            ctx.stroke();

            // Mouth
            const mouthY = -headH * 0.2;
            ctx.strokeStyle = p.skinShade;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (animState === 'attack') {
                ctx.arc(0, mouthY, 4, 0, Math.PI);
            } else {
                ctx.moveTo(-5, mouthY); ctx.lineTo(5, mouthY);
            }
            ctx.stroke();

            // Fangs (Blanka)
            if (traits.fangs) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(-5, mouthY, 3, 4);
                ctx.fillRect(2, mouthY, 3, 4);
            }

            // Beard (Zangief)
            if (traits.beard) {
                ctx.fillStyle = p.hair;
                ctx.beginPath();
                ctx.arc(0, -headH * 0.15, headW * 0.42, 0, Math.PI);
                ctx.fill();
            }

            // Yoga skull necklace dots (Dhalsim)
            if (traits.skulls) {
                ctx.fillStyle = '#f0f0e0';
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.arc(i * 5, 0, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        _drawBust(ctx, p, traits) {
            // Shoulders
            const torsoW = traits.muscular ? 55 : 44;
            ctx.fillStyle = p.gi;
            drawRoundRect(ctx, -torsoW / 2, 10, torsoW, 45, 6);
            ctx.fill();

            if (traits.thaiWrap) {
                ctx.fillStyle = p.accent;
                ctx.fillRect(-torsoW / 2, 12, torsoW, 6);
            }

            // Belt line
            ctx.fillStyle = p.giBelt;
            ctx.fillRect(-torsoW / 2, 38, torsoW, 6);

            // Head
            const headW = traits.beast ? 38 : 30;
            const headH = traits.beast ? 36 : 32;

            // Hair behind
            if (traits.hairBuns) {
                ctx.fillStyle = p.hair;
                ctx.beginPath(); ctx.arc(-headW * 0.6, -15, 10, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(headW * 0.6, -15, 10, 0, Math.PI * 2); ctx.fill();
            }
            if (traits.wildHair || traits.longHair || traits.mohawk) {
                ctx.fillStyle = p.hair;
                ctx.beginPath();
                ctx.arc(0, -15, headW * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            if (traits.mohawk) {
                drawRoundRect(ctx, -5, -40, 10, 28, 4);
                ctx.fill();
            }
            if (traits.flattop) {
                ctx.fillRect(-headW * 0.5, -38, headW, headH * 0.45);
            }

            // Head
            const hgrad = ctx.createRadialGradient(-5, -18, 3, 0, -10, headW * 0.85);
            hgrad.addColorStop(0, p.skin);
            hgrad.addColorStop(1, p.skinShade);
            ctx.fillStyle = hgrad;
            ctx.beginPath();
            ctx.ellipse(0, -10, headW / 2, headH / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Headband
            if (traits.headband) {
                ctx.fillStyle = p.headband;
                ctx.fillRect(-headW / 2, -20, headW, 6);
            }

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(-headW * 0.38, -14, 9, 5);
            ctx.fillRect(headW * 0.1, -14, 9, 5);
            ctx.fillStyle = p.eyes;
            ctx.fillRect(-headW * 0.32, -13, 5, 4);
            ctx.fillRect(headW * 0.14, -13, 5, 4);

            // Eyebrow
            ctx.strokeStyle = p.hair || '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-headW * 0.4, -20); ctx.lineTo(-headW * 0.1, -22);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(headW * 0.1, -22); ctx.lineTo(headW * 0.4, -20);
            ctx.stroke();

            // Eyepatch
            if (traits.eyepatch) {
                ctx.fillStyle = '#111';
                ctx.fillRect(-headW * 0.42, -16, 11, 7);
            }

            // Scar
            if (traits.scar) {
                ctx.strokeStyle = '#804040';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-3, -30); ctx.lineTo(4, 2);
                ctx.stroke();
            }

            // Nose
            ctx.strokeStyle = p.skinShade;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -5); ctx.lineTo(-3, 3); ctx.lineTo(3, 3);
            ctx.stroke();

            // Mouth
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-7, 8); ctx.lineTo(7, 8);
            ctx.stroke();

            if (traits.beard) {
                ctx.fillStyle = p.hair;
                ctx.beginPath();
                ctx.arc(0, 8, headW * 0.4, 0, Math.PI);
                ctx.fill();
            }
            if (traits.fangs) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(-7, 8, 4, 5);
                ctx.fillRect(3, 8, 4, 5);
            }
        }

    }

    CharacterRenderer.FIGHTER_PROFILES = FIGHTER_PROFILES;

    window.CharacterRenderer = CharacterRenderer;

})();
