/**
 * Monster Rampage — Premium Overhaul
 * FANG (Werewolf) · GORATH (Godzilla) · KONG (King Kong)
 * Canvas-drawn monsters with gradients, bezier curves, and full animation system.
 */
(function () {
    'use strict';

    /* ─── MATH SHORTCUTS ──────────────────────────────────────────────────── */
    const PI  = Math.PI;
    const sin = Math.sin;
    const cos = Math.cos;
    const abs = Math.abs;

    function osc(t, period, amp) { return sin(t / period) * amp; }

    /* ─── COLOR HELPERS ───────────────────────────────────────────────────── */
    function hexShift(hex, delta) {
        if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
        const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + delta));
        const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + delta));
        const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + delta));
        return '#' +
            r.toString(16).padStart(2, '0') +
            g.toString(16).padStart(2, '0') +
            b.toString(16).padStart(2, '0');
    }
    const lighten = (h, n) => hexShift(h, n);
    const darken  = (h, n) => hexShift(h, -n);

    /* ═══════════════════════════════════════════════════════════════════════
       MONSTER RENDERERS — cx = feet centre-x, cy = feet bottom-y
    ═══════════════════════════════════════════════════════════════════════ */

    /** FANG — The Werewolf (bipedal wolf: digitigrade legs, elongated snout, pointed ears) */
    function drawFang(ctx, cx, cy, opts) {
        const { facing = 1, animState = 'idle', animTime = 0,
                hurtFlash = 0, attackCooldown = 0 } = opts;

        const isWalk   = animState === 'walk';
        const isAttack = animState === 'attack';
        const isRoar   = animState === 'roar';
        const isHurt   = hurtFlash > 0;
        const isJump   = animState === 'jump';

        const bob      = isWalk ? osc(animTime, 180, 2.5) : 0;
        const legSwing = isWalk ? osc(animTime, 180, 0.28) : (isJump ? -0.3 : 0);
        const armSwing = isWalk ? osc(animTime, 180, 0.22) : 0;
        const attackProg = isAttack ? Math.max(0, (30 - attackCooldown) / 10) : 0;

        const FUR  = '#8B7355';
        const DARK = '#5a4535';
        const LITE = '#c8b08a';
        const EYE  = isHurt ? '#ffffff' : '#ff3030';

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(facing, 1);

        /* TAIL */
        const tailWag = isWalk ? osc(animTime, 180, 8) : (isRoar ? 15 : 4);
        ctx.beginPath();
        ctx.moveTo(-5, -42 + bob);
        ctx.bezierCurveTo(-30, -20 + tailWag, -46, 6 + tailWag, -26, 20 + tailWag * 0.5);
        ctx.lineWidth = 9; ctx.strokeStyle = DARK; ctx.lineCap = 'round'; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5, -42 + bob);
        ctx.bezierCurveTo(-28, -18 + tailWag, -44, 8 + tailWag, -24, 22 + tailWag * 0.5);
        ctx.lineWidth = 5; ctx.strokeStyle = FUR; ctx.stroke();

        /* HIND LEGS — digitigrade (bent at ankle) */
        // Right hind leg
        ctx.save();
        ctx.translate(-7, -35 + bob);
        ctx.rotate(-0.15 + legSwing);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-3, 18);
        ctx.lineWidth = 11; ctx.strokeStyle = DARK; ctx.lineCap = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-3, 18); ctx.lineTo(4, 33);
        ctx.lineWidth = 8; ctx.strokeStyle = FUR; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 33); ctx.lineTo(8, 40);
        ctx.lineWidth = 6; ctx.strokeStyle = DARK; ctx.stroke();
        for (let c = -1; c <= 1; c++) {
            ctx.beginPath(); ctx.moveTo(8 + c * 3, 40); ctx.lineTo(8 + c * 3 + c * 2, 47);
            ctx.lineWidth = 2; ctx.strokeStyle = '#222'; ctx.stroke();
        }
        ctx.restore();
        // Left hind leg
        ctx.save();
        ctx.translate(7, -35 + bob);
        ctx.rotate(0.15 - legSwing);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(3, 18);
        ctx.lineWidth = 11; ctx.strokeStyle = DARK; ctx.lineCap = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3, 18); ctx.lineTo(-4, 33);
        ctx.lineWidth = 8; ctx.strokeStyle = FUR; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-4, 33); ctx.lineTo(-8, 40);
        ctx.lineWidth = 6; ctx.strokeStyle = DARK; ctx.stroke();
        for (let c = -1; c <= 1; c++) {
            ctx.beginPath(); ctx.moveTo(-8 + c * 3, 40); ctx.lineTo(-8 + c * 3 + c * 2, 47);
            ctx.lineWidth = 2; ctx.strokeStyle = '#222'; ctx.stroke();
        }
        ctx.restore();

        /* TORSO — hunched muscular back */
        const tg = ctx.createLinearGradient(-18, -76 + bob, 18, -34 + bob);
        tg.addColorStop(0, '#a08060'); tg.addColorStop(0.5, FUR); tg.addColorStop(1, DARK);
        ctx.beginPath();
        ctx.moveTo(-14, -34 + bob);
        ctx.bezierCurveTo(-20, -50 + bob, -18, -68 + bob, -5, -77 + bob);
        ctx.bezierCurveTo(5, -81 + bob, 14, -70 + bob, 12, -58 + bob);
        ctx.bezierCurveTo(10, -46 + bob, 8, -34 + bob, 0, -31 + bob);
        ctx.bezierCurveTo(-8, -29 + bob, -14, -34 + bob, -14, -34 + bob);
        ctx.fillStyle = tg; ctx.fill();
        ctx.strokeStyle = DARK; ctx.lineWidth = 1.5; ctx.stroke();
        // Belly fur
        ctx.beginPath();
        ctx.ellipse(-1, -53 + bob, 7, 13, 0, 0, PI * 2);
        ctx.fillStyle = LITE; ctx.fill();
        // Fur ridge spikes along spine
        for (let i = 0; i < 5; i++) {
            const sy = -77 + i * 9 + bob;
            ctx.beginPath();
            ctx.moveTo(-5 + i * 0.5 - 4, sy + 4);
            ctx.lineTo(-5 + i * 0.5, sy - 7 - (i === 2 ? 3 : 0));
            ctx.lineTo(-5 + i * 0.5 + 4, sy + 4);
            ctx.fillStyle = DARK; ctx.fill();
        }

        /* ARMS */
        const clawLunge = Math.min(attackProg, 1.0) * 0.95;
        // Back arm
        ctx.save();
        ctx.translate(-13, -64 + bob); ctx.rotate(-0.35 + armSwing);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-5, 22);
        ctx.lineWidth = 9; ctx.strokeStyle = FUR; ctx.lineCap = 'round'; ctx.stroke();
        for (let c = -1; c <= 1; c++) {
            ctx.beginPath(); ctx.moveTo(-5 + c * 3, 22); ctx.lineTo(-5 + c * 3 - 1, 31);
            ctx.lineWidth = 2; ctx.strokeStyle = '#1a1a1a'; ctx.stroke();
        }
        ctx.restore();
        // Front attacking arm
        ctx.save();
        ctx.translate(11, -65 + bob); ctx.rotate(0.3 - armSwing - clawLunge);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(8, 24);
        ctx.lineWidth = 9; ctx.strokeStyle = FUR; ctx.lineCap = 'round'; ctx.stroke();
        for (let c = -1; c <= 1; c++) {
            ctx.beginPath(); ctx.moveTo(8 + c * 3, 24); ctx.lineTo(8 + c * 3 + 2, 34);
            ctx.lineWidth = 2.5; ctx.strokeStyle = '#111'; ctx.stroke();
        }
        ctx.restore();

        /* HEAD */
        const headY    = -84 + bob;
        const headTilt = isRoar ? -0.32 : (isAttack ? 0.18 : 0);
        const mouthOpen = isRoar ? 0.42 : (isAttack ? 0.18 : 0);
        const jawDrop   = mouthOpen * 12;

        ctx.save();
        ctx.translate(-2, headY);
        ctx.rotate(headTilt);

        // Skull
        const hg = ctx.createRadialGradient(-3, -10, 2, 0, -8, 16);
        hg.addColorStop(0, '#a88060'); hg.addColorStop(1, DARK);
        ctx.beginPath(); ctx.arc(0, -9, 14, 0, PI * 2);
        ctx.fillStyle = hg; ctx.fill();
        ctx.strokeStyle = DARK; ctx.lineWidth = 1; ctx.stroke();

        // Pointed wolf ears (triangles)
        ctx.beginPath(); ctx.moveTo(-9, -19); ctx.lineTo(-17, -37); ctx.lineTo(-2, -22);
        ctx.fillStyle = FUR; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-10, -20); ctx.lineTo(-15, -33); ctx.lineTo(-4, -23);
        ctx.fillStyle = '#d4887a'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(6, -20); ctx.lineTo(15, -37); ctx.lineTo(16, -21);
        ctx.fillStyle = FUR; ctx.fill();
        ctx.beginPath(); ctx.moveTo(7, -21); ctx.lineTo(13, -32); ctx.lineTo(14, -22);
        ctx.fillStyle = '#d4887a'; ctx.fill();

        // Elongated wolf snout / muzzle
        ctx.beginPath();
        ctx.moveTo(4, -13);
        ctx.bezierCurveTo(13, -13, 23, -11, 23, -7);
        ctx.bezierCurveTo(23, -3 + mouthOpen * 5, 14, 0 + jawDrop, 4, 1);
        ctx.fillStyle = LITE; ctx.fill();
        ctx.strokeStyle = DARK; ctx.lineWidth = 1; ctx.stroke();

        // Nose tip
        ctx.beginPath(); ctx.ellipse(21, -9, 3, 2.2, 0, 0, PI * 2);
        ctx.fillStyle = '#1a1a1a'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(20, -10, 1.1, 0.8, -0.3, 0, PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();

        // Teeth
        if (mouthOpen > 0.04) {
            ctx.fillStyle = '#f0ede8';
            [[7],[11],[15],[19]].forEach(([tx]) => {
                ctx.beginPath(); ctx.moveTo(tx-2, 0); ctx.lineTo(tx, jawDrop * 0.7); ctx.lineTo(tx+2, 0); ctx.fill();
            });
            ctx.beginPath(); ctx.moveTo(8, jawDrop * 0.85); ctx.lineTo(10, jawDrop * 0.45); ctx.lineTo(12, jawDrop * 0.85); ctx.fill();
            ctx.beginPath(); ctx.moveTo(14, jawDrop * 0.85); ctx.lineTo(16, jawDrop * 0.45); ctx.lineTo(18, jawDrop * 0.85); ctx.fill();
        }

        // Eyes (fierce, small)
        ctx.beginPath(); ctx.ellipse(-5, -14, 3.5, 2.8, -0.15, 0, PI * 2);
        ctx.fillStyle = EYE; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-5, -14, 1.8, 2.5, 0, 0, PI * 2);
        ctx.fillStyle = '#000'; ctx.fill();
        ctx.beginPath(); ctx.arc(-6, -15, 0.9, 0, PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();

        // Brow crease
        ctx.beginPath(); ctx.moveTo(-10, -19); ctx.lineTo(-1, -16);
        ctx.lineWidth = 2.5; ctx.strokeStyle = DARK; ctx.stroke();

        ctx.restore(); // head

        if (isHurt) {
            ctx.globalAlpha = 0.45 * (hurtFlash / 15);
            ctx.fillStyle = '#ff2020';
            ctx.fillRect(-26, -96, 52, 96);
            ctx.globalAlpha = 1;
        }
        ctx.restore(); // main
    }

    /** GORATH — The Godzilla (barrel torso, dorsal spines, long tail, wide jaw, slit pupils) */
    function drawGorath(ctx, cx, cy, opts) {
        const { facing = 1, animState = 'idle', animTime = 0,
                hurtFlash = 0, attackCooldown = 0 } = opts;

        const isWalk   = animState === 'walk';
        const isAttack = animState === 'attack';
        const isRoar   = animState === 'roar';
        const isHurt   = hurtFlash > 0;

        const bob       = isWalk ? osc(animTime, 320, 4.5) : 0;
        const legSwing  = isWalk ? osc(animTime, 320, 0.22) : 0;
        const tailSwing = isAttack ? osc(animTime, 120, 20) : osc(animTime, 700, 7);

        const DGRN = '#1e4a1a';
        const MGRN = '#2d6a22';
        const HGRN = '#4a9a38';
        const ATOM = '#ff6600';
        const EYE  = isHurt ? '#ffffff' : '#ffcc00';

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(facing, 1);

        /* TAIL — long sweeping bezier, 60px */
        ctx.beginPath();
        ctx.moveTo(10, -30 + bob);
        ctx.bezierCurveTo(40 + tailSwing * 0.5, -8 + bob, 62 + tailSwing, 18 + bob, 60 + tailSwing * 0.6, 38 + bob);
        ctx.lineWidth = 24; ctx.strokeStyle = DGRN; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 16; ctx.strokeStyle = MGRN; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, -31 + bob);
        ctx.bezierCurveTo(38 + tailSwing * 0.5, -10 + bob, 60 + tailSwing, 15 + bob, 58 + tailSwing * 0.6, 35 + bob);
        ctx.lineWidth = 5; ctx.strokeStyle = HGRN; ctx.stroke();

        /* LEGS — thick trunk dinosaur legs, 3-toed feet */
        const hipY = -36 + bob;
        function drawDinoLeg(ox, sign) {
            ctx.save(); ctx.rotate(sign * legSwing * 0.55);
            ctx.beginPath(); ctx.moveTo(ox, hipY); ctx.lineTo(ox + sign * 2, hipY + 25); ctx.lineTo(ox - sign * 2, hipY + 42);
            ctx.lineWidth = 21; ctx.strokeStyle = DGRN; ctx.lineCap = 'round'; ctx.stroke();
            ctx.lineWidth = 14; ctx.strokeStyle = MGRN; ctx.stroke();
            const fx = ox - sign * 2, fy = hipY + 42;
            [[-6, 0], [0, 5], [6, 0]].forEach(([dx, dy]) => {
                ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + dx, fy + 7 + dy);
                ctx.lineWidth = 5; ctx.strokeStyle = DGRN; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(fx + dx, fy + 7 + dy); ctx.lineTo(fx + dx, fy + 10 + dy);
                ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.stroke();
            });
            ctx.restore();
        }
        drawDinoLeg(-12, -1);
        drawDinoLeg( 12,  1);

        /* BARREL TORSO */
        const tG = ctx.createLinearGradient(-25, -84 + bob, 25, -36 + bob);
        tG.addColorStop(0, HGRN); tG.addColorStop(0.45, MGRN); tG.addColorStop(1, DGRN);
        ctx.beginPath(); ctx.ellipse(0, -58 + bob, 25, 30, 0, 0, PI * 2);
        ctx.fillStyle = tG; ctx.fill();
        ctx.strokeStyle = DGRN; ctx.lineWidth = 2; ctx.stroke();

        // Scale texture overlay
        ctx.globalAlpha = 0.28;
        for (let row = 0; row < 3; row++) {
            for (let col = -2; col <= 2; col++) {
                ctx.beginPath();
                ctx.ellipse(col * 9, -50 + row * 12 + bob, 5, 4, 0, 0, PI * 2);
                ctx.fillStyle = '#3a7a2a'; ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        /* DORSAL SPINES — 5 triangles along back, glow during roar/attack */
        const spineCol = (isRoar || isAttack) ? ATOM : HGRN;
        const spines = [
            { x:-3, y:-84, w:9 }, { x:-2, y:-77, w:8 }, { x: 0, y:-70, w:7 },
            { x: 1, y:-63, w:6 }, { x: 2, y:-57, w:5 }
        ].map(s => ({ ...s, y: s.y + bob }));

        if (isRoar || isAttack) {
            spines.forEach(s => {
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.shadowColor = ATOM; ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.moveTo(s.x - s.w - 3, s.y + s.w);
                ctx.lineTo(s.x, s.y - 14 - s.w);
                ctx.lineTo(s.x + s.w + 3, s.y + s.w);
                ctx.fillStyle = ATOM; ctx.fill();
                ctx.shadowBlur = 0; ctx.globalAlpha = 1;
                ctx.restore();
            });
        }
        spines.forEach(s => {
            ctx.beginPath();
            ctx.moveTo(s.x - s.w, s.y + s.w);
            ctx.lineTo(s.x, s.y - 13 - s.w);
            ctx.lineTo(s.x + s.w, s.y + s.w);
            ctx.fillStyle = spineCol; ctx.fill();
            ctx.strokeStyle = DGRN; ctx.lineWidth = 1; ctx.stroke();
        });

        /* SHORT ARMS */
        const aSwing = isAttack ? -0.7 : 0;
        ctx.save(); ctx.translate(-20, -68 + bob); ctx.rotate(-0.5 + aSwing);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-6, 16);
        ctx.lineWidth = 12; ctx.strokeStyle = MGRN; ctx.lineCap = 'round'; ctx.stroke();
        for (let c = -1; c <= 1; c++) {
            ctx.beginPath(); ctx.moveTo(-6+c*2,16); ctx.lineTo(-6+c*2,23);
            ctx.lineWidth = 2.5; ctx.strokeStyle = '#111'; ctx.stroke();
        }
        ctx.restore();
        ctx.save(); ctx.translate(17, -72 + bob); ctx.rotate(0.4 - aSwing);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(5, 14);
        ctx.lineWidth = 12; ctx.strokeStyle = MGRN; ctx.lineCap = 'round'; ctx.stroke();
        for (let c = -1; c <= 1; c++) {
            ctx.beginPath(); ctx.moveTo(5+c*2,14); ctx.lineTo(5+c*2,21);
            ctx.lineWidth = 2.5; ctx.strokeStyle = '#111'; ctx.stroke();
        }
        ctx.restore();

        /* HEAD */
        const headY   = -84 + bob;
        const jawOpen = isRoar ? 0.52 : (isAttack ? 0.28 : 0.06);
        const jawDrop = jawOpen * 16;

        ctx.save();
        ctx.translate(0, headY);
        ctx.rotate(isRoar ? -0.2 : 0);

        // Crest/frill along top of skull
        [[-10,-14,-6],[-5,-21,-2],[0,-23,2],[5,-20,6],[9,-14,12]].forEach(([x1,yt,x2]) => {
            ctx.beginPath(); ctx.moveTo(x1,-6); ctx.lineTo((x1+x2)/2,yt); ctx.lineTo(x2,-6);
            ctx.fillStyle = (isRoar||isAttack) ? ATOM : MGRN; ctx.fill();
        });

        // Upper skull
        const hg = ctx.createRadialGradient(0,-10,3,0,-8,21);
        hg.addColorStop(0, HGRN); hg.addColorStop(1, DGRN);
        ctx.beginPath();
        ctx.moveTo(-21,0);
        ctx.bezierCurveTo(-23,-16,-14,-25,0,-25);
        ctx.bezierCurveTo(14,-25,23,-16,21,-5);
        ctx.bezierCurveTo(21,-1,17,0,13,0);
        ctx.lineTo(-21,0);
        ctx.fillStyle = hg; ctx.fill();
        ctx.strokeStyle = DGRN; ctx.lineWidth = 1.5; ctx.stroke();

        // Lower jaw
        ctx.beginPath();
        ctx.moveTo(-19,0); ctx.bezierCurveTo(-19,jawDrop,15,jawDrop,17,0);
        ctx.fillStyle = MGRN; ctx.fill();
        ctx.strokeStyle = DGRN; ctx.lineWidth = 1; ctx.stroke();

        // Atomic breath glow in mouth
        if ((isRoar || isAttack) && jawOpen > 0.08) {
            const bG = ctx.createRadialGradient(0,jawDrop*0.5,0,0,jawDrop*0.5,22);
            bG.addColorStop(0,'rgba(255,210,0,0.95)'); bG.addColorStop(0.45,'rgba(255,100,0,0.6)'); bG.addColorStop(1,'rgba(255,40,0,0)');
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = bG;
            ctx.beginPath(); ctx.ellipse(0,jawDrop*0.5,17,jawDrop*0.55+3,0,0,PI*2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Teeth
        if (jawOpen > 0.04) {
            ctx.fillStyle = '#e0ddd5';
            for (let i = 0; i < 6; i++) {
                const tx = -14 + i * 5.5;
                ctx.beginPath(); ctx.moveTo(tx,0); ctx.lineTo(tx+2.5,jawDrop*0.55); ctx.lineTo(tx+5,0); ctx.fill();
                ctx.beginPath(); ctx.moveTo(tx,jawDrop*0.92); ctx.lineTo(tx+2.5,jawDrop*0.42); ctx.lineTo(tx+5,jawDrop*0.92); ctx.fill();
            }
        }

        // Slit-pupil eyes
        ctx.beginPath(); ctx.ellipse(-9,-13,5,3.5,0,0,PI*2); ctx.fillStyle=EYE; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-9,-13,1.5,3.5,0,0,PI*2); ctx.fillStyle='#000'; ctx.fill();
        ctx.beginPath(); ctx.arc(-11,-15,1.2,0,PI*2); ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fill();

        // Brow ridge
        ctx.beginPath(); ctx.moveTo(-19,-17); ctx.lineTo(-4,-15);
        ctx.lineWidth = 3.5; ctx.strokeStyle = DGRN; ctx.stroke();

        ctx.restore(); // head

        if (isHurt) {
            ctx.globalAlpha = 0.4 * (hurtFlash / 15);
            ctx.fillStyle = '#ff2020';
            ctx.fillRect(-30, -112, 60, 112);
            ctx.globalAlpha = 1;
        }
        ctx.restore(); // main
    }

    /** KONG — The Giant Ape (barrel chest, knuckle-drag arms, heavy brow, flat nose) */
    function drawKong(ctx, cx, cy, opts) {
        const { facing = 1, animState = 'idle', animTime = 0,
                hurtFlash = 0, attackCooldown = 0 } = opts;

        const isWalk   = animState === 'walk';
        const isAttack = animState === 'attack';
        const isRoar   = animState === 'roar';
        const isIdle   = animState === 'idle';
        const isJump   = animState === 'jump';
        const isHurt   = hurtFlash > 0;

        const bob      = isWalk ? osc(animTime, 260, 3) : 0;
        const legSwing = isWalk ? osc(animTime, 260, 0.22) : 0;
        const breathe  = osc(animTime, 1200, 1.5);

        const DBRN  = '#2a1a0e';
        const MBRN  = '#3d2b1f';
        const LBRN  = '#5a3a28';
        const BELLY = '#7a5035';
        const EYE   = isHurt ? '#ffffff' : '#ff8800';

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(facing, 1);

        /* BOW-LEGGED SHORT LEGS */
        const hipY = -24 + bob;
        ctx.save(); ctx.translate(-11, hipY); ctx.rotate(0.35 + legSwing * 0.4);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-3,22);
        ctx.lineWidth = 18; ctx.strokeStyle = DBRN; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 11; ctx.strokeStyle = MBRN; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-3,22,9,5,0.3,0,PI*2); ctx.fillStyle=DBRN; ctx.fill();
        ctx.restore();

        ctx.save(); ctx.translate(11, hipY); ctx.rotate(-0.35 - legSwing * 0.4);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(3,22);
        ctx.lineWidth = 18; ctx.strokeStyle = DBRN; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 11; ctx.strokeStyle = MBRN; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(3,22,9,5,-0.3,0,PI*2); ctx.fillStyle=DBRN; ctx.fill();
        ctx.restore();

        /* MASSIVE BARREL CHEST */
        const cW = 28 + breathe * 0.5;
        const cH = 34 + breathe * 0.3;
        const cG = ctx.createLinearGradient(-cW, -84 + bob, cW, -22 + bob);
        cG.addColorStop(0, LBRN); cG.addColorStop(0.4, MBRN); cG.addColorStop(1, DBRN);
        ctx.beginPath(); ctx.ellipse(0, -52 + bob, cW, cH, 0, 0, PI * 2);
        ctx.fillStyle = cG; ctx.fill();
        ctx.strokeStyle = DBRN; ctx.lineWidth = 2; ctx.stroke();

        // Pec muscle definition
        const pecA = isRoar ? 'rgba(255,150,0,0.18)' : 'rgba(0,0,0,0.22)';
        ctx.beginPath(); ctx.ellipse(-11,-60+bob,11,9,-0.2,0,PI*2); ctx.fillStyle=pecA; ctx.fill();
        ctx.beginPath(); ctx.ellipse( 11,-60+bob,11,9, 0.2,0,PI*2); ctx.fillStyle=pecA; ctx.fill();

        // Lighter belly fur
        ctx.beginPath(); ctx.ellipse(0,-42+bob,18,20,0,0,PI*2);
        ctx.fillStyle = BELLY; ctx.globalAlpha = 0.42; ctx.fill(); ctx.globalAlpha = 1;

        // Chest-beat glow during roar
        if (isRoar) {
            const gp = abs(osc(animTime, 85, 1));
            ctx.beginPath(); ctx.ellipse(0,-55+bob,cW+gp*5,cH+gp*3,0,0,PI*2);
            ctx.fillStyle = 'rgba(255,150,30,0.2)'; ctx.fill();
        }

        /* LONG GORILLA ARMS — hang near ground when idle */
        let leftAng, rightAng;
        if (isRoar) {
            leftAng  = -1.1 - abs(osc(animTime, 80, 0.32));
            rightAng = -1.1 - abs(osc(animTime, 80, 0.32));
        } else if (isAttack) {
            const p = Math.min(1, (30 - attackCooldown) / 12);
            leftAng  = -(0.8 + p * 0.5);
            rightAng =  0.9;
        } else if (isIdle || isJump) {
            leftAng  =  0.92;
            rightAng = -0.92;
        } else {
            leftAng  =  0.82 + osc(animTime, 260, 0.3);
            rightAng = -(0.82 + osc(animTime, 260, 0.3));
        }

        // Left arm
        ctx.save(); ctx.translate(-26, -66 + bob); ctx.rotate(leftAng);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-5,32);
        ctx.lineWidth = 18; ctx.strokeStyle = DBRN; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 11; ctx.strokeStyle = MBRN; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-5,32); ctx.lineTo(-3,58);
        ctx.lineWidth = 15; ctx.strokeStyle = DBRN; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 9; ctx.strokeStyle = MBRN; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-3,62,9,6,0.3,0,PI*2); ctx.fillStyle=DBRN; ctx.fill();
        ctx.restore();

        // Right arm
        ctx.save(); ctx.translate(26, -66 + bob); ctx.rotate(rightAng);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(5,32);
        ctx.lineWidth = 18; ctx.strokeStyle = DBRN; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 11; ctx.strokeStyle = MBRN; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5,32); ctx.lineTo(3,58);
        ctx.lineWidth = 15; ctx.strokeStyle = DBRN; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 9; ctx.strokeStyle = MBRN; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(3,62,9,6,-0.3,0,PI*2); ctx.fillStyle=DBRN; ctx.fill();
        ctx.restore();

        /* HEAD */
        const headY  = -87 + bob;
        const jawOpen = isRoar ? 0.48 : (isAttack ? 0.18 : 0);
        const jawDrop = jawOpen * 18;

        ctx.save();
        ctx.translate(0, headY);

        // Heavy overhanging brow ridge
        ctx.beginPath();
        ctx.moveTo(-17,-7);
        ctx.bezierCurveTo(-19,-20,-10,-25,0,-25);
        ctx.bezierCurveTo(10,-25,19,-20,17,-7);
        ctx.fillStyle = DBRN; ctx.fill();
        ctx.strokeStyle = '#1a0e05'; ctx.lineWidth = 1; ctx.stroke();

        // Skull dome
        const hg = ctx.createRadialGradient(-4,-12,3,0,-10,18);
        hg.addColorStop(0, LBRN); hg.addColorStop(1, MBRN);
        ctx.beginPath(); ctx.arc(0,-11,16,PI,0);
        ctx.fillStyle = hg; ctx.fill();

        // Lower face / cheeks
        ctx.beginPath();
        ctx.moveTo(-16,-11);
        ctx.bezierCurveTo(-18,3,-12,10,0,10);
        ctx.bezierCurveTo(12,10,18,3,16,-11);
        ctx.fillStyle = MBRN; ctx.fill();

        // Small rounded ears on sides
        ctx.beginPath(); ctx.ellipse(-18,-13,6,5,0.3,0,PI*2); ctx.fillStyle=MBRN; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-18,-13,3.5,3,0.3,0,PI*2); ctx.fillStyle='#6b4030'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(18,-13,6,5,-0.3,0,PI*2); ctx.fillStyle=MBRN; ctx.fill();
        ctx.beginPath(); ctx.ellipse(18,-13,3.5,3,-0.3,0,PI*2); ctx.fillStyle='#6b4030'; ctx.fill();

        // Flat gorilla nose
        ctx.beginPath(); ctx.ellipse(0,-3,8,6,0,0,PI*2); ctx.fillStyle=DBRN; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-3,-3,3,2.5,0,0,PI*2); ctx.fillStyle='#1a0a04'; ctx.fill();
        ctx.beginPath(); ctx.ellipse( 3,-3,3,2.5,0,0,PI*2); ctx.fillStyle='#1a0a04'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-4,-5,1.2,0.9,0.3,0,PI*2);
        ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fill();

        // Wide jaw
        ctx.beginPath();
        ctx.moveTo(-15,1); ctx.bezierCurveTo(-16,1+jawDrop,16,1+jawDrop,15,1);
        ctx.fillStyle = '#1a0a04'; ctx.fill();

        // Teeth
        if (jawOpen > 0.04) {
            ctx.fillStyle = '#e8e0c8';
            for (let i = 0; i < 4; i++) {
                const tx = -10 + i * 7;
                ctx.beginPath(); ctx.moveTo(tx,1); ctx.lineTo(tx+3,jawDrop*0.6+1); ctx.lineTo(tx+6,1); ctx.fill();
            }
            ctx.fillStyle = '#f0eedd';
            ctx.beginPath(); ctx.moveTo(-13,1); ctx.lineTo(-11,jawDrop*0.55); ctx.lineTo(-9,1); ctx.fill();
            ctx.beginPath(); ctx.moveTo( 9,1); ctx.lineTo(11,jawDrop*0.55); ctx.lineTo(13,1); ctx.fill();
        }

        // Small eyes deep under heavy brow
        ctx.beginPath(); ctx.ellipse(-7,-12,4.5,3.5,0,0,PI*2); ctx.fillStyle=EYE; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-7,-12,2.5,2.5,0,0,PI*2); ctx.fillStyle='#000'; ctx.fill();
        ctx.beginPath(); ctx.arc(-8,-13,1,0,PI*2); ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(7,-12,4.5,3.5,0,0,PI*2); ctx.fillStyle=EYE; ctx.fill();
        ctx.beginPath(); ctx.ellipse(7,-12,2.5,2.5,0,0,PI*2); ctx.fillStyle='#000'; ctx.fill();
        ctx.beginPath(); ctx.arc(6,-13,1,0,PI*2); ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fill();

        ctx.restore(); // head

        if (isHurt) {
            ctx.globalAlpha = 0.4 * (hurtFlash / 15);
            ctx.fillStyle = '#ff2020';
            ctx.fillRect(-32, -108, 64, 108);
            ctx.globalAlpha = 1;
        }
        ctx.restore(); // main
    }

    /* ═══════════════════════════════════════════════════════════════════════
       MAIN GAME CLASS
    ═══════════════════════════════════════════════════════════════════════ */
    class MonsterRampageGame {
        constructor() {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx    = this.canvas.getContext('2d');
            this.canvas.width  = 1000;
            this.canvas.height = 600;

            this.state       = 'playing';
            this.players     = [];
            this.buildings   = [];
            this.projectiles = [];
            this.pickups     = [];
            this.particles   = [];
            this.effects     = [];

            this.level             = 1;
            this.cityDestruction   = 0;
            this.targetDestruction = 100;

            this.clouds = this._initClouds();

            this.keys = {};
            this._setupInput();
            this._init();

            this.lastTime = performance.now();
            this._gameLoop();
        }

        _initClouds() {
            return [
                { x:  80, y: 55, rx: 65, ry: 25, speed: 0.045 },
                { x: 310, y: 38, rx: 85, ry: 30, speed: 0.028 },
                { x: 600, y: 62, rx: 58, ry: 23, speed: 0.055 },
                { x: 860, y: 44, rx: 72, ry: 28, speed: 0.038 }
            ];
        }

        _setupInput() {
            window.addEventListener('keydown', e => { this.keys[e.code] = true;  e.preventDefault(); });
            window.addEventListener('keyup',   e => { this.keys[e.code] = false; });
        }

        _init() {
            const GY = this.canvas.height - 100;
            this.players = [
                {
                    id:1, name:'FANG',  type:'wolf',
                    x:90,  y:GY-90,  vx:0, vy:0,
                    width:58, height:90,
                    health:100, maxHealth:100,
                    size:1, maxSize:3, score:0, color:'#c8b08a',
                    onGround:false, climbing:false, climbingBuilding:null,
                    facing:1, animState:'idle', animTime:0,
                    attackCooldown:0, roarCooldown:0, hurtFlash:0,
                    controls:{ left:'KeyA', right:'KeyD', up:'KeyW', down:'KeyS', action:'Space' }
                },
                {
                    id:2, name:'GORATH', type:'godzilla',
                    x:430, y:GY-100, vx:0, vy:0,
                    width:68, height:100,
                    health:150, maxHealth:150,
                    size:1, maxSize:3, score:0, color:'#4a9a38',
                    onGround:false, climbing:false, climbingBuilding:null,
                    facing:-1, animState:'idle', animTime:0,
                    attackCooldown:0, roarCooldown:0, hurtFlash:0,
                    controls:{ left:'ArrowLeft', right:'ArrowRight', up:'ArrowUp', down:'ArrowDown', action:'Enter' }
                },
                {
                    id:3, name:'KONG', type:'kong',
                    x:760, y:GY-95, vx:0, vy:0,
                    width:64, height:95,
                    health:120, maxHealth:120,
                    size:1, maxSize:3, score:0, color:'#5a3a28',
                    onGround:false, climbing:false, climbingBuilding:null,
                    facing:-1, animState:'idle', animTime:0,
                    attackCooldown:0, roarCooldown:0, hurtFlash:0,
                    controls:{ left:'KeyJ', right:'KeyL', up:'KeyI', down:'KeyK', action:'ShiftLeft', action2:'ShiftRight' }
                }
            ];
            this._generateCity();
        }

        /* ── CITY ─────────────────────────────────────────────────── */
        _generateCity() {
            this.buildings = [];
            const GY = this.canvas.height - 100;
            const palettes = [
                { color:'#34495e', accent:'#2c3e50' },
                { color:'#2c3e50', accent:'#1a252f' },
                { color:'#708090', accent:'#5a6a7a' },
                { color:'#607080', accent:'#506070' },
                { color:'#3a4a5e', accent:'#2a3a4e' }
            ];
            let x = 25;
            for (let i = 0; i < 8; i++) {
                const pal = palettes[Math.floor(Math.random() * palettes.length)];
                const w   = 80 + Math.floor(Math.random() * 60);
                const h   = 200 + Math.floor(Math.random() * 180);
                const floors = Math.floor(h / 22);
                const hp  = floors * 10;
                this.buildings.push({
                    x, y: GY - h, width: w, height: h,
                    color: pal.color, accent: pal.accent,
                    health: hp, maxHealth: hp,
                    damage: 0, destroyed: false,
                    windows: this._genWindows(floors, w),
                    cracks: [],
                    hasAntenna: Math.random() > 0.45,
                    antennaH: 14 + Math.floor(Math.random() * 22)
                });
                x += w + 20 + Math.floor(Math.random() * 25);
            }
        }

        _genWindows(floors, width) {
            const wins = [];
            const cols = Math.max(1, Math.floor((width - 18) / 26));
            for (let f = 0; f < floors; f++) {
                for (let c = 0; c < cols; c++) {
                    wins.push({ x:9+c*26, y:f*22+6, width:17, height:14,
                                lit:Math.random()>0.32, broken:false });
                }
            }
            return wins;
        }

        /* ── UPDATE ───────────────────────────────────────────────── */
        update(dt) {
            if (this.state !== 'playing') return;

            this.clouds.forEach(c => { c.x += c.speed; if (c.x > 1110) c.x = -120; });

            this.players.forEach(p => { if (p.health > 0) this._updatePlayer(p); });

            if (Math.random() < 0.008) this._spawnPickup();
            if (Math.random() < 0.015) this._spawnMilitary();

            this.projectiles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
            this.projectiles = this.projectiles.filter(p => p.life > 0 && p.x > -80 && p.x < this.canvas.width + 80);

            this.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.vy += 0.2;
                p.life--; p.alpha -= (p.alphaDecay || 0.02);
            });
            this.particles = this.particles.filter(p => p.life > 0 && p.alpha > 0);

            this.effects = this.effects.filter(e => { e.life--; return e.life > 0; });

            this.pickups.forEach(pk => {
                if (!pk.grounded) {
                    pk.vy = (pk.vy || 0) + 0.3;
                    pk.y += pk.vy;
                    const gY = this.canvas.height - 118;
                    if (pk.y >= gY) { pk.y = gY; pk.vy = 0; pk.grounded = true; }
                }
                pk.life--;
                if (!pk.collected) {
                    this.players.forEach(pl => {
                        if (pl.health > 0 && this._hit(pl, { x:pk.x, y:pk.y, width:28, height:28 }))
                            this._collectPickup(pl, pk);
                    });
                }
            });
            this.pickups = this.pickups.filter(p => !p.collected && p.life > 0);

            this.projectiles.forEach(proj => {
                this.players.forEach(pl => {
                    if (pl.health > 0 && this._hit(pl, proj)) {
                        this._damagePlayer(pl, proj.damage);
                        proj.life = 0;
                        this._explode(proj.x, proj.y, 10);
                    }
                });
            });

            const aliveB = this.buildings.filter(b => !b.destroyed).length;
            this.cityDestruction = ((8 - aliveB) / 8) * 100;
            if (this.cityDestruction >= this.targetDestruction) this._nextLevel();
            if (this.players.filter(p => p.health > 0).length === 0) this._gameOver();

            this._updateHUD();
        }

        _updatePlayer(p) {
            const speed    = 2.8 * p.size;
            const climbSpd = 1.8;
            const GY_feet  = this.canvas.height - 100 - p.height;

            if (p.attackCooldown > 0) p.attackCooldown--;
            if (p.roarCooldown   > 0) p.roarCooldown--;
            if (p.hurtFlash      > 0) p.hurtFlash--;

            const mvL     = this.keys[p.controls.left];
            const mvR     = this.keys[p.controls.right];
            const pressU  = this.keys[p.controls.up];
            const pressD  = this.keys[p.controls.down];
            const pressAct = this.keys[p.controls.action] ||
                             (p.controls.action2 && this.keys[p.controls.action2]);

            if (mvR) p.facing =  1;
            if (mvL) p.facing = -1;

            if      (mvL) p.vx = -speed;
            else if (mvR) p.vx =  speed;
            else          p.vx *= 0.75;

            const nearB = this.buildings.find(b =>
                !b.destroyed &&
                p.x + p.width  > b.x - 12 &&
                p.x            < b.x + b.width + 12
            );

            // Climbing
            if (nearB && pressU) {
                p.climbing = true; p.climbingBuilding = nearB;
                p.y -= climbSpd; p.vy = 0;
                if (p.y < nearB.y) p.y = nearB.y;
            } else if (p.climbing && pressD) {
                p.y += climbSpd;
                if (p.y >= GY_feet) { p.y = GY_feet; p.climbing = false; p.climbingBuilding = null; }
            } else if (!pressU) {
                p.climbing = false; p.climbingBuilding = null;
            }

            // Jump (on ground, pressing up, no nearby building)
            if (p.onGround && pressU && !nearB) {
                const JUMP = { wolf:-14, godzilla:-9, kong:-13 };
                p.vy = JUMP[p.type] || -11;
                p.onGround = false;
            }

            // Attack trigger (proper cooldown, not random)
            if (pressAct && p.attackCooldown === 0) {
                p.attackCooldown = 30;
                this._spawnEffect(p, nearB);
            }
            // Active damage window: frames 21-30 of the 30-frame cooldown
            if (p.attackCooldown > 20 && nearB) {
                this._damageBuilding(nearB, p);
            }

            // Gravity
            if (!p.climbing) { p.vy += 0.55; p.y += p.vy; }

            // Ground collision
            if (p.y >= GY_feet) { p.y = GY_feet; p.vy = 0; p.onGround = true; }
            else                { p.onGround = false; }

            // Horizontal + boundaries
            p.x += p.vx;
            p.x = Math.max(0, Math.min(this.canvas.width - p.width, p.x));

            // Resolve animation state
            if      (p.attackCooldown > 0) p.animState = 'attack';
            else if (p.hurtFlash > 0)      p.animState = 'hurt';
            else if (p.climbing)           p.animState = 'climb';
            else if (!p.onGround)          p.animState = 'jump';
            else if (abs(p.vx) > 0.5)      p.animState = 'walk';
            else                           p.animState = 'idle';

            if (p.roarCooldown > 72)       p.animState = 'roar';

            p.animTime = performance.now();

            if (p.health < p.maxHealth) p.health += 0.007;
        }

        _spawnEffect(p, nearB) {
            const cx = p.x + p.width / 2 + p.facing * (p.width * 0.6);
            const cy = p.y + p.height * 0.45;
            const types = { wolf:'slash', godzilla:'breath', kong:'shockwave' };
            this.effects.push({ type:types[p.type]||'slash', x:cx, y:cy, facing:p.facing, life:22, maxLife:22 });

            // Roar when attacking in open (no building nearby)
            if (!nearB && p.roarCooldown === 0) {
                p.roarCooldown = 90;
                this._floatText(p.x + p.width / 2, p.y - 15, 'ROAR!', '#ffff00');
            }
        }

        _damageBuilding(b, p) {
            b.health -= 0.38 * p.size;

            if (Math.random() < 0.04) {
                const unb = b.windows.filter(w => !w.broken);
                if (unb.length) unb[Math.floor(Math.random() * unb.length)].broken = true;
            }

            if (Math.random() < 0.12) {
                this._debris(b.x + Math.random() * b.width, b.y + Math.random() * b.height * 0.5, 3, b.color);
            }

            // Pre-generate crack path (stored, not randomised in draw)
            if (Math.random() < 0.04 && b.cracks.length < 50) {
                const sx = b.x + Math.random() * b.width;
                const sy = b.y + Math.random() * b.height;
                const pts = [{ x:sx, y:sy }];
                for (let i = 0; i < 4; i++) {
                    const l = pts[pts.length - 1];
                    pts.push({ x: l.x + (Math.random() - 0.5) * 22, y: l.y + Math.random() * 14 + 4 });
                }
                b.cracks.push(pts);
            }

            if (Math.random() < 0.025) p.score += 10;

            if (b.health <= 0 && !b.destroyed) {
                b.destroyed = true; p.score += 500;
                this._explode(b.x + b.width / 2, b.y + b.height / 2, 45);
                for (let i = 0; i < 5; i++) {
                    this._spawnPickup(b.x + Math.random() * b.width, b.y + Math.random() * b.height * 0.5);
                }
            }
        }

        _spawnPickup(x, y) {
            const defs = [
                { type:'food',   label:'🍖', effect:'health', value:20, color:'#ff6b6b' },
                { type:'food',   label:'🍕', effect:'health', value:16, color:'#ffa502' },
                { type:'food',   label:'🍔', effect:'health', value:26, color:'#ff4757' },
                { type:'growth', label:'💊', effect:'size',   value:0.15, color:'#2ed573' },
                { type:'bomb',   label:'💣', effect:'damage', value:22, color:'#444444' }
            ];
            const def = defs[Math.floor(Math.random() * defs.length)];
            this.pickups.push({
                x: x !== undefined ? x : Math.random() * this.canvas.width,
                y: y !== undefined ? y : -30,
                vy:1.5, grounded:false, width:28, height:28,
                life:700, collected:false,
                glowPhase:Math.random() * PI * 2,
                ...def
            });
        }

        _collectPickup(pl, pk) {
            pk.collected = true;
            switch (pk.effect) {
                case 'health':
                    pl.health = Math.min(pl.health + pk.value, pl.maxHealth);
                    pl.score += 50;
                    this._floatText(pk.x, pk.y, '+' + pk.value + ' HP', '#00ff88');
                    break;
                case 'size':
                    if (pl.size < pl.maxSize) {
                        pl.size = Math.min(pl.size + pk.value, pl.maxSize);
                        pl.maxHealth += 15; pl.health += 15; pl.score += 100;
                        this._floatText(pk.x, pk.y, 'GROW!', '#2ed573');
                    }
                    break;
                case 'damage':
                    pl.health -= pk.value; pl.hurtFlash = 18;
                    this._explode(pk.x, pk.y, 12);
                    this._floatText(pk.x, pk.y, '-' + pk.value, '#ff3030');
                    break;
            }
        }

        _spawnMilitary() {
            if (!this.players.filter(p => p.health > 0).length) return;
            const dir = Math.random() < 0.5 ? 1 : -1;
            this.projectiles.push({
                x: dir === 1 ? -20 : this.canvas.width + 20,
                y: 60 + Math.random() * 320,
                width:24, height:9,
                vx: dir * (4.5 + this.level * 0.3),
                vy: 0.4 + Math.random() * 0.5,
                damage: 14 + this.level * 2,
                color:'#ff4757', life:260, isRocket:true
            });
        }

        _damagePlayer(p, dmg) { p.health = Math.max(0, p.health - dmg); p.hurtFlash = 16; }

        _debris(x, y, count, color) {
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x, y, vx:(Math.random()-0.5)*7, vy:-Math.random()*5-1,
                    size:Math.random()*5+2, color, life:55, alpha:1
                });
            }
        }

        _explode(x, y, count) {
            const cols = ['#ff4757','#ffa502','#ff6348','#ffdd59','#ff8c00'];
            for (let i = 0; i < count; i++) {
                const a = Math.random() * PI * 2, s = Math.random() * 8 + 2;
                this.particles.push({
                    x, y, vx:cos(a)*s, vy:sin(a)*s,
                    size:Math.random()*6+2,
                    color:cols[Math.floor(Math.random()*cols.length)],
                    life:35+Math.random()*20, alpha:1, alphaDecay:0.025
                });
            }
        }

        _floatText(x, y, text, color) {
            this.particles.push({ x, y, vx:0, vy:-1.4, text, color, life:75, alpha:1, alphaDecay:0.013 });
        }

        _hit(a, b) {
            return a.x < b.x + b.width  && a.x + a.width  > b.x &&
                   a.y < b.y + b.height && a.y + a.height > b.y;
        }

        _nextLevel() {
            this.level++; this.cityDestruction = 0;
            this._generateCity();
            this.players.forEach(p => { p.health = Math.min(p.health + 45, p.maxHealth); });
        }

        _gameOver() {
            this.state = 'gameover';
            const screen = document.getElementById('gameOverScreen');
            const scores = document.getElementById('finalScores');
            if (!screen) return;
            const icons = { wolf:'🐺', godzilla:'🦎', kong:'🦍' };
            const sorted = [...this.players].sort((a, b) => b.score - a.score);
            scores.innerHTML = '<h3>💀 FINAL SCORES 💀</h3>' +
                sorted.map((p, i) =>
                    `<div style="margin:8px 0;font-size:${i===0?'18px':'14px'};color:${p.color}">
                        ${i===0?'👑':(i+1)+'.'} ${icons[p.type]||''} ${p.name}: ${p.score} pts
                    </div>`
                ).join('');
            screen.classList.add('show');
        }

        /* ── DRAW ─────────────────────────────────────────────────── */
        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width, H = this.canvas.height;
            const now = performance.now();
            this._drawSky(ctx, W, H);
            this._drawGround(ctx, W, H);
            this._drawBuildings(ctx);
            this._drawPickups(ctx, now);
            this._drawProjectiles(ctx);
            this._drawEffects(ctx);
            this._drawParticles(ctx);
            this._drawPlayers(ctx);
            this._drawHUDOverlay(ctx, W);
        }

        _drawSky(ctx, W, H) {
            const sg = ctx.createLinearGradient(0, 0, 0, H - 100);
            sg.addColorStop(0,    '#08081e');
            sg.addColorStop(0.28, '#12204e');
            sg.addColorStop(0.62, '#285888');
            sg.addColorStop(1,    '#86aac6');
            ctx.fillStyle = sg;
            ctx.fillRect(0, 0, W, H - 100);

            // Sun glow
            const sunG = ctx.createRadialGradient(W-70, 55, 8, W-70, 55, 80);
            sunG.addColorStop(0,   'rgba(255,245,180,0.98)');
            sunG.addColorStop(0.25,'rgba(255,210,80,0.7)');
            sunG.addColorStop(0.6, 'rgba(255,150,50,0.3)');
            sunG.addColorStop(1,   'rgba(255,100,30,0)');
            ctx.fillStyle = sunG;
            ctx.beginPath(); ctx.arc(W-70, 55, 80, 0, PI*2); ctx.fill();

            // Clouds
            this.clouds.forEach(c => {
                ctx.save(); ctx.globalAlpha = 0.78;
                const cg = ctx.createRadialGradient(c.x,c.y,4,c.x,c.y,c.rx);
                cg.addColorStop(0,'rgba(255,255,255,0.92)'); cg.addColorStop(1,'rgba(200,220,255,0)');
                ctx.fillStyle = cg;
                ctx.beginPath(); ctx.ellipse(c.x,c.y,c.rx,c.ry,0,0,PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(c.x-c.rx*0.42,c.y+5,c.rx*0.58,c.ry*0.75,0,0,PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(c.x+c.rx*0.44,c.y+5,c.rx*0.52,c.ry*0.7,0,0,PI*2);  ctx.fill();
                ctx.globalAlpha = 1; ctx.restore();
            });
        }

        _drawGround(ctx, W, H) {
            const gTop = H - 100;

            // Asphalt base
            ctx.fillStyle = '#212121';
            ctx.fillRect(0, gTop, W, 100);

            // Road centre line
            ctx.save();
            ctx.setLineDash([32, 22]);
            ctx.strokeStyle = '#cc9900'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(0, gTop+58); ctx.lineTo(W, gTop+58); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Sidewalk
            ctx.fillStyle = '#414141'; ctx.fillRect(0, gTop, W, 9);
            ctx.fillStyle = '#646464'; ctx.fillRect(0, gTop, W, 2);

            // Grass strip
            const gg = ctx.createLinearGradient(0, gTop-2, 0, gTop+14);
            gg.addColorStop(0,'#2d7010'); gg.addColorStop(1,'#1e4a08');
            ctx.fillStyle = gg; ctx.fillRect(0, gTop-2, W, 14);

            // Grass blades
            ctx.strokeStyle = '#3a8515'; ctx.lineWidth = 1.5;
            for (let gx = 4; gx < W; gx += 7) {
                const lean = Math.sin(gx * 0.3) * 3;
                ctx.beginPath(); ctx.moveTo(gx, gTop+11); ctx.lineTo(gx+lean, gTop); ctx.stroke();
            }
        }

        _drawBuildings(ctx) {
            this.buildings.forEach(b => {
                if (b.destroyed) return;

                // 3-D gradient face
                const bG = ctx.createLinearGradient(b.x, b.y, b.x+b.width, b.y);
                bG.addColorStop(0,   lighten(b.color, 22));
                bG.addColorStop(0.5, b.color);
                bG.addColorStop(1,   darken(b.color, 25));
                ctx.fillStyle = bG; ctx.fillRect(b.x, b.y, b.width, b.height);

                // Outline
                ctx.strokeStyle = darken(b.color, 35); ctx.lineWidth = 2;
                ctx.strokeRect(b.x, b.y, b.width, b.height);

                // Pre-generated cracks
                if (b.cracks.length > 0) {
                    ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1.5;
                    b.cracks.forEach(crack => {
                        ctx.beginPath(); ctx.moveTo(crack[0].x, crack[0].y);
                        for (let i = 1; i < crack.length; i++) ctx.lineTo(crack[i].x, crack[i].y);
                        ctx.stroke();
                    });
                    ctx.restore();
                }

                // Windows
                b.windows.forEach(w => {
                    if (w.broken) {
                        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(b.x+w.x, b.y+w.y, w.width, w.height);
                        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(b.x+w.x, b.y+w.y); ctx.lineTo(b.x+w.x+w.width, b.y+w.y+w.height);
                        ctx.moveTo(b.x+w.x+w.width, b.y+w.y); ctx.lineTo(b.x+w.x, b.y+w.y+w.height);
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = darken(b.color, 8);
                        ctx.fillRect(b.x+w.x-2, b.y+w.y-2, w.width+4, w.height+4);
                        ctx.fillStyle = w.lit ? '#ffeb4a' : '#1a2535';
                        ctx.fillRect(b.x+w.x, b.y+w.y, w.width, w.height);
                        if (w.lit) {
                            ctx.fillStyle = 'rgba(255,230,80,0.2)';
                            ctx.fillRect(b.x+w.x-3, b.y+w.y-3, w.width+6, w.height+6);
                        }
                    }
                });

                // Antenna
                if (b.hasAntenna) {
                    ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(b.x+b.width/2, b.y); ctx.lineTo(b.x+b.width/2, b.y-b.antennaH); ctx.stroke();
                    ctx.fillStyle = '#cc2222';
                    ctx.beginPath(); ctx.arc(b.x+b.width/2, b.y-b.antennaH, 3.5, 0, PI*2); ctx.fill();
                }

                // Health bar
                const hp = b.health / b.maxHealth;
                ctx.fillStyle = '#111'; ctx.fillRect(b.x, b.y-10, b.width, 5);
                ctx.fillStyle = hp > 0.6 ? '#2ed573' : hp > 0.3 ? '#ffa502' : '#ff4757';
                ctx.fillRect(b.x, b.y-10, b.width * hp, 5);
            });
        }

        _drawPickups(ctx, now) {
            this.pickups.forEach(pk => {
                const pulse = 0.55 + 0.45 * Math.sin(now / 190 + pk.glowPhase);
                const gx = pk.x + 14, gy = pk.y + 14;
                ctx.save();
                ctx.globalAlpha = 0.45 * pulse;
                const halo = ctx.createRadialGradient(gx,gy,2,gx,gy,24);
                halo.addColorStop(0, pk.color); halo.addColorStop(1,'rgba(0,0,0,0)');
                ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(gx,gy,24,0,PI*2); ctx.fill();
                ctx.globalAlpha = 1;
                const orb = ctx.createRadialGradient(gx-4,gy-4,2,gx,gy,14);
                orb.addColorStop(0, lighten(pk.color, 45)); orb.addColorStop(1, pk.color);
                ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(gx,gy,13,0,PI*2); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.font = '13px Arial'; ctx.textAlign = 'center';
                ctx.fillText(pk.label, gx, gy+5); ctx.textAlign = 'left';
                ctx.restore();
            });
        }

        _drawProjectiles(ctx) {
            this.projectiles.forEach(proj => {
                if (proj.isRocket) {
                    ctx.save();
                    const angle = Math.atan2(proj.vy, proj.vx);
                    ctx.translate(proj.x + proj.width/2, proj.y + proj.height/2);
                    ctx.rotate(angle);
                    const fG = ctx.createLinearGradient(-proj.width,0,proj.width*0.3,0);
                    fG.addColorStop(0,'rgba(255,120,0,0)'); fG.addColorStop(0.6,'rgba(255,80,0,0.6)'); fG.addColorStop(1,'rgba(255,210,0,0.85)');
                    ctx.fillStyle = fG; ctx.fillRect(-proj.width,-5,proj.width*1.3,10);
                    ctx.fillStyle = '#b0b8c8'; ctx.fillRect(-proj.width*0.5,-5,proj.width,10);
                    ctx.fillStyle = '#e03030';
                    ctx.beginPath(); ctx.moveTo(proj.width*0.5,0); ctx.lineTo(proj.width*0.5+10,-3); ctx.lineTo(proj.width*0.5+10,3); ctx.fill();
                    ctx.restore();
                } else {
                    ctx.fillStyle = proj.color; ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
                }
            });
        }

        _drawEffects(ctx) {
            this.effects.forEach(e => {
                const frac = e.life / e.maxLife;
                const prog = 1 - frac;
                ctx.save(); ctx.globalAlpha = frac * frac;

                if (e.type === 'slash') {
                    ctx.strokeStyle = '#ff2020'; ctx.lineCap = 'round';
                    for (let i = -1; i <= 1; i++) {
                        ctx.lineWidth = 2.5 - abs(i) * 0.5;
                        ctx.beginPath();
                        ctx.moveTo(e.x + i*9, e.y - 18 + i*4);
                        ctx.quadraticCurveTo(e.x + e.facing*12 + i*6, e.y, e.x + e.facing*22 + i*5, e.y + 18 - i*4);
                        ctx.stroke();
                    }
                } else if (e.type === 'breath') {
                    const coneL = 25 + prog * 70;
                    const spread = 5 + coneL * 0.32;
                    const bG = ctx.createLinearGradient(e.x, e.y, e.x + e.facing * coneL, e.y);
                    bG.addColorStop(0,'rgba(255,210,0,0.95)'); bG.addColorStop(0.4,'rgba(255,100,0,0.7)'); bG.addColorStop(1,'rgba(255,30,0,0)');
                    ctx.fillStyle = bG;
                    ctx.beginPath(); ctx.moveTo(e.x,e.y-6); ctx.lineTo(e.x+e.facing*coneL,e.y-spread); ctx.lineTo(e.x+e.facing*coneL,e.y+spread); ctx.lineTo(e.x,e.y+6); ctx.fill();
                    ctx.globalAlpha *= 0.6;
                    ctx.fillStyle = 'rgba(255,255,200,0.9)';
                    ctx.beginPath(); ctx.ellipse(e.x+e.facing*15, e.y, 10, 6, 0, 0, PI*2); ctx.fill();
                } else if (e.type === 'shockwave') {
                    const r1 = prog * 90 + 10, r2 = prog * 58 + 5;
                    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 4 * frac;
                    ctx.beginPath(); ctx.arc(e.x, e.y+15, r1, 0, PI*2); ctx.stroke();
                    ctx.lineWidth = 2.5 * frac; ctx.strokeStyle = 'rgba(255,200,80,0.7)';
                    ctx.beginPath(); ctx.arc(e.x, e.y+15, r2, 0, PI*2); ctx.stroke();
                }

                ctx.globalAlpha = 1; ctx.restore();
            });
        }

        _drawParticles(ctx) {
            this.particles.forEach(p => {
                ctx.globalAlpha = Math.max(0, p.alpha);
                if (p.text) {
                    ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
                    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
                    ctx.strokeText(p.text, p.x, p.y);
                    ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
                    ctx.textAlign = 'left';
                } else if (p.size > 0) {
                    ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
                }
                ctx.globalAlpha = 1;
            });
        }

        _drawPlayers(ctx) {
            this.players.forEach(p => {
                if (p.health <= 0) return;
                const cx = p.x + p.width / 2;
                const cy = p.y + p.height;

                // Shadow
                ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.ellipse(cx, this.canvas.height-97, p.width*0.48, 7, 0, 0, PI*2); ctx.fill();
                ctx.globalAlpha = 1; ctx.restore();

                const opts = { facing:p.facing, animState:p.animState, animTime:p.animTime, hurtFlash:p.hurtFlash, attackCooldown:p.attackCooldown };
                if      (p.type === 'wolf')     drawFang(ctx, cx, cy, opts);
                else if (p.type === 'godzilla') drawGorath(ctx, cx, cy, opts);
                else if (p.type === 'kong')     drawKong(ctx, cx, cy, opts);

                // Health bar
                const bW = p.width + 12, bX = p.x - 6, bY = p.y - 20;
                const hp = p.health / p.maxHealth;
                ctx.fillStyle = '#111'; ctx.fillRect(bX, bY, bW, 7);
                ctx.fillStyle = hp > 0.5 ? '#2ed573' : hp > 0.25 ? '#ffa502' : '#ff4757';
                ctx.fillRect(bX, bY, bW * hp, 7);
                ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(bX, bY, bW, 7);

                // Name tag
                ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center';
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
                ctx.strokeText(p.name, cx, bY-3);
                ctx.fillStyle = p.color; ctx.fillText(p.name, cx, bY-3);
                ctx.textAlign = 'left';
            });
        }

        _drawHUDOverlay(ctx, W) {
            ctx.font = 'bold 19px Arial'; ctx.textAlign = 'left';
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.strokeText('LVL ' + this.level, 14, 32);
            ctx.fillStyle = '#ffffff'; ctx.fillText('LVL ' + this.level, 14, 32);

            const mW = 165, pct = this.cityDestruction / 100;
            ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(14, 40, mW, 14);
            ctx.fillStyle = pct > 0.7 ? '#ff4757' : pct > 0.4 ? '#ffa502' : '#2ed573';
            ctx.fillRect(14, 40, mW * pct, 14);
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(14, 40, mW, 14);
            ctx.font = '8px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
            ctx.fillText('CITY DESTRUCTION ' + Math.floor(this.cityDestruction) + '%', 14+mW/2, 51);
            ctx.textAlign = 'left';
        }

        _updateHUD() {
            this.players.forEach((p, i) => {
                const hBar = document.getElementById('p' + (i+1) + '-health');
                const sBar = document.getElementById('p' + (i+1) + '-size');
                const sc   = document.getElementById('p' + (i+1) + '-score');
                if (hBar) hBar.style.width = ((p.health / p.maxHealth) * 100) + '%';
                if (sBar) sBar.style.width = ((p.size   / p.maxSize)   * 100) + '%';
                if (sc)   sc.textContent = p.score;
            });
        }

        _gameLoop() {
            const now = performance.now();
            const dt  = now - this.lastTime;
            this.lastTime = now;
            this.update(dt);
            this.draw();
            requestAnimationFrame(() => this._gameLoop());
        }
    }

    window.addEventListener('load', () => { new MonsterRampageGame(); });

})();
