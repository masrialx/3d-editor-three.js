import * as THREE from 'three';
import { DEFAULT_COLORS, OBJECT_TYPES } from './constants.js';
import { generateUUID } from './utils.js';

const objects = []; // Central registry of editable objects

export function getObjects() {
    return objects;
}

export function clearObjectsArray() {
    objects.length = 0;
}

function createMesh(geometry, color, name, type) {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.userData = {
        isEditable: true,
        type,
        id: generateUUID()
    };
    mesh.name = name;

    mesh.position.set(
        (Math.random() - 0.5) * 5,
        0.5 + Math.random() * 2,
        (Math.random() - 0.5) * 5
    );

    return mesh;
}

export function addBox(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = createMesh(geometry, DEFAULT_COLORS[OBJECT_TYPES.BOX], 'Box', OBJECT_TYPES.BOX);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addSphere(scene) {
    const geometry = new THREE.SphereGeometry(0.6, 32, 16);
    const mesh = createMesh(geometry, DEFAULT_COLORS[OBJECT_TYPES.SPHERE], 'Sphere', OBJECT_TYPES.SPHERE);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addCylinder(scene) {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
    const mesh = createMesh(geometry, DEFAULT_COLORS[OBJECT_TYPES.CYLINDER], 'Cylinder', OBJECT_TYPES.CYLINDER);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addObjectToRegistry(mesh) {
    objects.push(mesh);
}