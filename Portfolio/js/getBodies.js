import * as THREE from "three";

const sceneMiddle = new THREE.Vector3(0, 0, 0);

const metaOffset = new THREE.Vector3(0.5, 0.5, 0.5);

function getBody({ debug = false, RAPIER, world }) {
    const size = 0.2;
    const range = 3;
    const density = 0.5;
    let x = Math.random() * range - range * 0.5;
    let y = Math.random() * range - range * 0.5 + 3;
    let z = Math.random() * range - range * 0.5;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, y, z)
        .setLinearDamping(2);
    const rigid = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
    world.createCollider(colliderDesc, rigid);

    const color = new THREE.Color().setHSL(Math.random(), 1, 0.5);

    let mesh;
    if (debug) {
        const geometry = new THREE.IcosahedronGeometry(size, 3);
        const material = new THREE.MeshBasicMaterial({ color });
        mesh = new THREE.Mesh(geometry, material);
    }

    function update() {
        rigid.resetForces(true);
        const { x, y, z } = rigid.translation();
        const pos = new THREE.Vector3(x, y, z);
        const dir = pos.clone().sub(sceneMiddle).normalize();
        rigid.addForce(dir.multiplyScalar(-0.3), true);

        if (debug && mesh) {
            mesh.position.copy(pos);
        }

        // Chuẩn hóa vị trí để phù hợp với MarchingCubes (0–1)
        const metaPos = pos.clone().multiplyScalar(0.1).add(metaOffset);
        return { x: metaPos.x, y: metaPos.y, z: metaPos.z };
    }

    return { rigid, mesh, color, update };
}

function getMouseBall (RAPIER, world) {
    const mouseSize = 0.25;
    const geometry = new THREE.IcosahedronGeometry(mouseSize, 8);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
    });
    const mouseLight = new THREE.PointLight(0xffffff, 1);
    const mouseMesh = new THREE.Mesh(geometry, material);
    mouseMesh.add(mouseLight);
    // RIGID BODY
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
    let mouseRigid = world.createRigidBody(bodyDesc);
    let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 3.0);
    world.createCollider(dynamicCollider, mouseRigid);
    function update (mousePos) {
        mouseRigid.setTranslation({ x: mousePos.x * 5, y: mousePos.y * 5, z: 0.2 });
        let { x, y, z } = mouseRigid.translation();
        mouseMesh.position.set(x, y, z);
    }
    return { mesh: mouseMesh, update };
}

export { getBody, getMouseBall };