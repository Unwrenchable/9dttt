/**
 * Advanced Graphics Enhancement System
 * Goes beyond basic shading/shadows with:
 * - Dynamic lighting and shadows
 * - Particle systems
 * - Post-processing effects
 * - Texture generation
 * - Advanced animations
 */

class AdvancedGraphics {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Feature toggles for performance
        this.enableDynamicLighting = true;
        this.enableParticles = true;
        this.enablePostProcessing = true;
        this.enableTextures = true;
        this.enableAdvancedAnimations = true;
        
        // Lighting system
        this.lights = [];
        this.ambientLight = 0.3;
        
        // Particle systems
        this.particleSystems = [];
        
        // Texture cache
        this.textureCache = new Map();
        
        // Post-processing
        this.bloomIntensity = 0.5;
        this.scanlineIntensity = 0.1;
        
        // Animation frame counter
        this.frame = 0;
    }

    /**
     * DYNAMIC LIGHTING SYSTEM
     * Creates realistic lighting with multiple light sources
     */
    
    addLight(x, y, radius, color, intensity = 1.0, flickerAmount = 0) {
        this.lights.push({
            x, y, radius, color, intensity, flickerAmount,
            baseIntensity: intensity,
            flickerOffset: Math.random() * Math.PI * 2
        });
        return this.lights.length - 1;
    }
    
    removeLight(index) {
        this.lights.splice(index, 1);
    }
    
    updateLights(deltaTime = 0.016) {
        this.lights.forEach(light => {
            if (light.flickerAmount > 0) {
                light.flickerOffset += deltaTime * 5;
                light.intensity = light.baseIntensity + 
                    Math.sin(light.flickerOffset) * light.flickerAmount;
            }
        });
    }
    
    renderLighting() {
        if (!this.enableDynamicLighting || this.lights.length === 0) return;
        
        // Create lighting layer
        const lightingCanvas = document.createElement('canvas');
        lightingCanvas.width = this.canvas.width;
        lightingCanvas.height = this.canvas.height;
        const lightCtx = lightingCanvas.getContext('2d');
        
        // Fill with ambient darkness
        lightCtx.fillStyle = `rgba(0, 0, 0, ${1 - this.ambientLight})`;
        lightCtx.fillRect(0, 0, lightingCanvas.width, lightingCanvas.height);
        
        // Add each light source
        lightCtx.globalCompositeOperation = 'destination-out';
        
        this.lights.forEach(light => {
            const gradient = lightCtx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            
            const alpha = light.intensity;
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            lightCtx.fillStyle = gradient;
            lightCtx.fillRect(
                light.x - light.radius, 
                light.y - light.radius,
                light.radius * 2, 
                light.radius * 2
            );
        });
        
        // Apply lighting layer
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.drawImage(lightingCanvas, 0, 0);
        this.ctx.restore();
    }

    /**
     * PROCEDURAL TEXTURE GENERATION
     * Create realistic textures without images
     */
    
    generateTexture(type, width, height, options = {}) {
        const cacheKey = `${type}_${width}_${height}_${JSON.stringify(options)}`;
        
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        switch (type) {
            case 'brick':
                this.drawBrickTexture(ctx, width, height, options);
                break;
            case 'metal':
                this.drawMetalTexture(ctx, width, height, options);
                break;
            case 'wood':
                this.drawWoodTexture(ctx, width, height, options);
                break;
            case 'concrete':
                this.drawConcreteTexture(ctx, width, height, options);
                break;
            case 'grass':
                this.drawGrassTexture(ctx, width, height, options);
                break;
            case 'water':
                this.drawWaterTexture(ctx, width, height, options);
                break;
            default:
                ctx.fillStyle = options.color || '#888';
                ctx.fillRect(0, 0, width, height);
        }
        
        this.textureCache.set(cacheKey, canvas);
        return canvas;
    }
    
    drawBrickTexture(ctx, width, height, options) {
        const brickColor = options.color || '#8B4513';
        const mortarColor = '#AAA';
        const brickWidth = 60;
        const brickHeight = 20;
        const mortarSize = 2;
        
        // Base
        ctx.fillStyle = mortarColor;
        ctx.fillRect(0, 0, width, height);
        
        // Bricks with offset pattern
        for (let y = 0; y < height; y += brickHeight + mortarSize) {
            const offset = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2);
            
            for (let x = -brickWidth; x < width; x += brickWidth + mortarSize) {
                const brickX = x + offset;
                
                // Add variation
                const variation = (Math.sin(brickX * 0.1) * Math.cos(y * 0.1)) * 10;
                ctx.fillStyle = this.adjustBrightness(brickColor, variation);
                
                ctx.fillRect(brickX, y, brickWidth, brickHeight);
                
                // Add texture detail
                ctx.fillStyle = this.adjustBrightness(brickColor, -10);
                ctx.fillRect(brickX + 2, y + 2, brickWidth - 4, 2);
            }
        }
    }
    
    drawMetalTexture(ctx, width, height, options) {
        const baseColor = options.color || '#4A5568';
        
        // Base metallic gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, this.adjustBrightness(baseColor, 20));
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, this.adjustBrightness(baseColor, -20));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add scratches and wear
        ctx.strokeStyle = this.adjustBrightness(baseColor, -30);
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Add highlight shine
        ctx.strokeStyle = this.adjustBrightness(baseColor, 60);
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const y = Math.random() * height;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.globalAlpha = 0.2;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    
    drawWoodTexture(ctx, width, height, options) {
        const woodColor = options.color || '#8B6F47';
        
        // Base wood color
        ctx.fillStyle = woodColor;
        ctx.fillRect(0, 0, width, height);
        
        // Wood grain lines
        ctx.strokeStyle = this.adjustBrightness(woodColor, -20);
        ctx.lineWidth = 2;
        
        for (let y = 0; y < height; y += 3) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            
            // Create wavy grain pattern
            for (let x = 0; x < width; x += 5) {
                const waveY = y + Math.sin(x * 0.1) * 2;
                ctx.lineTo(x, waveY);
            }
            
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Add knots
        for (let i = 0; i < 3; i++) {
            const kx = Math.random() * width;
            const ky = Math.random() * height;
            const knotGradient = ctx.createRadialGradient(kx, ky, 0, kx, ky, 15);
            knotGradient.addColorStop(0, this.adjustBrightness(woodColor, -40));
            knotGradient.addColorStop(1, woodColor);
            ctx.fillStyle = knotGradient;
            ctx.beginPath();
            ctx.arc(kx, ky, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawConcreteTexture(ctx, width, height, options) {
        const baseColor = options.color || '#808080';
        
        // Base
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, width, height);
        
        // Add noise/grain
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 40;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add cracks
        ctx.strokeStyle = this.adjustBrightness(baseColor, -30);
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            let x = Math.random() * width;
            let y = Math.random() * height;
            ctx.moveTo(x, y);
            
            for (let j = 0; j < 10; j++) {
                x += (Math.random() - 0.5) * 20;
                y += (Math.random() - 0.5) * 20;
                ctx.lineTo(x, y);
            }
            
            ctx.globalAlpha = 0.5;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    
    drawGrassTexture(ctx, width, height, options) {
        const grassColor = options.color || '#4A7C2E';
        
        // Base
        ctx.fillStyle = grassColor;
        ctx.fillRect(0, 0, width, height);
        
        // Grass blades
        ctx.strokeStyle = this.adjustBrightness(grassColor, 20);
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const bladeHeight = 5 + Math.random() * 10;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 2, y - bladeHeight);
            ctx.globalAlpha = 0.6;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    
    drawWaterTexture(ctx, width, height, options) {
        const waterColor = options.color || '#1E90FF';
        
        // Animated water - base gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, this.adjustBrightness(waterColor, 20));
        gradient.addColorStop(0.5, waterColor);
        gradient.addColorStop(1, this.adjustBrightness(waterColor, -20));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Wave ripples
        ctx.strokeStyle = this.adjustBrightness(waterColor, 40);
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const startY = (i / 5) * height;
            
            for (let x = 0; x < width; x += 10) {
                const y = startY + Math.sin((x + this.frame) * 0.05) * 10;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    
    adjustBrightness(hexColor, amount) {
        // Convert hex to RGB
        let color = hexColor.replace('#', '');
        let r = parseInt(color.substr(0, 2), 16);
        let g = parseInt(color.substr(2, 2), 16);
        let b = parseInt(color.substr(4, 2), 16);
        
        // Adjust
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        
        // Convert back to hex
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * ADVANCED PARTICLE SYSTEM
     * More sophisticated than basic particle effects
     */
    
    createParticleSystem(x, y, config) {
        const system = {
            x, y,
            particles: [],
            config: {
                particleCount: 50,
                lifetime: 2000,
                speed: { min: 50, max: 150 },
                size: { min: 2, max: 6 },
                color: '#FFD700',
                gravity: 0,
                fadeOut: true,
                shape: 'circle', // circle, square, star, spark
                ...config
            },
            age: 0
        };
        
        // Generate particles
        for (let i = 0; i < system.config.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / system.config.particleCount;
            const speed = system.config.speed.min + 
                Math.random() * (system.config.speed.max - system.config.speed.min);
            
            system.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: system.config.size.min + 
                    Math.random() * (system.config.size.max - system.config.size.min),
                life: 1.0,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 5
            });
        }
        
        this.particleSystems.push(system);
        return system;
    }
    
    updateParticles(deltaTime = 0.016) {
        if (!this.enableParticles) return;
        
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const system = this.particleSystems[i];
            system.age += deltaTime * 1000;
            
            // Remove expired systems
            if (system.age > system.config.lifetime) {
                this.particleSystems.splice(i, 1);
                continue;
            }
            
            // Update particles
            system.particles.forEach(particle => {
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.vy += system.config.gravity * deltaTime;
                particle.rotation += particle.rotationSpeed * deltaTime;
                
                if (system.config.fadeOut) {
                    particle.life = 1.0 - (system.age / system.config.lifetime);
                }
            });
        }
    }
    
    renderParticles() {
        if (!this.enableParticles) return;
        
        this.particleSystems.forEach(system => {
            system.particles.forEach(particle => {
                this.ctx.save();
                this.ctx.translate(
                    system.x + particle.x,
                    system.y + particle.y
                );
                this.ctx.rotate(particle.rotation);
                this.ctx.globalAlpha = particle.life;
                
                this.ctx.fillStyle = system.config.color;
                
                switch (system.config.shape) {
                    case 'circle':
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                    case 'square':
                        this.ctx.fillRect(
                            -particle.size / 2, 
                            -particle.size / 2, 
                            particle.size, 
                            particle.size
                        );
                        break;
                    case 'star':
                        this.drawStar(0, 0, 5, particle.size, particle.size / 2);
                        break;
                    case 'spark':
                        this.ctx.fillRect(-particle.size, -1, particle.size * 2, 2);
                        this.ctx.fillRect(-1, -particle.size, 2, particle.size * 2);
                        break;
                }
                
                this.ctx.restore();
            });
        });
    }
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * POST-PROCESSING EFFECTS
     * Screen-space effects applied after rendering
     */
    
    applyPostProcessing() {
        if (!this.enablePostProcessing) return;
        
        // Get canvas image data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply bloom effect
        if (this.bloomIntensity > 0) {
            this.applyBloom(imageData);
        }
        
        // Apply scanlines
        if (this.scanlineIntensity > 0) {
            this.applyScanlines(imageData);
        }
        
        // Put processed image back
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    applyBloom(imageData) {
        // Simple bloom: brighten bright pixels
        const data = imageData.data;
        const threshold = 200;
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            if (brightness > threshold) {
                const boost = this.bloomIntensity * (brightness - threshold) / (255 - threshold);
                data[i] += boost * 50;     // R
                data[i + 1] += boost * 50; // G
                data[i + 2] += boost * 50; // B
            }
        }
    }
    
    applyScanlines(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        
        for (let y = 0; y < imageData.height; y += 2) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const darken = 1 - this.scanlineIntensity;
                data[i] *= darken;     // R
                data[i + 1] *= darken; // G
                data[i + 2] *= darken; // B
            }
        }
    }

    /**
     * ADVANCED ANIMATION HELPERS
     */
    
    drawGlowingText(text, x, y, fontSize, glowColor, textColor) {
        this.ctx.save();
        
        this.ctx.font = `bold ${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Glow effect
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = glowColor;
        this.ctx.fillText(text, x, y);
        
        // Main text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(text, x, y);
        
        this.ctx.restore();
    }
    
    drawEnergyShield(x, y, radius, color, pulsePhase = 0) {
        this.ctx.save();
        
        // Pulsing effect
        const pulseRadius = radius + Math.sin(pulsePhase) * 5;
        
        // Create gradient
        const gradient = this.ctx.createRadialGradient(x, y, radius * 0.8, x, y, pulseRadius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.8, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, color.replace(')', ', 0.7)').replace('rgb', 'rgba'));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Hexagon pattern
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.6;
        
        const hexSize = radius / 4;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
            const hx = x + Math.cos(angle) * radius * 0.7;
            const hy = y + Math.sin(angle) * radius * 0.7;
            
            this.drawHexagon(hx, hy, hexSize);
        }
        
        this.ctx.restore();
    }
    
    drawHexagon(cx, cy, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = cx + size * Math.cos(angle);
            const y = cy + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    /**
     * FRAME UPDATE
     * Call this every frame to update animations
     */
    update(deltaTime = 0.016) {
        this.frame++;
        this.updateLights(deltaTime);
        this.updateParticles(deltaTime);
    }
}

// Make globally available
window.AdvancedGraphics = AdvancedGraphics;
