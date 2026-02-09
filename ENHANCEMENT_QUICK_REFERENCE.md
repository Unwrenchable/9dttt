# 9DTTT Enhancement Quick Reference

## 🎮 Controller Support

### Opening the Guide
- **Keyboard:** `Ctrl + G`
- **Controller:** Hold Back/Select button for 2 seconds
- **On First Connection:** Guide shows automatically

### Universal Controls
```
A Button     = Select/Confirm
B Button     = Back/Cancel  
X Button     = Toggle Instructions
Y Button     = New Game
D-Pad/Stick  = Navigate
Start        = Pause/Menu
Back         = Quick Help
LB/RB        = Tab Navigation
```

---

## 🎨 Graphics System

### Quick Setup
```javascript
// Initialize
const gfx = new AdvancedGraphics(canvas, ctx);

// In game loop
gfx.update(deltaTime);
gfx.renderLighting();
gfx.renderParticles();
gfx.applyPostProcessing();
```

### Add Light
```javascript
gfx.addLight(x, y, radius, color, intensity, flicker);
// Example: torch
gfx.addLight(100, 100, 150, '#FFA500', 1.0, 0.2);
```

### Generate Texture
```javascript
const texture = gfx.generateTexture(type, w, h, options);
// Types: 'brick', 'metal', 'wood', 'concrete', 'grass', 'water'
ctx.drawImage(texture, x, y);
```

### Create Particles
```javascript
gfx.createParticleSystem(x, y, {
    particleCount: 50,
    lifetime: 2000,
    speed: { min: 50, max: 150 },
    color: '#FFD700',
    shape: 'star' // circle, square, star, spark
});
```

---

## ⚠️ Error Handling

### Safe Initialization
```javascript
GameErrorHandler.safeInit(() => {
    const game = new MyGame();
    game.start();
}, 'Game Name');
```

### Wrap Risky Code
```javascript
const safe = gameErrorHandler.wrapGameFunction(() => {
    // risky code
}, 'context');
```

---

## 📋 Integration Checklist

### New Game HTML Template
```html
<!-- Add these scripts -->
<script src="../js/gamepad-manager.js"></script>
<script src="../js/controller-guide.js"></script>
<script src="../js/advanced-graphics.js"></script>
<script src="../js/game-error-handler.js"></script>
```

### Canvas Setup
```html
<!-- Always specify dimensions -->
<canvas id="gameCanvas" width="800" height="600"></canvas>
```

### Game Initialization
```javascript
// Wrap in safe init
GameErrorHandler.safeInit(() => {
    const game = new MyGame();
}, 'MyGame');
```

---

## 🔧 Controller Configuration

### Access Config UI
```javascript
// Show with Shift + G or programmatically
window.gamepadConfig.show();
```

### Apply Genre Preset
```javascript
window.gamepadConfig.applyPreset(0, 'fighting');
// Presets: fighting, beat-em-up, shooter, racing, puzzle, platformer
```

### Custom Vibration
```javascript
window.gamepadConfig.vibratePattern(0, 'hit');
// Patterns: hit, damage, shoot, explosion, combo, powerup
```

---

## 🎯 Common Patterns

### Lighting for Muzzle Flash
```javascript
const lightId = gfx.addLight(x, y, 100, '#FFFF00', 1.0);
setTimeout(() => gfx.removeLight(lightId), 100);
```

### Hit Effect
```javascript
gfx.createParticleSystem(hitX, hitY, {
    particleCount: 20,
    lifetime: 500,
    color: '#FF0000',
    shape: 'spark'
});
gamepadConfig.vibratePattern(0, 'hit');
```

### Background Textures
```javascript
// Generate once, reuse
if (!this.wallTexture) {
    this.wallTexture = gfx.generateTexture('brick', 200, 200);
}
ctx.drawImage(this.wallTexture, x, y);
```

---

## 📊 Performance Tips

1. **Lights:** Limit to 5-10 simultaneous lights
2. **Particles:** Use lifetime < 3000ms
3. **Textures:** Cache generated textures
4. **Post-processing:** Disable on low-end devices

```javascript
// Toggle features for performance
gfx.enableDynamicLighting = true;
gfx.enableParticles = true;
gfx.enablePostProcessing = false; // Disable if slow
```

---

## 🐛 Troubleshooting

### Controller Not Detected
- Press any button to wake it
- Check `window.gamepadManager.getConnectedCount()`
- Open guide with `window.controllerGuide.show()`

### Graphics Not Rendering
- Check canvas context exists
- Verify `AdvancedGraphics` initialized
- Check console for errors

### Error Modal Stuck
- Press B button to close
- Call `window.gameErrorHandler.hideError()`

---

## 📱 Responsive Design

### Canvas Scaling
```javascript
// Auto-scale canvas to fit screen
canvas.style.width = '100%';
canvas.style.height = 'auto';
```

### Mobile Controller Support
- Touch controls automatically added
- Gamepad still works if connected via Bluetooth

---

## 🎨 Color Palette Reference

```javascript
// Standard game colors
const COLORS = {
    primary: '#4a90e2',
    secondary: '#e74c3c',
    accent: '#2ecc71',
    warning: '#f39c12',
    danger: '#c0392b',
    light: '#ecf0f1',
    dark: '#2c3e50'
};
```

---

## 📦 File Sizes

| File | Size | Purpose |
|------|------|---------|
| controller-guide.js | ~22KB | Controller UI & mappings |
| advanced-graphics.js | ~22KB | Graphics enhancements |
| game-error-handler.js | ~18KB | Error handling |
| **Total** | **~62KB** | All enhancements |

Gzipped: ~15KB total

---

## ✅ Testing Checklist

- [ ] Controller connects automatically
- [ ] Guide opens with Ctrl+G
- [ ] Vibration works
- [ ] Lights render correctly
- [ ] Particles animate smoothly
- [ ] Textures load and cache
- [ ] Errors show helpful messages
- [ ] Game runs at 60 FPS

---

## 📞 Support

**Issues:** [GitHub Issues](https://github.com/Unwrenchable/9dttt/issues)  
**Docs:** See `CONTROLLER_GRAPHICS_IMPROVEMENTS.md`  
**Examples:** Check `dragon-fist.html` for reference

---

**Quick Start:** Just add the 3 script tags, and everything works! 🎮✨
