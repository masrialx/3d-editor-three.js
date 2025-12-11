import * as THREE from 'three';
import { WORKSPACE_BOUNDS, SCALE_LIMITS, ROTATION_LIMITS } from './constants.js';

export function disposeObject(object) {
    if (!object) return;
    if (object.geometry) object.geometry.dispose();

    if (object.material) {
        if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
        } else {
            object.material.dispose();
        }
    }
}

export function generateUUID() {
    return Math.random().toString(36).substring(2, 9);
}

export function safeParseNumber(value, fallback = 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function isValidNumberArray(arr, expectedLength) {
    return (
        Array.isArray(arr) &&
        arr.length === expectedLength &&
        arr.every((v) => Number.isFinite(v))
    );
}

// Professional validation functions
export function validatePosition(position) {
    return (
        position.x >= WORKSPACE_BOUNDS.minX && position.x <= WORKSPACE_BOUNDS.maxX &&
        position.y >= WORKSPACE_BOUNDS.minY && position.y <= WORKSPACE_BOUNDS.maxY &&
        position.z >= WORKSPACE_BOUNDS.minZ && position.z <= WORKSPACE_BOUNDS.maxZ
    );
}

export function clampPosition(position) {
    return new THREE.Vector3(
        Math.max(WORKSPACE_BOUNDS.minX, Math.min(WORKSPACE_BOUNDS.maxX, position.x)),
        Math.max(WORKSPACE_BOUNDS.minY, Math.min(WORKSPACE_BOUNDS.maxY, position.y)),
        Math.max(WORKSPACE_BOUNDS.minZ, Math.min(WORKSPACE_BOUNDS.maxZ, position.z))
    );
}

export function validateRotation(rotation) {
    const degX = (rotation.x * 180) / Math.PI;
    const degY = (rotation.y * 180) / Math.PI;
    const degZ = (rotation.z * 180) / Math.PI;
    
    return (
        degX >= ROTATION_LIMITS.min && degX <= ROTATION_LIMITS.max &&
        degY >= ROTATION_LIMITS.min && degY <= ROTATION_LIMITS.max &&
        degZ >= ROTATION_LIMITS.min && degZ <= ROTATION_LIMITS.max
    );
}

export function clampRotation(rotation) {
    const clampDeg = (deg) => {
        deg = deg % 360;
        if (deg < 0) deg += 360;
        return (deg * Math.PI) / 180;
    };
    
    return new THREE.Euler(
        clampDeg((rotation.x * 180) / Math.PI),
        clampDeg((rotation.y * 180) / Math.PI),
        clampDeg((rotation.z * 180) / Math.PI)
    );
}

export function validateScale(scale) {
    return (
        scale.x >= SCALE_LIMITS.min && scale.x <= SCALE_LIMITS.max &&
        scale.y >= SCALE_LIMITS.min && scale.y <= SCALE_LIMITS.max &&
        scale.z >= SCALE_LIMITS.min && scale.z <= SCALE_LIMITS.max
    );
}

export function clampScale(scale) {
    return new THREE.Vector3(
        Math.max(SCALE_LIMITS.min, Math.min(SCALE_LIMITS.max, scale.x)),
        Math.max(SCALE_LIMITS.min, Math.min(SCALE_LIMITS.max, scale.y)),
        Math.max(SCALE_LIMITS.min, Math.min(SCALE_LIMITS.max, scale.z))
    );
}

// Check if two objects overlap (bounding box intersection)
export function checkObjectOverlap(obj1, obj2) {
    const box1 = new THREE.Box3().setFromObject(obj1);
    const box2 = new THREE.Box3().setFromObject(obj2);
    return box1.intersectsBox(box2);
}

// Find a non-overlapping position near the target
export function findNonOverlappingPosition(targetPos, object, existingObjects, gridSize = 1) {
    const testPos = targetPos.clone();
    const maxAttempts = 50;
    let attempts = 0;
    
    // Create a temporary object at test position to check overlap
    const tempObj = object.clone();
    tempObj.position.copy(testPos);
    
    while (attempts < maxAttempts) {
        let hasOverlap = false;
        
        for (const existing of existingObjects) {
            if (checkObjectOverlap(tempObj, existing)) {
                hasOverlap = true;
                break;
            }
        }
        
        if (!hasOverlap) {
            return testPos;
        }
        
        // Shift position in a spiral pattern
        const angle = (attempts * 0.5) * Math.PI;
        const radius = Math.floor(attempts / 4) + 1;
        testPos.x = targetPos.x + Math.cos(angle) * radius * gridSize;
        testPos.z = targetPos.z + Math.sin(angle) * radius * gridSize;
        testPos.y = targetPos.y; // Keep Y the same
        
        // Ensure within bounds
        testPos.x = Math.max(WORKSPACE_BOUNDS.minX, Math.min(WORKSPACE_BOUNDS.maxX, testPos.x));
        testPos.z = Math.max(WORKSPACE_BOUNDS.minZ, Math.min(WORKSPACE_BOUNDS.maxZ, testPos.z));
        
        tempObj.position.copy(testPos);
        attempts++;
    }
    
    // If no position found, return original (will show warning)
    return targetPos;
}

// Calculate object height for proper ground alignment
export function getObjectHeight(geometry, type) {
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);
        return size.y / 2; // Half height for bottom alignment
    }
    // Fallback: use known dimensions for standard primitives
    switch (type) {
        case 'box':
            return 0.5; // Box height 1, half = 0.5
        case 'sphere':
            return 0.5; // Sphere radius 0.5
        case 'cylinder':
            return 0.5; // Cylinder height 1, half = 0.5
        default:
            return 0.5; // Safe default
    }
}
