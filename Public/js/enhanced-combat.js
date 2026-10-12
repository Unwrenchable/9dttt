/**
 * Enhanced Combat System for Beat-Em-Ups
 * Advanced combo system, special moves, and weapon mechanics
 */

class EnhancedCombatSystem {
    constructor(game) {
        this.game = game;
        this.comboSystem = new ComboSystem();
        this.specialMoves = new SpecialMoves();
        this.weaponSystem = new WeaponSystem();
    }
}

// ==================== COMBO SYSTEM ====================

class ComboSystem {
    constructor() {
        this.combos = {
            // Light attacks
            'light-light-light': {
                name: 'Triple Strike',
                damage: 35,
                hits: 3,
                animation: 'triple-punch',
                specialEffect: 'knockback'
            },
            // Heavy combos
            'light-light-heavy': {
                name: 'Uppercut Finish',
                damage: 50,
                hits: 3,
                animation: 'uppercut',
                specialEffect: 'launch'
            },
            'heavy-heavy': {
                name: 'Power Slam',
                damage: 60,
                hits: 2,
                animation: 'slam',
                specialEffect: 'stun'
            },
            // Advanced combos
            'light-heavy-light-heavy': {
                name: 'Dragon Rush',
                damage: 80,
                hits: 4,
                animation: 'dragon-rush',
                specialEffect: 'fire-damage'
            },
            // Jump combos
            'jump-light': {
                name: 'Diving Strike',
                damage: 30,
                hits: 1,
                animation: 'dive-strike',
                specialEffect: 'ground-bounce'
            },
            'jump-heavy': {
                name: 'Meteor Drop',
                damage: 55,
                hits: 1,
                animation: 'meteor-drop',
                specialEffect: 'area-damage'
            }
        };
        
        this.comboBuffers = new Map(); // player → combo string
        this.comboTimers = new Map();  // player → time remaining
        this.comboWindow = 1.5; // seconds to complete combo
    }
    
    recordInput(playerId, inputType) {
        if (!this.comboBuffers.has(playerId)) {
            this.comboBuffers.set(playerId, []);
        }
        
        const buffer = this.comboBuffers.get(playerId);
        buffer.push(inputType);
        
        // Keep only last 6 inputs
        if (buffer.length > 6) {
            buffer.shift();
        }
        
        // Reset timer
        this.comboTimers.set(playerId, this.comboWindow);
        
        return this.checkCombo(playerId);
    }
    
    // Compatibility API used by dragon-fist.html (addInput / checkCombos), which
    // previously threw "addInput is not a function" on the first punch/kick.
    _comboKey(player) {
        return (player && typeof player === 'object')
            ? (player.id || player.label || player.name || (player._comboKey = player._comboKey || ('p' + Math.random().toString(36).slice(2))))
            : player;
    }

    addInput(player, inputType) {
        const key = this._comboKey(player);
        const combo = this.recordInput(key, inputType);
        if (combo) {
            if (!this.pendingCombos) this.pendingCombos = new Map();
            this.pendingCombos.set(key, combo);
        }
        return combo;
    }

    checkCombos(player) {
        const key = this._comboKey(player);
        const combo = this.pendingCombos && this.pendingCombos.get(key);
        if (!combo) return null;
        this.pendingCombos.delete(key);
        const effect = combo.specialEffect;
        return Object.assign({}, combo, {
            damageMultiplier: combo.damageMultiplier || Math.max(1, (combo.damage || 20) / 20),
            effects: combo.effects || {
                shake: 3 + (combo.hits || 1),
                flash: effect === 'launch' || effect === 'stun',
                knockback: effect === 'knockback' || effect === 'launch' ? 10 : 5
            }
        });
    }

    checkCombo(playerId) {
        const buffer = this.comboBuffers.get(playerId);
        if (!buffer || buffer.length === 0) return null;
        
        // Check from longest to shortest combo
        for (let len = Math.min(buffer.length, 6); len >= 2; len--) {
            const sequence = buffer.slice(-len).join('-');
            
            if (this.combos[sequence]) {
                // Combo found! Clear buffer
                this.comboBuffers.set(playerId, []);
                return this.combos[sequence];
            }
        }
        
        return null;
    }
    
    update(deltaTime) {
        // Decay combo timers
        for (const [playerId, timer] of this.comboTimers.entries()) {
            const newTimer = timer - deltaTime;
            
            if (newTimer <= 0) {
                // Timeout - reset combo
                this.comboBuffers.delete(playerId);
                this.comboTimers.delete(playerId);
            } else {
                this.comboTimers.set(playerId, newTimer);
            }
        }
    }
    
    getComboProgress(playerId) {
        const buffer = this.comboBuffers.get(playerId);
        const timer = this.comboTimers.get(playerId);
        
        return {
            inputs: buffer || [],
            timeRemaining: timer || 0,
            percentage: timer ? (timer / this.comboWindow) * 100 : 0
        };
    }
}

// ==================== SPECIAL MOVES ====================

class SpecialMoves {
    constructor() {
        this.moves = {
            // Fireball (Hadouken style)
            'down-forward-punch': {
                name: 'Dragon Fireball',
                damage: 45,
                range: 300,
                speed: 8,
                cooldown: 2,
                meterCost: 25,
                projectile: true,
                effect: 'fire'
            },
            // Uppercut (Shoryuken style)
            'forward-down-forward-punch': {
                name: 'Rising Dragon Fist',
                damage: 60,
                invincible: true,
                cooldown: 3,
                meterCost: 35,
                effect: 'launch'
            },
            // Spin attack
            'punch-punch-punch-rapidly': {
                name: 'Whirlwind Strike',
                damage: 70,
                duration: 1.5,
                area: 80,
                cooldown: 4,
                meterCost: 50,
                effect: 'multi-hit'
            },
            // Counter
            'back-punch': {
                name: 'Counter Stance',
                duration: 0.5,
                cooldown: 5,
                meterCost: 20,
                counter: true,
                counterDamage: 100
            },
            // Super move
            'down-down-punch-kick': {
                name: 'ULTIMATE DRAGON RAGE',
                damage: 150,
                area: 200,
                duration: 2,
                cooldown: 30,
                meterCost: 100,
                super: true,
                effect: 'screen-shake'
            }
        };
        
        this.inputBuffers = new Map();
        this.cooldowns = new Map();
    }
    
    checkSpecialMove(playerId, recentInputs) {
        // Check each special move pattern
        for (const [pattern, move] of Object.entries(this.moves)) {
            if (this.matchesPattern(recentInputs, pattern)) {
                return move;
            }
        }
        return null;
    }
    
    matchesPattern(inputs, pattern) {
        const patternParts = pattern.split('-');
        const inputStr = inputs.slice(-patternParts.length).join('-');
        return inputStr === pattern;
    }
    
    canUseMove(playerId, move, playerMeter) {
        // Check cooldown
        const cooldown = this.cooldowns.get(`${playerId}_${move.name}`);
        if (cooldown && cooldown > 0) return false;
        
        // Check meter cost
        if (playerMeter < move.meterCost) return false;
        
        return true;
    }
    
    executeDMove(playerId, move, player) {
        // Set cooldown
        this.cooldowns.set(`${playerId}_${move.name}`, move.cooldown);
        
        // Consume meter
        player.specialMeter -= move.meterCost;
        
        // Apply move effects
        return {
            move: move,
            success: true,
            timestamp: Date.now()
        };
    }
    
    update(deltaTime) {
        // Update cooldowns
        for (const [key, cooldown] of this.cooldowns.entries()) {
            const newCooldown = cooldown - deltaTime;
            if (newCooldown <= 0) {
                this.cooldowns.delete(key);
            } else {
                this.cooldowns.set(key, newCooldown);
            }
        }
    }
}

// ==================== WEAPON SYSTEM ====================

class WeaponSystem {
    constructor() {
        this.weapons = {
            bat: {
                name: 'Baseball Bat',
                damage: 40,
                range: 60,
                speed: 0.4,
                durability: 20,
                special: 'homerun' // Sends enemies flying
            },
            pipe: {
                name: 'Steel Pipe',
                damage: 35,
                range: 55,
                speed: 0.5,
                durability: 25,
                special: 'stun'
            },
            knife: {
                name: 'Combat Knife',
                damage: 30,
                range: 40,
                speed: 0.2,
                durability: 30,
                special: 'bleed' // Damage over time
            },
            chain: {
                name: 'Chain Whip',
                damage: 25,
                range: 90,
                speed: 0.3,
                durability: 35,
                special: 'grab' // Can pull enemies
            },
            nunchucks: {
                name: 'Nunchucks',
                damage: 28,
                range: 50,
                speed: 0.15,
                durability: 40,
                special: 'rapid' // Very fast attacks
            },
            katana: {
                name: 'Katana',
                damage: 55,
                range: 70,
                speed: 0.35,
                durability: 15,
                special: 'critical' // High crit chance
            }
        };
    }
    
    pickupWeapon(player, weaponType) {
        // Drop current weapon
        if (player.weapon) {
            this.dropWeapon(player);
        }
        
        // Equip new weapon
        player.weapon = {
            ...this.weapons[weaponType],
            type: weaponType,
            currentDurability: this.weapons[weaponType].durability
        };
        
        return player.weapon;
    }
    
    dropWeapon(player) {
        if (!player.weapon) return null;
        
        const droppedWeapon = {
            type: player.weapon.type,
            durability: player.weapon.currentDurability,
            x: player.x,
            y: player.y
        };
        
        player.weapon = null;
        return droppedWeapon;
    }
    
    useWeapon(player, enemy) {
        if (!player.weapon) return null;
        
        // Deal damage
        const damage = player.weapon.damage * (player.attackPower || 1);
        
        // Reduce durability
        player.weapon.currentDurability--;
        
        // Break weapon if durability reaches 0
        if (player.weapon.currentDurability <= 0) {
            const brokenWeapon = player.weapon.type;
            player.weapon = null;
            return { damage, broken: true, weaponType: brokenWeapon };
        }
        
        // Apply special effect
        const special = this.applyWeaponSpecial(player.weapon, enemy);
        
        return { damage, broken: false, special };
    }
    
    applyWeaponSpecial(weapon, enemy) {
        switch (weapon.special) {
            case 'homerun':
                return { type: 'knockback', power: 15 };
            case 'stun':
                return { type: 'stun', duration: 2 };
            case 'bleed':
                return { type: 'bleed', duration: 5, damagePerSec: 5 };
            case 'grab':
                return { type: 'grab', range: weapon.range };
            case 'rapid':
                return { type: 'attackSpeed', bonus: 2 };
            case 'critical':
                return { type: 'critical', chance: 0.4, multiplier: 2.5 };
            default:
                return null;
        }
    }
}

// ==================== BOSS AI SYSTEM ====================

class BossAISystem {
    constructor() {
        this.phases = new Map();
        this.currentPhases = new Map();
    }
    
    addBossPhases(bossId, phases) {
        this.phases.set(bossId, phases);
        this.currentPhases.set(bossId, 0);
    }
    
    updateBoss(boss, players, deltaTime) {
        if (!boss.isBoss) return;
        
        const bossId = boss.id || boss.name;
        const phases = this.phases.get(bossId);
        if (!phases) return;
        
        // Check for phase transitions
        const healthPercent = (boss.health / boss.maxHealth) * 100;
        const currentPhase = this.currentPhases.get(bossId);
        
        // Transition to next phase?
        if (phases[currentPhase + 1] && healthPercent <= phases[currentPhase + 1].triggerHealth) {
            this.transitionPhase(boss, bossId, currentPhase + 1);
        }
        
        // Execute current phase AI
        const phase = phases[currentPhase];
        if (phase && phase.ai) {
            phase.ai(boss, players, deltaTime);
        }
    }
    
    transitionPhase(boss, bossId, newPhase) {
        this.currentPhases.set(bossId, newPhase);
        const phases = this.phases.get(bossId);
        const phase = phases[newPhase];
        
        // Apply phase changes
        if (phase.speedMultiplier) {
            boss.speed *= phase.speedMultiplier;
        }
        if (phase.damageMultiplier) {
            boss.damage *= phase.damageMultiplier;
        }
        if (phase.newAbilities) {
            boss.abilities = [...(boss.abilities || []), ...phase.newAbilities];
        }
        
        // Visual effect
        return {
            type: 'phaseTransition',
            boss: boss,
            phase: newPhase,
            message: phase.message
        };
    }
}

// Export systems
window.EnhancedCombatSystem = EnhancedCombatSystem;
window.ComboSystem = ComboSystem;
window.SpecialMoves = SpecialMoves;
window.WeaponSystem = WeaponSystem;
window.BossAISystem = BossAISystem;
