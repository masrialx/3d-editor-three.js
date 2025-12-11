import * as THREE from 'three';

const objects = []; // Central registry of editable objects

export function getObjects() {
    return objects;
}

export function clearObjectsArray() {
    objects.length = 0;
}

function createMesh(geometry, color, name, type) {
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // User Data for persistence
    mesh.userData = {
        isEditable: true,
        type: type,
        id: Math.random().toString(36).substr(2, 9)
    };
    mesh.name = name;

    // Random Position near origin
    mesh.position.set(
        (Math.random() - 0.5) * 5,
        0.5 + (Math.random() * 2),
        (Math.random() - 0.5) * 5
    );

    return mesh;
}

export function addBox(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = createMesh(geometry, 0x007acc, 'Box', 'box');
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addSphere(scene) {
    const geometry = new THREE.SphereGeometry(0.6, 32, 16);
    const mesh = createMesh(geometry, 0xff6b6b, 'Sphere', 'sphere');
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addCylinder(scene) {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
    const mesh = createMesh(geometry, 0x4ecdc4, 'Cylinder', 'cylinder');
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addObjectToRegistry(mesh) {
    objects.push(mesh);
}