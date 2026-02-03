import * as THREE from "three";
import { getBody, getMouseBall } from "./getBodies.js";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2';
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";
import { MarchingCubes } from "jsm/objects/MarchingCubes.js";

// --- TỐI ƯU 1: Cấu hình giảm tải ---
const config = {
    resolution: 32, // Giảm từ 50 xuống 32 (Quan trọng nhất để giảm lag)
    numBodies: 30,  // Giảm từ 55 xuống 30
    pixelRatio: Math.min(window.devicePixelRatio, 1.5), // Giới hạn độ nét tối đa là 1.5
    bloom: true     // Bật/tắt hiệu ứng phát sáng
};

const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;

// --- TỐI ƯU 2: Cấu hình Renderer ---
const renderer = new THREE.WebGLRenderer({
    antialias: false, // Tắt antialias vì đã dùng Bloom và Post-processing (tiết kiệm GPU)
    alpha: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true
});
scene.background = new THREE.Color(0x282c34);
renderer.setSize(w, h);
renderer.setPixelRatio(config.pixelRatio); // Áp dụng giới hạn pixel

const container = document.getElementById("portfolio-container-1");
container.appendChild(renderer.domElement);

let mousePos = new THREE.Vector2();

// Khởi tạo Rapier
await RAPIER.init();
const gravity = { x: 0.0, y: 0.0, z: 0.0 };
const world = new RAPIER.World(gravity);

// --- TỐI ƯU 3: Post-processing nhẹ hơn ---
const renderTarget = new THREE.WebGLRenderTarget(w * config.pixelRatio, h * config.pixelRatio, {
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType, // Dùng HalfFloat nhẹ hơn chút so với Float mặc định trên một số GPU
    encoding: THREE.sRGBEncoding
});
const composer = new EffectComposer(renderer, renderTarget);

const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

if (config.bloom) {
    // Giảm resolution của Bloom xuống 1/2 để nhẹ hơn
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.0, 0.0, 0.005);
    // Tinh chỉnh lại bloom cho đẹp dù độ phân giải thấp
    bloomPass.strength = 0.3;
    bloomPass.radius = 0.4;
    bloomPass.threshold = 0.1;
    composer.addPass(bloomPass);
}

const hemiLight = new THREE.HemisphereLight(0x00bbff, 0xaa00ff);
hemiLight.intensity = 0.8;
scene.add(hemiLight);

// Tạo các vật thể động
const bodies = [];
for (let i = 0; i < config.numBodies; i++) {
    const body = getBody({ debug: false, RAPIER, world });
    bodies.push(body);
    if (body.mesh) scene.add(body.mesh);
}

const mouseBall = getMouseBall(RAPIER, world);
scene.add(mouseBall.mesh);

const metaMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1,
    vertexColors: true,
});

// Khởi tạo Marching Cubes với độ phân giải thấp hơn
const metaballs = new MarchingCubes(
    config.resolution,
    metaMat,
    true,
    true,
    60000
);
metaballs.scale.setScalar(6.5);
metaballs.isolation = 1000;
scene.add(metaballs);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Vật lý
    world.step();
    mouseBall.update(mousePos);

    // Cập nhật metaballs
    metaballs.reset();
    const strength = 0.8;
    const subtract = 10;

    // Gom vòng lặp để tối ưu
    for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const { x, y, z } = b.update();
        // Chỉ thêm bóng nếu nó nằm trong khung nhìn (cơ bản) để tránh tính toán thừa
        if (Math.abs(x) < 10 && Math.abs(y) < 10) {
            metaballs.addBall(x, y, z, strength, subtract, b.color.getHex());
        }
    }

    metaballs.update();
    composer.render();
}
animate();

// Sự kiện resize (đã tối ưu debounce nếu cần, nhưng cơ bản giữ nguyên cũng ổn)
function handleWindowResize() {
    const newW = window.innerWidth;
    const newH = window.innerHeight;

    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
    composer.setSize(newW, newH);
}
window.addEventListener('resize', handleWindowResize, false);

function handleMouseMove(evt) {
    mousePos.x = (evt.clientX / window.innerWidth) * 2 - 1;
    mousePos.y = -(evt.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', handleMouseMove, false);