/* portfoliogameindex.js - cleaned single-file version
   Make sure this is the only script tag in the HTML and the file lives in /js/ */
const canvas = document.createElement('canvas');
canvas.id = 'gameCanvas';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

const camera = { x:0, y:0, width:0, height:0 };
function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    camera.width = canvas.width;
    camera.height = canvas.height;
}
addEventListener('resize', resize);
resize();

/* config */
const gravity = 0.6;
const SURFACE_Y = 200;

/* DOM UI */
const hud = document.createElement('div'); hud.className = 'game-hud'; document.body.appendChild(hud);
const mapPanel = document.createElement('div'); mapPanel.className = 'map-panel hidden';
mapPanel.innerHTML = `
  <div class="map-panel-header">
    <h3>CAREER & TECHNOLOGY MAP</h3>
    <button class="map-close">Close</button>
  </div>
  <div class="map-panel-body">
    <ul class="node-list"></ul>
  </div>
`;
document.body.appendChild(mapPanel);
const notifyRoot = document.createElement('div'); notifyRoot.className = 'notify-html'; document.body.appendChild(notifyRoot);
mapPanel.querySelector('.map-close').addEventListener('click', ()=> { mapOpen = false; updateMapUI(); });

/* input */
const keys = {};
addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'm') { mapOpen = !mapOpen; updateMapUI(); }
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

/* helpers */
function rectsIntersect(a,b){
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

/* single notification helper (use this; no duplicate) */
function spawnNotification(text, lifetime = 1800) {
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
    notifyRoot.appendChild(el);
    // show -> hide -> remove
    requestAnimationFrame(()=> el.classList.add('show'));
    setTimeout(()=> el.classList.add('hide'), lifetime - 400);
    setTimeout(()=> el.remove(), lifetime);
}

/* Player */
class Player {
    constructor(){
        this.w=48; this.h=48; this.x=120; this.y=520;
        this.vx=0; this.vy=0; this.speed=3.2; this.jumpStrength=12;
        this.onGround=false; this.facing=1;
        this.canDoubleJump=false; this.hasDoubleJumped=false;
        this.canDash=false; this.dashCd=0;
    }
    draw(){
        ctx.save();
        ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(0,255,200,0.8)';
        ctx.fillStyle = '#071826';
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.w, this.h);
        ctx.strokeStyle = '#00ffd7'; ctx.lineWidth = 2;
        ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.w, this.h);
        ctx.restore();
    }
    update(platforms){
        let move=0;
        if (keys['arrowleft'] || keys['a']) move -=1;
        if (keys['arrowright'] || keys['d']) move +=1;
        if (move !== 0) this.facing = move;
        this.vx = this.vx * 0.85 + move * this.speed * 0.25;

        if ((keys['shift'] || keys[' ']) && this.canDash && this.dashCd<=0){
            this.vx += this.facing * 12; this.dashCd = 60;
        }
        if (this.dashCd>0) this.dashCd--;

        if ((keys['arrowup'] || keys['w']) && this.onGround){
            this.vy = -this.jumpStrength; this.onGround=false; this.hasDoubleJumped=false;
        } else if ((keys['arrowup'] || keys['w']) && !this.onGround && this.canDoubleJump && !this.hasDoubleJumped){
            this.vy = -this.jumpStrength * 0.9; this.hasDoubleJumped=true;
        }

        this.vy += gravity; if (this.vy > 20) this.vy=20;
        this.x += this.vx; this.y += this.vy;

        this.onGround = false;
        for (const p of platforms){
            const pr = {x:this.x, y:this.y, w:this.w, h:this.h};
            const pl = {x:p.x, y:p.y, w:p.w, h:p.h};
            if (rectsIntersect(pr,pl)){
                const overlapX = (this.x + this.w/2) - (p.x + p.w/2);
                const overlapY = (this.y + this.h/2) - (p.y + p.h/2);
                const halfW = (this.w + p.w)/2, halfH=(this.h + p.h)/2;
                const dx = halfW - Math.abs(overlapX), dy = halfH - Math.abs(overlapY);
                if (dx < dy){
                    if (overlapX>0) this.x += dx; else this.x -= dx;
                    this.vx = 0;
                } else {
                    if (overlapY>0) this.y += dy; else this.y -= dy;
                    this.vy = 0;
                    if (overlapY <= 0) { this.onGround = true; this.hasDoubleJumped=false; }
                }
            }
        }
        if (this.y > 4000) { this.x = 120; this.y = 520; this.vy = 0; }
    }
}

/* Platform */
class Platform {
    constructor(x,y,w,h,c='#1b1b1f'){ this.x=x; this.y=y; this.w=w; this.h=h; this.c=c; }
    draw(){ ctx.fillStyle=this.c; ctx.fillRect(this.x - camera.x, this.y - camera.y, this.w, this.h);
        ctx.strokeStyle='rgba(0,255,200,0.06)'; ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.w, this.h); }
}

/* Level */
const platforms = [];
for (let i=0;i<40;i++) platforms.push(new Platform(i*380, 600, 380, 88));
platforms.push(new Platform(700,480,200,20));
platforms.push(new Platform(980,380,140,20));
platforms.push(new Platform(1280,520,220,20));
platforms.push(new Platform(1800,420,260,20));
platforms.push(new Platform(2200,300,200,20));
platforms.push(new Platform(2600,380,220,20));

/* Nodes */
const nodes = [
    { id:'start', x: 140, y: 540, label:'Start', unlocked: true, type:'career', desc:'Beginning' },
    { id:'intern', x: 800, y: 460, label:'Intern', unlocked:false, type:'career', desc:'Intro to work' },
    { id:'frontend', x: 980, y: 340, label:'Frontend', unlocked:false, type:'tech', desc:'HTML/CSS/JS' },
    { id:'backend', x: 1400, y: 520, label:'Backend', unlocked:false, type:'tech', desc:'Node / DB' },
    { id:'fullstack', x: 2000, y: 380, label:'Fullstack', unlocked:false, type:'career', desc:'Full-stack' },
    { id:'threejs', x: 2400, y: 260, label:'3D / Three.js', unlocked:false, type:'tech', desc:'3D skills' }
];
const edges = [['start','intern'],['intern','frontend'],['frontend','threejs'],['intern','backend'],['backend','fullstack']];

const player = new Player();
let mapOpen = false;

function drawParallax(){
    const g = ctx.createLinearGradient(0,0,0,canvas.height); g.addColorStop(0,'#000814'); g.addColorStop(1,'#041022');
    ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
    const cx = - (camera.x * 0.2 % 900);
    for (let i=-1;i<6;i++){
        ctx.fillStyle = '#071021'; ctx.fillRect(cx + i*900, canvas.height - 240, 700, 220);
        for (let w=0; w<8; w++){
            const wx = cx + i*900 + 20 + w*80;
            ctx.fillStyle = `rgba(0,${140 + w*9 % 80},${220 - w*12 % 120},${0.08 + (w%2)*0.05})`;
            ctx.fillRect(wx, canvas.height - (160 + (w%3)*10), 10, 7);
        }
    }
}

function updateCamera(){
    const cx = player.x + player.w/2, cy = player.y + player.h/2;
    camera.x = cx - canvas.width/2; camera.y = cy - canvas.height/2;
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;
}

function checkNodeUnlocks(){
    for (const n of nodes){
        if (!n.unlocked){
            const dx = (player.x + player.w/2) - n.x, dy = (player.y + player.h/2) - n.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 60){ n.unlocked = true;
                if (n.id === 'frontend') player.canDoubleJump = true;
                if (n.id === 'threejs') player.canDash = true;
                spawnNotification(`Unlocked: ${n.label}`);
                updateMapUI();
            }
        }
    }
}

function updateMapUI(){
    const list = mapPanel.querySelector('.node-list'); list.innerHTML = '';
    for (const n of nodes){
        const li = document.createElement('li'); li.className='node-item';
        li.innerHTML = `<div class="node-left">
                      <div class="node-dot ${n.unlocked ? 'unlocked' : 'locked'}"></div>
                      <div class="node-meta">
                        <div class="node-label">${n.label}</div>
                        <div class="node-desc">${n.desc}</div>
                      </div>
                    </div>
                    <div class="node-actions">
                      ${n.unlocked ? '<button class="btn-claim">Claim</button>' : '<button class="btn-locked" disabled>Locked</button>'}
                    </div>`;
        list.appendChild(li);
        if (n.unlocked) {
            li.querySelector('.btn-claim').addEventListener('click', ()=>{
                spawnNotification(`${n.label} — details opened`);
            });
        }
    }
    mapPanel.classList.toggle('hidden', !mapOpen);
}

/* main loop */
function animate(){
    requestAnimationFrame(animate);
    drawParallax();
    player.update(platforms);
    updateCamera();

    for (const p of platforms) p.draw();

    for (const n of nodes){
        const nx = n.x - camera.x, ny = n.y - camera.y;
        ctx.beginPath();
        ctx.fillStyle = n.unlocked ? 'rgba(0,255,215,0.95)' : 'rgba(120,120,130,0.7)';
        ctx.arc(nx, ny, n.unlocked ? 10 : 8, 0, Math.PI*2); ctx.fill();
        ctx.font = '12px Arial';
        ctx.fillStyle = n.unlocked ? '#dff' : '#888';
        ctx.fillText(n.label, nx + 14, ny + 4);
    }

    player.draw();

    hud.innerHTML = `
    <div class="hud-block">
      <div>Pos: ${Math.round(player.x)}, ${Math.round(player.y)}</div>
      <div>DoubleJump: ${player.canDoubleJump ? 'YES' : 'NO'}</div>
      <div>Dash: ${player.canDash ? 'YES' : 'NO'}</div>
      <div class="hint">${player.y <= SURFACE_Y ? 'You reached surface — press M to open map' : ''}</div>
    </div>
  `;

    checkNodeUnlocks();

    if (mapOpen) drawMapOverlayCanvas();
}

requestAnimationFrame(animate);

/* canvas-drawn map overlay */
function drawMapOverlayCanvas(){
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,12,0.55)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    const pad=40; ctx.fillStyle='#03141a'; ctx.fillRect(pad,pad,canvas.width-pad*2,canvas.height-pad*2);
    const worldMaxX = 3000, worldMaxY = 800;
    const mapW = canvas.width - pad*2 - 40, mapH = canvas.height - pad*2 - 80;
    const sx = mapW / worldMaxX, sy = mapH / worldMaxY;
    const ox = pad+20, oy = pad+60;
    ctx.strokeStyle = 'rgba(100,220,200,0.18)'; ctx.lineWidth = 2;
    for (const e of edges){
        const a = nodes.find(n=>n.id===e[0]), b = nodes.find(n=>n.id===e[1]);
        const ax = ox + a.x * sx, ay = oy + a.y * sy, bx = ox + b.x * sx, by = oy + b.y * sy;
        ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    }
    for (const n of nodes){
        const nx = ox + n.x * sx, ny = oy + n.y * sy;
        ctx.beginPath(); ctx.fillStyle = n.unlocked ? '#00ffd7' : '#444'; ctx.arc(nx,ny, n.unlocked ? 10 : 8,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = n.unlocked ? '#9ff' : '#666'; ctx.font='12px Arial'; ctx.fillText(n.label, nx + 14, ny + 4);
    }
    ctx.restore();
}

/* initialize UI */
updateMapUI();
