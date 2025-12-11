import * as THREE from 'three';
import { DEFAULT_COLORS, OBJECT_TYPES, DEFAULT_DIMENSIONS, WORKSPACE_BOUNDS, GRID_CONFIG } from './constants.js';
import { generateUUID, getObjectHeight, findNonOverlappingPosition, validatePosition, clampPosition } from './utils.js';

const objects = []; // Central registry of editable objects

export function getObjects() {
    return objects;
}

export function clearObjectsArray() {
    objects.length = 0;
}

function createMesh(geometry, color, name, type, options = {}) {
    const {
        snapToGrid = false,
        gridSize = GRID_CONFIG.size,
        position = null, // If provided, use it; otherwise use default origin placement
        checkOverlap = true
    } = options;

    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Professional metadata with UUID and timestamps
    mesh.userData = {
        isEditable: true,
        type,
        id: generateUUID(),
        createdAt: Date.now(),
        name: name || `${type}-${mesh.userData.id.substring(0, 4)}`
    };
    mesh.name = mesh.userData.name;

    // Calculate object height for proper ground alignment
    const objectHeight = getObjectHeight(geometry, type);

    // Professional default placement: at origin (0, objectHeight, 0) so object rests on grid
    let x = 0;
    let y = objectHeight; // Half height above ground
    let z = 0;

    // If position provided, use it (for manual placement)
    if (position) {
        x = position.x;
        y = position.y;
        z = position.z;
    }

    // If snap to grid is enabled, snap to grid units
    if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
        z = Math.round(z / gridSize) * gridSize;
        // Ensure minimum height to prevent sinking
        y = Math.max(y, gridSize * 0.5);
    }

    // Validate and clamp position to workspace bounds
    const testPos = new THREE.Vector3(x, y, z);
    if (!validatePosition(testPos)) {
        const clamped = clampPosition(testPos);
        x = clamped.x;
        y = clamped.y;
        z = clamped.z;
    }

    // Check for overlaps and find alternative position if needed
    let positionShifted = false;
    if (checkOverlap) {
        const existingObjects = objects.filter(obj => obj !== mesh);
        if (existingObjects.length > 0) {
            const originalPos = new THREE.Vector3(x, y, z);
            const finalPos = findNonOverlappingPosition(
                originalPos,
                mesh,
                existingObjects,
                snapToGrid ? gridSize : 0.5
            );
            
            // Check if position was shifted
            if (finalPos.distanceTo(originalPos) > 0.1) {
                positionShifted = true;
            }
            
            x = finalPos.x;
            y = finalPos.y;
            z = finalPos.z;
        }
    }
    
    // Store if position was shifted for notification
    if (positionShifted) {
        mesh.userData.positionShifted = true;
    }

    mesh.position.set(x, y, z);

    // Default rotation: (0, 0, 0) - upright and predictable
    mesh.rotation.set(0, 0, 0);

    // Default scale: (1, 1, 1) - uniform scale
    mesh.scale.set(1, 1, 1);

    return mesh;
}

export function addBox(scene, options = {}) {
    const dims = DEFAULT_DIMENSIONS[OBJECT_TYPES.BOX];
    const geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
    const mesh = createMesh(geometry, DEFAULT_COLORS[OBJECT_TYPES.BOX], 'Box', OBJECT_TYPES.BOX, options);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addSphere(scene, options = {}) {
    const dims = DEFAULT_DIMENSIONS[OBJECT_TYPES.SPHERE];
    const geometry = new THREE.SphereGeometry(dims.radius, 32, 16);
    const mesh = createMesh(geometry, DEFAULT_COLORS[OBJECT_TYPES.SPHERE], 'Sphere', OBJECT_TYPES.SPHERE, options);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addCylinder(scene, options = {}) {
    const dims = DEFAULT_DIMENSIONS[OBJECT_TYPES.CYLINDER];
    const geometry = new THREE.CylinderGeometry(dims.radius, dims.radius, dims.height, 32);
    const mesh = createMesh(geometry, DEFAULT_COLORS[OBJECT_TYPES.CYLINDER], 'Cylinder', OBJECT_TYPES.CYLINDER, options);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
}

export function addObjectToRegistry(mesh) {
    if (!objects.includes(mesh)) {
    objects.push(mesh);
}
}

export function removeObjectFromRegistry(mesh) {
    const index = objects.indexOf(mesh);
    if (index > -1) {
        objects.splice(index, 1);
    }
}
