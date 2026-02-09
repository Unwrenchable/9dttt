/**
 * Enhanced Visual Effects Library
 * Provides advanced visual effects for 9DTTT games
 * 
 * Features:
 * - Advanced lighting effects
 * - Dynamic shadows
 * - Glow and bloom effects
 * - Screen distortion effects
 * - Weather effects (rain, snow, fog)
 * - Impact effects
 */

class VisualEffects {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.effects = [];
        this.lighting = {
            ambient: 0.3,
            sources: []
        };
    }

    /**
     * Add dynamic lighting source
     */
    addLight(x, y, radius, color, intensity = 1.0) {
        this.lighting.sources.push({
            x, y, radius, color, intensity,
            flicker: Math.random() * 0.1
        });
    }

    /**
     * Clear all lighting sources
     */
    clearLights() {
        this.lighting.sources = [];
    }

    /**
     * Apply lighting overlay to scene
     * @param {number} frameCount - Current animation frame number for flicker effects
     */
    applyLighting(frameCount = 0) {
        if (this.lighting.sources.length === 0) return;

        const ctx = this.ctx;
        const { width, height } = this.canvas;

        // Create lighting overlay
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.lighting.ambient})`;
        ctx.fillRect(0, 0, width, height);

        // Add light sources
        ctx.globalCompositeOperation = 'lighter';
        this.lighting.sources.forEach(light => {
            const flicker = light.flicker * Math.sin(frameCount * 0.1);
            const intensity = light.intensity + flicker;
            
            const gradient = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            
            gradient.addColorStop(0, `rgba(${this.hexToRgb(light.color)}, ${intensity})`);
            gradient.addColorStop(0.5, `rgba(${this.hexToRgb(light.color)}, ${intensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    /**
     * Create glow effect around object
     */
    drawGlow(x, y, size, color, intensity = 1.0) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = size * intensity;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5 * intensity;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Create realistic shadow for object
     */
    drawRealisticShadow(x, y, width, height, direction = 'down', opacity = 0.5) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        
        if (direction === 'down') {
            // Ground shadow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, width * 0.8);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(x, y, width * 0.6, height * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Directional shadow
            const angle = direction === 'right' ? 0 : Math.PI;
            const shadowX = x + Math.cos(angle) * width * 0.5;
            const shadowY = y + height * 0.3;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(shadowX, shadowY, width * 0.4, height * 0.8, angle * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    /**
     * Create motion blur effect
     */
    drawMotionBlur(x, y, width, height, velocityX, velocityY, color) {
        const ctx = this.ctx;
        const blur = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        if (blur < 2) return; // Skip if too slow
        
        ctx.save();
        const gradient = ctx.createLinearGradient(
            x - velocityX, y - velocityY,
            x, y
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, color);
        
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = gradient;
        ctx.fillRect(x - velocityX, y - velocityY, width, height);
        ctx.restore();
    }

    /**
     * Create impact wave effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} maxRadius - Maximum radius in pixels (default: 100)
     * @param {number} duration - Duration in milliseconds (default: 500)
     */
    createImpactWave(x, y, maxRadius = 100, duration = 500) {
        this.effects.push({
            type: 'impact',
            x, y, maxRadius, duration,
            startTime: Date.now(),
            color: '#FFD700'
        });
    }

    /**
     * Create energy pulse effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Hex color code (default: '#00FFFF')
     * @param {number} count - Number of pulses (default: 3)
     */
    createEnergyPulse(x, y, color = '#00FFFF', count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.effects.push({
                    type: 'pulse',
                    x, y,
                    maxRadius: 80,
                    duration: 800,
                    startTime: Date.now(),
                    color: color
                });
            }, i * 150);
        }
    }

    /**
     * Create screen shake effect
     * @param {number} intensity - Shake intensity in pixels (default: 10)
     * @param {number} duration - Duration in milliseconds (default: 300)
     */
    createScreenShake(intensity = 10, duration = 300) {
        this.effects.push({
            type: 'shake',
            intensity,
            duration,
            startTime: Date.now()
        });
    }

    /**
     * Apply all active effects
     */
    update() {
        const now = Date.now();
        const ctx = this.ctx;

        // Update and render effects
        this.effects = this.effects.filter(effect => {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;

            if (progress >= 1) return false; // Remove completed effects

            switch (effect.type) {
                case 'impact':
                    this.renderImpactWave(effect, progress);
                    break;
                case 'pulse':
                    this.renderEnergyPulse(effect, progress);
                    break;
            }

            return true;
        });

        return this.getShakeOffset();
    }

    /**
     * Get current screen shake offset
     */
    getShakeOffset() {
        const shake = this.effects.find(e => e.type === 'shake');
        if (!shake) return { x: 0, y: 0 };

        const elapsed = Date.now() - shake.startTime;
        const progress = elapsed / shake.duration;
        if (progress >= 1) return { x: 0, y: 0 };

        const intensity = shake.intensity * (1 - progress);
        return {
            x: (Math.random() - 0.5) * intensity * 2,
            y: (Math.random() - 0.5) * intensity * 2
        };
    }

    /**
     * Render impact wave effect
     */
    renderImpactWave(effect, progress) {
        const ctx = this.ctx;
        const radius = effect.maxRadius * progress;
        const alpha = 1 - progress;

        ctx.save();
        ctx.strokeStyle = effect.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3 + (1 - progress) * 5;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner ring
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Render energy pulse effect
     */
    renderEnergyPulse(effect, progress) {
        const ctx = this.ctx;
        const radius = effect.maxRadius * Math.sin(progress * Math.PI);
        const alpha = Math.sin(progress * Math.PI);

        ctx.save();
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
            effect.x, effect.y, 0,
            effect.x, effect.y, radius
        );
        gradient.addColorStop(0, `rgba(${this.hexToRgb(effect.color)}, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(${this.hexToRgb(effect.color)}, ${alpha * 0.4})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Create rain effect
     */
    createRain(density = 50) {
        const { width, height } = this.canvas;
        const drops = [];

        for (let i = 0; i < density; i++) {
            drops.push({
                x: Math.random() * width,
                y: Math.random() * height,
                length: 10 + Math.random() * 10,
                speed: 5 + Math.random() * 5,
                opacity: 0.3 + Math.random() * 0.4
            });
        }

        return drops;
    }

    /**
     * Draw rain drops
     */
    drawRain(drops) {
        const ctx = this.ctx;
        const { height } = this.canvas;

        ctx.save();
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = 1;

        drops.forEach(drop => {
            ctx.globalAlpha = drop.opacity;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();

            // Update position
            drop.y += drop.speed;
            if (drop.y > height) {
                drop.y = -drop.length;
                drop.x = Math.random() * this.canvas.width;
            }
        });

        ctx.restore();
    }

    /**
     * Create snow effect
     */
    createSnow(density = 100) {
        const { width, height } = this.canvas;
        const flakes = [];

        for (let i = 0; i < density; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 1 + Math.random() * 3,
                speed: 1 + Math.random() * 2,
                drift: (Math.random() - 0.5) * 0.5,
                opacity: 0.5 + Math.random() * 0.5
            });
        }

        return flakes;
    }

    /**
     * Draw snow flakes
     */
    drawSnow(flakes, frame) {
        const ctx = this.ctx;
        const { width, height } = this.canvas;

        ctx.save();
        ctx.fillStyle = '#FFF';

        flakes.forEach(flake => {
            ctx.globalAlpha = flake.opacity;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            ctx.fill();

            // Update position
            flake.y += flake.speed;
            flake.x += flake.drift + Math.sin(frame * 0.01 + flake.y) * 0.5;

            if (flake.y > height) {
                flake.y = -flake.radius;
                flake.x = Math.random() * width;
            }
            if (flake.x < 0) flake.x = width;
            if (flake.x > width) flake.x = 0;
        });

        ctx.restore();
    }

    /**
     * Helper: Convert hex color to RGB string
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result 
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '255, 255, 255';
    }

    /**
     * Clear all effects
     */
    clear() {
        this.effects = [];
        this.clearLights();
    }
}

// Export as global
if (typeof window !== 'undefined') {
    window.VisualEffects = VisualEffects;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualEffects;
}
