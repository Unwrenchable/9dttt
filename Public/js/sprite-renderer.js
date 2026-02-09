/**
 * Advanced Sprite Renderer - Enhanced Edition
 * Modern pixel-art style sprites with procedural generation
 * Combines retro aesthetics with modern polish
 * 
 * Enhanced Features:
 * - Realistic shading and depth
 * - Gradient colors for volume
 * - Improved animation smoothness
 * - Enhanced particle effects
 * - Better lighting and shadows
 */

class SpriteRenderer {
    constructor() {
        this.cache = new Map();
        this.animations = new Map();
        this.enableShading = true;
        this.enableGradients = true;
        this.enableShadows = true;
        
        // Configuration constants
        this.CACHE_FRAME_INTERVAL = 5; // Cache sprites every N frames for performance
        this.HAIR_HIGHLIGHT_COLOR = 'rgba(139, 69, 19, 0.5)';
    }

    /**
     * Draw a character sprite with improved graphics
     */
    drawCharacter(ctx, x, y, type, options = {}) {
        const {
            size = 32,
            facing = 'right',
            animation = 'idle',
            frame = 0,
            color = null
        } = options;

        const cacheKey = `${type}_${size}_${facing}_${animation}_${Math.floor(frame/this.CACHE_FRAME_INTERVAL)}_${color}`;

        // Use cached sprite if available
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            
            // Draw shadow if enabled
            if (this.enableShadows) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.ellipse(x, y + size * 0.1, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            // Draw sprite with facing direction
            if (facing === 'left') {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(cached, -(x + size/2), y - size, size, size * 1.5);
                ctx.restore();
            } else {
                ctx.drawImage(cached, x - size/2, y - size, size, size * 1.5);
            }
            return;
        }

        // Create offscreen canvas for sprite
        const sprite = document.createElement('canvas');
        sprite.width = size;
        sprite.height = size * 1.5;
        const sctx = sprite.getContext('2d');

        // Draw different character types
        switch(type) {
            case 'hero':
                this.drawHero(sctx, size, color || '#4A90E2', animation, frame);
                break;
            case 'enemy':
                this.drawEnemy(sctx, size, color || '#E74C3C', animation, frame);
                break;
            case 'boss':
                this.drawBoss(sctx, size, color || '#8E44AD', animation, frame);
                break;
            case 'ninja':
                this.drawNinja(sctx, size, color || '#2C3E50', animation, frame);
                break;
            case 'robot':
                this.drawRobot(sctx, size, color || '#95A5A6', animation, frame);
                break;
            case 'monster':
                this.drawMonster(sctx, size, color || '#27AE60', animation, frame);
                break;
            case 'samurai':
                this.drawSamurai(sctx, size, color || '#C0392B', animation, frame);
                break;
            default:
                this.drawHero(sctx, size, color || '#4A90E2', animation, frame);
        }

        // Draw shadow if enabled
        if (this.enableShadows) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(x, y + size * 0.1, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw sprite with facing direction
        if (facing === 'left') {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -(x + size/2), y - size, size, size * 1.5);
            ctx.restore();
        } else {
            ctx.drawImage(sprite, x - size/2, y - size, size, size * 1.5);
        }

        // Cache the sprite
        this.cache.set(cacheKey, sprite);
    }

    /**
     * Draw hero character with modern pixel art style - ENHANCED
     */
    drawHero(ctx, size, color, animation, frame) {
        const unit = size / 16;

        // Animated bob for idle
        const bob = animation === 'idle' ? Math.sin(frame * 0.1) * unit : 0;

        // Head with gradient for depth
        if (this.enableGradients) {
            const headGradient = ctx.createRadialGradient(8*unit, 5*unit + bob, 0, 8*unit, 5*unit + bob, 3*unit);
            headGradient.addColorStop(0, '#FFE4C4');
            headGradient.addColorStop(1, '#D4A574');
            ctx.fillStyle = headGradient;
        } else {
            ctx.fillStyle = '#FFD1A4'; // Skin tone
        }
        this.drawPixelRect(ctx, 6*unit, 3*unit + bob, 4*unit, 4*unit);

        // Hair with highlights
        if (this.enableGradients) {
            const hairGradient = ctx.createLinearGradient(5*unit, 2*unit + bob, 5*unit, 4*unit + bob);
            hairGradient.addColorStop(0, '#A0522D');
            hairGradient.addColorStop(1, '#6B3410');
            ctx.fillStyle = hairGradient;
        } else {
            ctx.fillStyle = '#8B4513';
        }
        this.drawPixelRect(ctx, 5*unit, 2*unit + bob, 6*unit, 2*unit);

        // Hair highlights
        ctx.fillStyle = this.HAIR_HIGHLIGHT_COLOR;
        this.drawPixelRect(ctx, 6*unit, 2.2*unit + bob, 2*unit, 0.5*unit);

        // Eyes with shine
        ctx.fillStyle = '#FFF';
        ctx.fillRect(7*unit, 5*unit + bob, unit * 1.2, unit * 1.2);
        ctx.fillRect(9*unit, 5*unit + bob, unit * 1.2, unit * 1.2);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(7.2*unit, 5.2*unit + bob, unit * 0.8, unit * 0.8);
        ctx.fillRect(9.2*unit, 5.2*unit + bob, unit * 0.8, unit * 0.8);
        
        // Eye shine
        ctx.fillStyle = '#FFF';
        ctx.fillRect(7.5*unit, 5.3*unit + bob, unit * 0.3, unit * 0.3);
        ctx.fillRect(9.5*unit, 5.3*unit + bob, unit * 0.3, unit * 0.3);

        // Body - superhero style with gradient
        if (this.enableGradients) {
            const bodyGradient = ctx.createLinearGradient(5*unit, 7*unit + bob, 11*unit, 13*unit + bob);
            bodyGradient.addColorStop(0, this.lightenColor(color, 20));
            bodyGradient.addColorStop(0.5, color);
            bodyGradient.addColorStop(1, this.darkenColor(color, 20));
            ctx.fillStyle = bodyGradient;
        } else {
            ctx.fillStyle = color;
        }
        this.drawPixelRect(ctx, 5*unit, 7*unit + bob, 6*unit, 6*unit);

        // Body shading for depth
        if (this.enableShading) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            this.drawPixelRect(ctx, 9*unit, 8*unit + bob, 2*unit, 4*unit);
        }

        // Chest emblem with glow
        if (this.enableShadows) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 8;
        }
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(8*unit, 10*unit + bob, 1.5*unit, 0, Math.PI * 2);
        ctx.fill();
        
        // Emblem highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(7.7*unit, 9.7*unit + bob, 0.8*unit, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Arms with muscle definition
        const armSwing = animation === 'walk' ? Math.sin(frame * 0.2) * unit * 2 : 0;
        
        if (this.enableGradients) {
            const armGradient = ctx.createLinearGradient(3*unit, 8*unit, 5*unit, 13*unit);
            armGradient.addColorStop(0, color);
            armGradient.addColorStop(1, this.darkenColor(color, 15));
            ctx.fillStyle = armGradient;
        } else {
            ctx.fillStyle = color;
        }
        this.drawPixelRect(ctx, 3*unit, 8*unit + bob + armSwing, 2*unit, 5*unit);
        this.drawPixelRect(ctx, 11*unit, 8*unit + bob - armSwing, 2*unit, 5*unit);

        // Gloves/hands
        ctx.fillStyle = '#2C3E50';
        this.drawPixelCircle(ctx, 4*unit, 13*unit + bob + armSwing, unit * 0.8);
        this.drawPixelCircle(ctx, 12*unit, 13*unit + bob - armSwing, unit * 0.8);

        // Legs with gradient
        ctx.fillStyle = '#2C3E50'; // Dark pants
        const legSwing = animation === 'walk' ? Math.sin(frame * 0.2) * unit : 0;
        this.drawPixelRect(ctx, 5.5*unit, 13*unit + legSwing, 2*unit, 6*unit);
        this.drawPixelRect(ctx, 8.5*unit, 13*unit - legSwing, 2*unit, 6*unit);

        // Leg shading
        if (this.enableShading) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.drawPixelRect(ctx, 9*unit, 14*unit - legSwing, 1.5*unit, 4*unit);
        }

        // Boots with shine
        ctx.fillStyle = '#34495E';
        this.drawPixelRect(ctx, 5*unit, 18*unit, 2.5*unit, 2*unit);
        this.drawPixelRect(ctx, 8.5*unit, 18*unit, 2.5*unit, 2*unit);
        
        // Boot highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.drawPixelRect(ctx, 5.2*unit, 18.2*unit, 0.8*unit, 0.5*unit);
        this.drawPixelRect(ctx, 8.7*unit, 18.2*unit, 0.8*unit, 0.5*unit);

        // Cape (flowing animation) with gradient
        if (animation === 'idle' || animation === 'walk') {
            const capeFlow = Math.sin(frame * 0.15) * unit * 0.5;
            
            if (this.enableGradients) {
                const capeGradient = ctx.createLinearGradient(6*unit, 7*unit, 5*unit, 15*unit);
                capeGradient.addColorStop(0, 'rgba(231, 76, 60, 0.9)');
                capeGradient.addColorStop(1, 'rgba(192, 57, 43, 0.8)');
                ctx.fillStyle = capeGradient;
            } else {
                ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
            }
            
            ctx.beginPath();
            ctx.moveTo(6*unit, 7*unit + bob);
            ctx.lineTo(4*unit + capeFlow, 15*unit);
            ctx.lineTo(5*unit + capeFlow, 15*unit);
            ctx.lineTo(7*unit, 7*unit + bob);
            ctx.fill();
            
            // Cape highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(6.2*unit, 7.5*unit + bob);
            ctx.lineTo(4.5*unit + capeFlow, 12*unit);
            ctx.lineTo(5*unit + capeFlow, 12*unit);
            ctx.lineTo(6.5*unit, 7.5*unit + bob);
            ctx.fill();
        }
    }

    /**
     * Draw enemy character - ENHANCED
     */
    drawEnemy(ctx, size, color, animation, frame) {
        const unit = size / 16;
        const bob = animation === 'idle' ? Math.sin(frame * 0.15) * unit : 0;

        // Head - more menacing with gradient
        if (this.enableGradients) {
            const headGradient = ctx.createRadialGradient(8*unit, 5*unit + bob, 0, 8*unit, 5*unit + bob, 3*unit);
            headGradient.addColorStop(0, '#34495E');
            headGradient.addColorStop(1, '#1C2833');
            ctx.fillStyle = headGradient;
        } else {
            ctx.fillStyle = '#2C3E50';
        }
        this.drawPixelRect(ctx, 6*unit, 3*unit + bob, 4*unit, 4*unit);

        // Evil eyes (glowing) with animation
        const eyeGlow = 0.7 + Math.sin(frame * 0.1) * 0.3;
        if (this.enableShadows) {
            ctx.shadowColor = '#E74C3C';
            ctx.shadowBlur = 10;
        }
        ctx.fillStyle = `rgba(231, 76, 60, ${eyeGlow})`;
        this.drawPixelCircle(ctx, 7*unit, 5*unit + bob, unit * 0.8);
        this.drawPixelCircle(ctx, 9*unit, 5*unit + bob, unit * 0.8);
        
        // Eye highlights
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        this.drawPixelCircle(ctx, 7.2*unit, 4.8*unit + bob, unit * 0.4);
        this.drawPixelCircle(ctx, 9.2*unit, 4.8*unit + bob, unit * 0.4);
        ctx.shadowBlur = 0;

        // Body - armored with gradient
        if (this.enableGradients) {
            const bodyGradient = ctx.createLinearGradient(5*unit, 7*unit + bob, 11*unit, 14*unit + bob);
            bodyGradient.addColorStop(0, this.lightenColor(color, 10));
            bodyGradient.addColorStop(0.5, color);
            bodyGradient.addColorStop(1, this.darkenColor(color, 15));
            ctx.fillStyle = bodyGradient;
        } else {
            ctx.fillStyle = color;
        }
        this.drawPixelRect(ctx, 5*unit, 7*unit + bob, 6*unit, 7*unit);

        // Armor plates with metallic effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.drawPixelRect(ctx, 5.5*unit, 8*unit + bob, 5*unit, unit);
        this.drawPixelRect(ctx, 5.5*unit, 10*unit + bob, 5*unit, unit);
        this.drawPixelRect(ctx, 5.5*unit, 12*unit + bob, 5*unit, unit);
        
        // Armor highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.drawPixelRect(ctx, 5.7*unit, 8.2*unit + bob, 4.6*unit, 0.3*unit);
        this.drawPixelRect(ctx, 5.7*unit, 10.2*unit + bob, 4.6*unit, 0.3*unit);
        this.drawPixelRect(ctx, 5.7*unit, 12.2*unit + bob, 4.6*unit, 0.3*unit);

        // Spiky shoulders with metallic shine
        ctx.fillStyle = '#95A5A6';
        this.drawPixelTriangle(ctx, 4*unit, 7*unit + bob, 2*unit);
        this.drawPixelTriangle(ctx, 12*unit, 7*unit + bob, 2*unit);
        
        // Shoulder highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.drawPixelTriangle(ctx, 4.3*unit, 7.2*unit + bob, 1*unit);
        this.drawPixelTriangle(ctx, 12.3*unit, 7.2*unit + bob, 1*unit);

        // Muscular arms
        const armThreat = animation === 'walk' ? Math.sin(frame * 0.25) * unit : 0;
        if (this.enableGradients) {
            const armGradient = ctx.createLinearGradient(3*unit, 8*unit, 5*unit, 13*unit);
            armGradient.addColorStop(0, this.darkenColor(color, 10));
            armGradient.addColorStop(1, this.darkenColor(color, 25));
            ctx.fillStyle = armGradient;
        } else {
            ctx.fillStyle = this.darkenColor(color, 15);
        }
        this.drawPixelRect(ctx, 3*unit, 8*unit + bob + armThreat, 2*unit, 5*unit);
        this.drawPixelRect(ctx, 11*unit, 8*unit + bob - armThreat, 2*unit, 5*unit);

        // Clawed hands
        ctx.fillStyle = '#34495E';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(3.2*unit + i*0.5*unit, 13*unit + bob + armThreat, 0.3*unit, unit);
            ctx.fillRect(11.2*unit + i*0.5*unit, 13*unit + bob - armThreat, 0.3*unit, unit);
        }

        // Legs with depth
        ctx.fillStyle = '#34495E';
        this.drawPixelRect(ctx, 6*unit, 14*unit, 2*unit, 6*unit);
        this.drawPixelRect(ctx, 8*unit, 14*unit, 2*unit, 6*unit);
        
        // Leg shading
        if (this.enableShading) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.drawPixelRect(ctx, 6.8*unit, 15*unit, 1.2*unit, 4*unit);
            this.drawPixelRect(ctx, 8.8*unit, 15*unit, 1.2*unit, 4*unit);
        }
    }

    /**
     * Draw boss character - larger and more detailed - ENHANCED
     */
    drawBoss(ctx, size, color, animation, frame) {
        const unit = size / 16;
        const breathe = Math.sin(frame * 0.1) * unit * 0.5;

        // Massive head with intimidating gradient
        if (this.enableGradients) {
            const headGradient = ctx.createRadialGradient(8*unit, 5*unit + breathe, 0, 8*unit, 5*unit + breathe, 5*unit);
            headGradient.addColorStop(0, this.lightenColor(color, 15));
            headGradient.addColorStop(0.6, color);
            headGradient.addColorStop(1, this.darkenColor(color, 20));
            ctx.fillStyle = headGradient;
        } else {
            ctx.fillStyle = color;
        }
        this.drawPixelRect(ctx, 4*unit, 2*unit + breathe, 8*unit, 6*unit);

        // Horns with shading
        ctx.fillStyle = '#000';
        this.drawPixelTriangle(ctx, 3*unit, 2*unit + breathe, 2*unit);
        this.drawPixelTriangle(ctx, 13*unit, 2*unit + breathe, 2*unit);
        
        // Horn highlights
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        this.drawPixelTriangle(ctx, 3.3*unit, 2.3*unit + breathe, 1*unit);
        this.drawPixelTriangle(ctx, 13.3*unit, 2.3*unit + breathe, 1*unit);

        // Glowing eyes with intense animation
        const eyePulse = 0.8 + Math.sin(frame * 0.15) * 0.2;
        if (this.enableShadows) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
        }
        ctx.fillStyle = `rgba(255, 215, 0, ${eyePulse})`;
        this.drawPixelCircle(ctx, 6*unit, 5*unit + breathe, unit * 1.2);
        this.drawPixelCircle(ctx, 10*unit, 5*unit + breathe, unit * 1.2);
        
        // Eye inner glow
        ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
        this.drawPixelCircle(ctx, 6*unit, 5*unit + breathe, unit * 0.6);
        this.drawPixelCircle(ctx, 10*unit, 5*unit + breathe, unit * 0.6);
        ctx.shadowBlur = 0;

        // Body - hulking with impressive muscles
        if (this.enableGradients) {
            const bodyGradient = ctx.createRadialGradient(8*unit, 12*unit + breathe, 2*unit, 8*unit, 12*unit + breathe, 7*unit);
            bodyGradient.addColorStop(0, this.lightenColor(color, 10));
            bodyGradient.addColorStop(0.5, color);
            bodyGradient.addColorStop(1, this.darkenColor(color, 25));
            ctx.fillStyle = bodyGradient;
        } else {
            ctx.fillStyle = color;
        }
        this.drawPixelRect(ctx, 3*unit, 8*unit + breathe, 10*unit, 8*unit);

        // Muscles with definition
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(8*unit, 12*unit + breathe, 3.5*unit, 2.5*unit, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Muscle highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.ellipse(7*unit, 11*unit + breathe, 2*unit, 1.5*unit, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Chest armor/scars
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = unit * 0.3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(5*unit, (9 + i*2)*unit + breathe);
            ctx.lineTo(11*unit, (9 + i*2)*unit + breathe);
            ctx.stroke();
        }

        // Massive shoulders
        if (this.enableGradients) {
            const shoulderGradient = ctx.createRadialGradient(4*unit, 9*unit, 0, 4*unit, 9*unit, 3*unit);
            shoulderGradient.addColorStop(0, this.lightenColor(color, 5));
            shoulderGradient.addColorStop(1, this.darkenColor(color, 20));
            ctx.fillStyle = shoulderGradient;
        } else {
            ctx.fillStyle = this.darkenColor(color, 10);
        }
        this.drawPixelCircle(ctx, 4*unit, 9*unit + breathe, 2*unit);
        this.drawPixelCircle(ctx, 12*unit, 9*unit + breathe, 2*unit);

        // Heavy legs with shading
        ctx.fillStyle = '#2C3E50';
        this.drawPixelRect(ctx, 4*unit, 16*unit, 3*unit, 5*unit);
        this.drawPixelRect(ctx, 9*unit, 16*unit, 3*unit, 5*unit);
        
        if (this.enableShading) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.drawPixelRect(ctx, 5.5*unit, 17*unit, 1.5*unit, 3*unit);
            this.drawPixelRect(ctx, 10.5*unit, 17*unit, 1.5*unit, 3*unit);
        }
        
        // Heavy boots
        ctx.fillStyle = '#1A252F';
        this.drawPixelRect(ctx, 3.5*unit, 20*unit, 3.5*unit, 1.5*unit);
        this.drawPixelRect(ctx, 8.5*unit, 20*unit, 3.5*unit, 1.5*unit);
    }

    /**
     * Draw ninja character
     */
    drawNinja(ctx, size, color, animation, frame) {
        const unit = size / 16;
        const crouch = animation === 'crouch' ? unit * 2 : 0;

        // Head wrap/mask
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 6*unit, 3*unit + crouch, 4*unit, 4*unit);

        // Eyes showing through mask
        ctx.fillStyle = '#FFF';
        ctx.fillRect(7*unit, 5*unit + crouch, unit, unit * 0.5);
        ctx.fillRect(9*unit, 5*unit + crouch, unit, unit * 0.5);

        // Stealthy body
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 5*unit, 7*unit + crouch, 6*unit, 6*unit);

        // Belt with tools
        ctx.fillStyle = '#E67E22';
        this.drawPixelRect(ctx, 5*unit, 11*unit + crouch, 6*unit, unit);

        // Sword on back
        ctx.strokeStyle = '#95A5A6';
        ctx.lineWidth = unit * 0.5;
        ctx.beginPath();
        ctx.moveTo(9*unit, 6*unit + crouch);
        ctx.lineTo(11*unit, 12*unit + crouch);
        ctx.stroke();

        // Legs in action pose
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 5*unit, 13*unit + crouch, 2*unit, 6*unit);
        this.drawPixelRect(ctx, 9*unit, 13*unit + crouch, 2*unit, 6*unit);
    }

    /**
     * Draw robot character
     */
    drawRobot(ctx, size, color, animation, frame) {
        const unit = size / 16;
        const beep = frame % 60 < 30 ? 1 : 0.5;

        // Head - boxy robot
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 6*unit, 3*unit, 4*unit, 3*unit);

        // Antenna
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(7.5*unit, 1*unit, unit, 2*unit);
        this.drawPixelCircle(ctx, 8*unit, unit, unit);

        // LED eyes
        ctx.fillStyle = `rgba(46, 204, 113, ${beep})`;
        ctx.shadowColor = '#2ECC71';
        ctx.shadowBlur = 5;
        ctx.fillRect(7*unit, 4.5*unit, unit, unit);
        ctx.fillRect(9*unit, 4.5*unit, unit, unit);
        ctx.shadowBlur = 0;

        // Body - mechanical
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 5*unit, 6*unit, 6*unit, 7*unit);

        // Chest panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.drawPixelRect(ctx, 6*unit, 8*unit, 4*unit, 3*unit);

        // Panel lights
        ctx.fillStyle = `rgba(52, 152, 219, ${Math.random()})`;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(6.5*unit + i*unit, 9*unit, unit * 0.5, unit * 0.5);
        }

        // Legs - pistons
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 6*unit, 13*unit, 2*unit, 6*unit);
        this.drawPixelRect(ctx, 8*unit, 13*unit, 2*unit, 6*unit);

        // Joints
        ctx.fillStyle = '#34495E';
        this.drawPixelCircle(ctx, 7*unit, 13*unit, unit);
        this.drawPixelCircle(ctx, 9*unit, 13*unit, unit);
    }

    /**
     * Draw monster character
     */
    drawMonster(ctx, size, color, animation, frame) {
        const unit = size / 16;
        const growl = Math.sin(frame * 0.2) * unit * 0.3;

        // Large head
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 5*unit, 2*unit + growl, 6*unit, 6*unit);

        // Horns/spikes
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = '#2C3E50';
            ctx.beginPath();
            ctx.moveTo((5 + i*2)*unit, 2*unit + growl);
            ctx.lineTo((5.5 + i*2)*unit, growl);
            ctx.lineTo((6 + i*2)*unit, 2*unit + growl);
            ctx.fill();
        }

        // Big eyes
        ctx.fillStyle = '#FFF';
        this.drawPixelCircle(ctx, 6.5*unit, 5*unit + growl, unit * 1.2);
        this.drawPixelCircle(ctx, 9.5*unit, 5*unit + growl, unit * 1.2);

        ctx.fillStyle = '#000';
        this.drawPixelCircle(ctx, 6.5*unit, 5*unit + growl, unit * 0.7);
        this.drawPixelCircle(ctx, 9.5*unit, 5*unit + growl, unit * 0.7);

        // Sharp teeth
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo((5.5 + i*unit)*unit, 7*unit + growl);
            ctx.lineTo((5.7 + i*unit)*unit, 7.8*unit + growl);
            ctx.lineTo((6 + i*unit)*unit, 7*unit + growl);
            ctx.fill();
        }

        // Body
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 4*unit, 8*unit, 8*unit, 6*unit);

        // Belly
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(8*unit, 11*unit, 3*unit, 2*unit, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 5*unit, 14*unit, 2.5*unit, 5*unit);
        this.drawPixelRect(ctx, 8.5*unit, 14*unit, 2.5*unit, 5*unit);

        // Claws
        ctx.fillStyle = '#34495E';
        for (let leg = 0; leg < 2; leg++) {
            for (let claw = 0; claw < 3; claw++) {
                ctx.fillRect((5 + leg*3.5 + claw*0.7)*unit, 18.5*unit, unit*0.5, unit);
            }
        }
    }

    /**
     * Draw samurai character
     */
    drawSamurai(ctx, size, color, animation, frame) {
        const unit = size / 16;

        // Helmet
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 5*unit, 2*unit, 6*unit, 3*unit);

        // Helmet ornament
        ctx.fillStyle = '#FFD700';
        this.drawPixelCircle(ctx, 8*unit, 2*unit, unit);

        // Face (partially visible)
        ctx.fillStyle = '#FFD1A4';
        this.drawPixelRect(ctx, 6.5*unit, 5*unit, 3*unit, 2*unit);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(7*unit, 5.5*unit, unit * 0.5, unit * 0.5);
        ctx.fillRect(8.5*unit, 5.5*unit, unit * 0.5, unit * 0.5);

        // Armor body
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 5*unit, 7*unit, 6*unit, 7*unit);

        // Armor plates (detailed)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = unit * 0.2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(5*unit, (8 + i*1.5)*unit);
            ctx.lineTo(11*unit, (8 + i*1.5)*unit);
            ctx.stroke();
        }

        // Katana (signature weapon)
        ctx.strokeStyle = '#ECF0F1';
        ctx.lineWidth = unit * 0.3;
        ctx.beginPath();
        ctx.moveTo(11*unit, 9*unit);
        ctx.lineTo(14*unit, 6*unit);
        ctx.stroke();

        // Katana handle
        ctx.fillStyle = '#8B4513';
        this.drawPixelRect(ctx, 10.5*unit, 8.5*unit, unit, 2*unit);

        // Legs
        ctx.fillStyle = color;
        this.drawPixelRect(ctx, 6*unit, 14*unit, 2*unit, 6*unit);
        this.drawPixelRect(ctx, 8*unit, 14*unit, 2*unit, 6*unit);
    }

    /**
     * Helper: Draw pixel-perfect rectangle
     */
    drawPixelRect(ctx, x, y, w, h) {
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
    }

    /**
     * Helper: Draw pixel-perfect circle
     */
    drawPixelCircle(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(Math.floor(x), Math.floor(y), Math.ceil(r), 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Helper: Draw triangle
     */
    drawPixelTriangle(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size/2, y - size);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Helper: Lighten a color by percentage
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    /**
     * Helper: Darken a color by percentage
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    /**
     * Draw particle effect - ENHANCED
     */
    drawParticle(ctx, x, y, type, age, maxAge) {
        const alpha = 1 - (age / maxAge);
        const progress = age / maxAge;

        switch(type) {
            case 'hit':
                // Enhanced hit effect with multiple layers
                if (this.enableShadows) {
                    ctx.shadowColor = 'rgba(255, 68, 68, 0.6)';
                    ctx.shadowBlur = 8;
                }
                
                // Outer ring
                ctx.fillStyle = `rgba(255, 100, 100, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(x, y, 8 * progress * 2.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner bright core
                ctx.fillStyle = `rgba(255, 200, 200, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, 4 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                break;
                
            case 'explosion':
                // More dramatic explosion with gradient
                const expSize = 15 + (progress * 30);
                
                if (this.enableGradients) {
                    const explGradient = ctx.createRadialGradient(x, y, 0, x, y, expSize);
                    explGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
                    explGradient.addColorStop(0.3, `rgba(255, 150, 0, ${alpha * 0.9})`);
                    explGradient.addColorStop(0.6, `rgba(255, 80, 0, ${alpha * 0.5})`);
                    explGradient.addColorStop(1, `rgba(100, 40, 0, 0)`);
                    ctx.fillStyle = explGradient;
                } else {
                    ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
                }
                
                ctx.beginPath();
                ctx.arc(x, y, expSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Add spark particles
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i;
                    const dist = expSize * 0.8;
                    const sx = x + Math.cos(angle) * dist;
                    const sy = y + Math.sin(angle) * dist;
                    ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.8})`;
                    ctx.fillRect(sx - 2, sy - 2, 4, 4);
                }
                break;
                
            case 'sparkle':
                // Enhanced sparkle with glow
                if (this.enableShadows) {
                    ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
                    ctx.shadowBlur = 6;
                }
                
                ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                const sparkSize = 3 + Math.sin(progress * Math.PI) * 2;
                
                // Star shape
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(progress * Math.PI * 2);
                ctx.fillRect(-sparkSize, -1, sparkSize * 2, 2);
                ctx.fillRect(-1, -sparkSize, 2, sparkSize * 2);
                ctx.restore();
                
                ctx.shadowBlur = 0;
                break;
                
            case 'smoke':
                // Realistic smoke with fade
                const smokeSize = 10 + (progress * 15);
                const smokeY = y - (progress * 30);
                
                if (this.enableGradients) {
                    const smokeGradient = ctx.createRadialGradient(x, smokeY, 0, x, smokeY, smokeSize);
                    smokeGradient.addColorStop(0, `rgba(100, 100, 100, ${alpha * 0.6})`);
                    smokeGradient.addColorStop(0.5, `rgba(80, 80, 80, ${alpha * 0.3})`);
                    smokeGradient.addColorStop(1, `rgba(60, 60, 60, 0)`);
                    ctx.fillStyle = smokeGradient;
                } else {
                    ctx.fillStyle = `rgba(128, 128, 128, ${alpha * 0.5})`;
                }
                
                ctx.beginPath();
                ctx.arc(x, smokeY, smokeSize, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'blood':
                // Realistic blood droplets
                ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`;
                const dropSize = 3 + Math.random() * 2;
                ctx.beginPath();
                ctx.ellipse(x, y, dropSize, dropSize * 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Blood trail
                ctx.fillStyle = `rgba(139, 0, 0, ${alpha * 0.3})`;
                ctx.fillRect(x - 1, y - progress * 5, 2, progress * 5);
                break;
                
            case 'energy':
                // Energy orb with pulsing glow
                const energyPulse = 0.8 + Math.sin(age * 0.3) * 0.2;
                
                if (this.enableShadows) {
                    ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
                    ctx.shadowBlur = 12;
                }
                
                if (this.enableGradients) {
                    const energyGradient = ctx.createRadialGradient(x, y, 0, x, y, 8 * energyPulse);
                    energyGradient.addColorStop(0, `rgba(200, 240, 255, ${alpha})`);
                    energyGradient.addColorStop(0.5, `rgba(0, 200, 255, ${alpha * 0.8})`);
                    energyGradient.addColorStop(1, `rgba(0, 100, 200, 0)`);
                    ctx.fillStyle = energyGradient;
                } else {
                    ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
                }
                
                ctx.beginPath();
                ctx.arc(x, y, 6 * energyPulse, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                break;
        }
    }

    /**
     * Clear cache (call when switching levels/games)
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export as global
if (typeof window !== 'undefined') {
    window.SpriteRenderer = SpriteRenderer;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteRenderer;
}
