/* portfoliogameindex.js - Cyberpunk Metroidvania Engine */
const canvas = document.createElement('canvas');
canvas.id = 'gameCanvas';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

const camera = { x: 0, y: 0, width: 0, height: 0, targetX: 0, targetY: 0 };
function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    camera.width = canvas.width;
    camera.height = canvas.height;
}
addEventListener('resize', resize);
resize();

/* Graphics & Assets */
const bgImage = new Image();
bgImage.src = '../images/cyberpunk_bg.png';

/* Game State & Physics */
const gravity = 0.6;
const keys = {};
let mouse = { x: 0, y: 0, down: false };

addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener('mousedown', e => { mouse.down = true; player.fireHook(); });
addEventListener('mouseup', e => { mouse.down = false; player.releaseHook(); });

/* UI DOM */
const uiLayer = document.createElement('div');
uiLayer.className = 'ui-layer';
document.body.appendChild(uiLayer);

const hud = document.createElement('div');
hud.className = 'game-hud';
uiLayer.appendChild(hud);

const popup = document.createElement('div');
popup.className = 'bio-popup';
uiLayer.appendChild(popup);

const controls = document.createElement('div');
controls.className = 'controls-hint';
controls.innerHTML = `
    <p><strong>A / D or L / R ARROWS</strong> : Move</p>
    <p><strong>SPACE or UP ARROW</strong> : Jump</p>
    <p><strong>SHIFT</strong> : Dash (Unlockable)</p>
    <p><strong>MOUSE CLICK</strong> : Grappling Hook (Unlockable)</p>
`;
uiLayer.appendChild(controls);

function showPopup(title, starsNum, skillName) {
    let starsStr = '★'.repeat(starsNum) + '☆'.repeat(5 - starsNum);
    popup.innerHTML = `
        <div class="bio-title">${title}</div>
        <div class="bio-stars">${starsStr}</div>
        <div class="bio-desc">Skill Acquired!</div>
        <div class="bio-skill">UNLOCK: ${skillName.toUpperCase()}</div>
    `;
    popup.classList.add('show');
    setTimeout(() => { popup.classList.remove('show'); }, 4000);
}

function rectsIntersect(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

/* Particles */
const particles = [];
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1, color: color, size: Math.random() * 4 + 2
        });
    }
}
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - camera.x, p.y - camera.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}
/* Custom User Cat Import */
const customCatImage = new Image();
customCatImage.src = '../images/cat.png'; // Place your custom here!

/* Player */
class Player {
    constructor() {
        this.w = 40; this.h = 40; this.x = 200; this.y = 400;
        this.vx = 0; this.vy = 0; this.speed = 3.5; this.jumpStrength = 13.5;
        this.onGround = false; this.facing = 1;

        // Skills
        this.canDoubleJump = false; this.hasDoubleJumped = false;
        this.canDash = false; this.dashCd = 0;
        this.canHook = false;

        // Hook State
        this.hook = { active: false, x: 0, y: 0, length: 0 };
        this.trail = [];
    }

    fireHook() {
        if (!this.canHook) return;
        // Find nearest platform point above/diagonal in direction of mouse
        const mouseWorldX = mouse.x + camera.x;
        const mouseWorldY = mouse.y + camera.y;

        let bestTarget = null;
        let bestDist = 600; // Max hook range

        // Raycast logic: just find closest rect within radius that is somewhat aligned
        for (const p of platforms) {
            // Anchor to bottom center of platform for hook
            const hx = p.x + p.w / 2;
            const hy = p.y + p.h;
            const dist = Math.hypot(hx - (this.x + this.w / 2), hy - (this.y));
            if (dist < bestDist && hy < this.y) {
                bestDist = dist;
                bestTarget = { x: hx, y: hy };
            }
        }

        if (bestTarget) {
            this.hook.active = true;
            this.hook.x = bestTarget.x;
            this.hook.y = bestTarget.y;
            this.hook.length = bestDist; // Spring rest length
            spawnParticles(bestTarget.x, bestTarget.y, '#f72585', 10);
        }
    }

    releaseHook() { this.hook.active = false; }

    draw() {
        // Draw Grappling Hook Line
        if (this.hook.active) {
            ctx.beginPath();
            ctx.moveTo(this.x + this.w / 2 - camera.x, this.y - camera.y);
            ctx.lineTo(this.hook.x - camera.x, this.hook.y - camera.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#f72585';
            ctx.stroke();
            ctx.shadowBlur = 10; ctx.shadowColor = '#f72585'; ctx.stroke(); ctx.shadowBlur = 0;
        }

        // --- Custom Image Override ---
        if (customCatImage.complete && customCatImage.naturalHeight > 0) {
            ctx.save();
            ctx.translate(this.x - camera.x + this.w / 2, this.y - camera.y + this.h);
            ctx.scale(this.facing, 1);

            // Fix aspect ratio compression
            const imgRatio = customCatImage.naturalWidth / customCatImage.naturalHeight;
            const drawH = this.h; // match player height
            const drawW = drawH * imgRatio; // preserve original width scale

            ctx.drawImage(customCatImage, -drawW / 2, -drawH, drawW, drawH);
            ctx.restore();
            return;
        }

        // Animation state for Pixel Cat
        let frameName = 'idle';

        if (!this.onGround) {
            frameName = 'jump';
        } else if (Math.abs(this.vx) > 0.5) {
            frameName = (Math.floor(this.x / 15) % 2 === 0) ? 'run1' : 'run2';
        }

        const frame = catPixels[frameName];
        if (!frame) return; // safety

        const rows = frame.length;
        const cols = frame[0].length;
        const pixelSizeW = this.w / cols;
        const pixelSizeH = this.h / rows;

        ctx.save();
        ctx.translate(this.x - camera.x + this.w / 2, this.y - camera.y + this.h);
        ctx.scale(this.facing, 1);
        ctx.translate(-this.w / 2, -this.h);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let char = frame[r][c];
                if (pixelColors[char]) {
                    ctx.fillStyle = pixelColors[char];
                    if (char === 'E') {
                        ctx.shadowBlur = 12;
                        ctx.shadowColor = pixelColors[char];
                    } else {
                        ctx.shadowBlur = 0;
                    }
                    ctx.fillRect(c * pixelSizeW, r * pixelSizeH, pixelSizeW + 0.5, pixelSizeH + 0.5);
                }
            }
        }
        ctx.restore();
    }

    update(platforms, boxes) {
        // Record trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();

        let move = 0;
        if (keys['arrowleft'] || keys['a']) move -= 1;
        if (keys['arrowright'] || keys['d']) move += 1;
        if (move !== 0) this.facing = move;

        // Hook Physics (Spring-based pendulum)
        if (this.hook.active) {
            const dx = this.hook.x - (this.x + this.w / 2);
            const dy = this.hook.y - (this.y + this.h / 2);
            const dist = Math.hypot(dx, dy);

            // Apply spring pull if extended
            const springForce = 0.02; // Elasticity
            this.vx += dx * springForce;
            this.vy += dy * springForce;

            // Damping (air resistance while hooking)
            this.vx *= 0.98;
            this.vy *= 0.98;

            // Allow swing steering
            this.vx += move * this.speed * 0.1;
        } else {
            // Normal Ground / Air movement
            this.vx = this.vx * 0.85 + move * this.speed * 0.25;

            // Dash Capability
            if (keys['shift'] && this.canDash && this.dashCd <= 0) {
                this.vx += this.facing * 25;
                this.vy = 0; // Freeze Y momentarily
                this.dashCd = 50;
                spawnParticles(this.x + this.w / 2, this.y + this.h / 2, '#00ffd7', 20);
            }
        }

        if (this.dashCd > 0) this.dashCd--;

        // Jumping Logic
        // Jumping Logic
        if ((keys['arrowup'] || keys[' ']) && this.onGround) {
            this.vy = -this.jumpStrength; this.onGround = false; this.hasDoubleJumped = false;
            spawnParticles(this.x + this.w / 2, this.y + this.h, '#fff', 10);
            keys['arrowup'] = false; keys[' '] = false; // consume key
        } else if ((keys['arrowup'] || keys[' ']) && !this.onGround && this.canDoubleJump && !this.hasDoubleJumped && !this.hook.active) {
            this.vy = -this.jumpStrength * 0.9; this.hasDoubleJumped = true;
            spawnParticles(this.x + this.w / 2, this.y + this.h, '#f72585', 15);
            keys['arrowup'] = false; keys[' '] = false; // consume key
        }

        // Apply Gravity
        if (!this.hook.active) {
            this.vy += gravity;
        } else {
            this.vy += gravity * 0.5; // Reduced gravity while swinging
        }

        if (this.vy > 20) this.vy = 20;

        // Apply velocities
        this.x += this.vx; this.y += this.vy;
        this.onGround = false;

        // Collision with Platforms
        for (const p of platforms) {
            let pr = { x: this.x, y: this.y, w: this.w, h: this.h };
            let pl = { x: p.x, y: p.y, w: p.w, h: p.h };
            if (rectsIntersect(pr, pl)) {
                const overlapX = (this.x + this.w / 2) - (p.x + p.w / 2);
                const overlapY = (this.y + this.h / 2) - (p.y + p.h / 2);
                const halfW = (this.w + p.w) / 2, halfH = (this.h + p.h) / 2;
                const dx = halfW - Math.abs(overlapX), dy = halfH - Math.abs(overlapY);

                if (dx < dy) {
                    if (overlapX > 0) this.x += dx; else this.x -= dx;
                    this.vx = 0;
                } else {
                    if (overlapY > 0) {
                        this.y += dy; this.vy = 0; // Hit ceiling
                    } else {
                        this.y -= dy; this.vy = 0; // Landed
                        if (overlapY <= 0) { this.onGround = true; this.hasDoubleJumped = false; }
                    }
                }
            }
        }

        // Collision with ItemBoxes (Hit from bottom)
        for (const b of boxes) {
            if (b.hit) continue;
            let pr = { x: this.x, y: this.y, w: this.w, h: this.h };
            let bl = { x: b.x, y: b.y, w: b.w, h: b.h };
            if (rectsIntersect(pr, bl)) {
                const overlapY = (this.y + this.h / 2) - (b.y + b.h / 2);
                // Hit bottom of the box moving upwards
                if (overlapY > 0 && this.vy < 0) {
                    this.vy = 0;
                    b.hit = true;
                    spawnParticles(b.x + b.w / 2, b.y, '#f72585', 30);
                    showPopup(b.title, b.stars, b.unlock);
                    if (b.unlock === 'Double Jump') this.canDoubleJump = true;
                    if (b.unlock === 'Dash') this.canDash = true;
                    if (b.unlock === 'Grappling Hook') this.canHook = true;
                }
            }
        }

        // Death Floor Respawn
        if (this.y > 1500) {
            this.x = 200; this.y = 400; this.vy = 0; this.vx = 0; this.hook.active = false;
        }
    }
}

/* World Elements */
class Platform {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
    draw() {
        ctx.fillStyle = '#061121';
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.w, this.h);
        ctx.lineWidth = 1; ctx.strokeStyle = '#00ffd7';
        // Subtly glow top border
        ctx.shadowBlur = 10; ctx.shadowColor = '#00ffd7';
        ctx.beginPath();
        ctx.moveTo(this.x - camera.x, this.y - camera.y);
        ctx.lineTo(this.x + this.w - camera.x, this.y - camera.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.w, this.h);
    }
}

class ItemBox {
    constructor(x, y, title, stars, unlock) {
        this.x = x; this.y = y; this.w = 50; this.h = 50;
        this.title = title; this.stars = stars; this.unlock = unlock;
        this.hit = false;
        this.floatY = 0;
    }
    draw() {
        if (this.hit) {
            // Draw empty hit box casing
            ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
            ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.w, this.h);
            return;
        }
        this.floatY = Math.sin(Date.now() / 200) * 5;
        let drawY = this.y - camera.y + this.floatY;

        ctx.fillStyle = '#110a2f';
        ctx.shadowBlur = 20; ctx.shadowColor = '#f72585';
        ctx.fillRect(this.x - camera.x, drawY, this.w, this.h);

        ctx.strokeStyle = '#f72585'; ctx.lineWidth = 3;
        ctx.strokeRect(this.x - camera.x, drawY, this.w, this.h);

        ctx.fillStyle = '#f72585'; ctx.font = '24px Arial'; ctx.textAlign = 'center';
        ctx.fillText('?', this.x - camera.x + this.w / 2, drawY + 34);
        ctx.shadowBlur = 0;
    }
}

/* Map Design */
const platforms = [
    // Starting area: long safe zone
    new Platform(50, 600, 900, 60),
    new Platform(350, 480, 200, 20),

    // First Gap (only 100px)
    new Platform(1050, 500, 600, 60),
    new Platform(1200, 350, 200, 20),

    // Second Gap (250px - requiring Double Jump)
    new Platform(1900, 600, 700, 60),
    new Platform(2100, 450, 200, 20),

    // Vertical ascension requiring Grappling hook
    new Platform(2700, 350, 100, 400), // Wall
    new Platform(2750, 150, 300, 20),  // Hook anchor (huge easy target)
    new Platform(3150, 150, 300, 20),  // High platform (easy landing)

    // Final long road (Endless vibe)
    new Platform(3450, 350, 2500, 60)
];

const boxes = [
    new ItemBox(450, 330, 'HTML & CSS', 4, 'Double Jump'),
    new ItemBox(1300, 200, 'JavaScript', 4, 'Dash'),
    new ItemBox(2200, 300, 'React & Node', 4, 'Grappling Hook')
];

const player = new Player();

function drawHologramText() {
    let rawX = 4000; let rawY = 150;
    if (rawX - camera.x > canvas.width || rawX - camera.x < -2000) return; // Optimize

    ctx.save();
    ctx.font = 'bold 48px "Roboto Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 255, 215, 0.1)';

    // Cyberpunk Glitch effect
    ctx.shadowBlur = 15; ctx.shadowColor = '#00ffd7';
    let text = "THIS IS JUST MY CURRENT LEVEL.";
    let text2 = "I WILL ALWAYS GROW IN THE FUTURE...";

    ctx.fillText(text, rawX - camera.x, rawY - camera.y);
    ctx.fillText(text2, rawX - camera.x, rawY - camera.y + 70);

    // Neon core
    ctx.fillStyle = '#cdfcf3';
    ctx.fillText(text, rawX - camera.x + 2, rawY - camera.y - 2);
    ctx.fillText(text2, rawX - camera.x + 2, rawY - camera.y + 68);
    ctx.restore();
}

/* Loop */
function animate() {
    requestAnimationFrame(animate);

    // Update Camera (Smooth Follow)
    camera.targetX = player.x + player.w / 2 - canvas.width / 2;
    camera.targetY = player.y + player.h / 2 - canvas.height / 2;

    camera.x += (camera.targetX - camera.x) * 0.1;
    camera.y += (camera.targetY - camera.y) * 0.1;

    // Always clear the screen first to prevent any visual smearing/ghosting
    ctx.fillStyle = '#010510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Background (Parallax Layer)
    if (bgImage.complete && bgImage.width > 0) {
        const bgRatio = bgImage.width / bgImage.height;
        const bgH = canvas.height;
        const bgW = bgH * bgRatio;
        // Safe modulo for negative camera values
        const scrollX = ((camera.x * 0.2) % bgW + bgW) % bgW;

        // Loop drawing the background until it covers the entire canvas width
        let startX = -scrollX;
        while (startX < canvas.width) {
            ctx.drawImage(bgImage, startX, 0, bgW, bgH);
            startX += bgW;
        }
    }

    player.update(platforms, boxes);

    for (const p of platforms) p.draw();
    for (const b of boxes) b.draw();

    updateAndDrawParticles();
    player.draw();
    drawHologramText();

    // HUD Update
    hud.innerHTML = `
        <div style="font-weight:bold; margin-bottom:10px; border-bottom:1px solid #00ffd7; padding-bottom:5px;">SYSTEM STATUS</div>
        <div class="hud-item">Double Jump: <span class="${player.canDoubleJump ? 'unlocked' : 'locked'}">${player.canDoubleJump ? 'ONLINE' : 'LOCKED'}</span></div>
        <div class="hud-item">Hyper Dash: <span class="${player.canDash ? 'unlocked' : 'locked'}">${player.canDash ? 'ONLINE' : 'LOCKED'}</span></div>
        <div class="hud-item">Grapple Hook: <span class="${player.canHook ? 'unlocked' : 'locked'}">${player.canHook ? 'ONLINE' : 'LOCKED'}</span></div>
    `;
}

animate();
