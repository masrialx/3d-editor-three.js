import * as THREE from 'three';
import { getObjects, addObjectToRegistry, clearObjectsArray } from './objects.js';
import { disposeObject, isValidNumberArray, safeParseNumber, generateUUID, validatePosition, clampPosition, validateScale, clampScale, validateRotation, clampRotation } from './utils.js';
import { DEFAULT_COLORS, EXPORT_FILE_NAME, OBJECT_TYPES, DEFAULT_DIMENSIONS, SCALE_LIMITS } from './constants.js';

const SCENE_VERSION = '1.0.0';

export function serializeScene(camera = null, orbitControls = null) {
    const objects = getObjects();
    const sceneData = {
        version: SCENE_VERSION,
        timestamp: Date.now(),
        objects: objects.map((obj) => ({
            type: obj.userData.type,
            id: obj.userData.id || generateUUID(),
            name: obj.userData.name || obj.name,
            position: obj.position.toArray(),
            rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            scale: obj.scale.toArray(),
            color: obj.material.color.getHex()
        }))
    };
    
    // Industry standard: Save camera position and angle for restoration
    if (camera && orbitControls) {
        sceneData.camera = {
            position: camera.position.toArray(),
            target: orbitControls.target.toArray(),
            fov: camera.fov
        };
    }
    
    return sceneData;
}

export function exportScene(camera = null, orbitControls = null) {
    try {
        const data = serializeScene(camera, orbitControls);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = EXPORT_FILE_NAME;
        link.click();
        
        URL.revokeObjectURL(url);
        
        // Professional feedback
        showNotification('Scene exported successfully!', 'success');
    } catch (error) {
        showNotification('Failed to export scene: ' + error.message, 'error');
    }
}

function buildGeometry(type) {
    switch (type) {
        case OBJECT_TYPES.BOX:
            return new THREE.BoxGeometry(1, 1, 1);
        case OBJECT_TYPES.SPHERE:
            return new THREE.SphereGeometry(0.6, 32, 16);
        case OBJECT_TYPES.CYLINDER:
            return new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
        default:
            return null;
    }
}

function validateItem(item) {
    if (!item || typeof item !== 'object') return false;
    if (!Object.values(OBJECT_TYPES).includes(item.type)) return false;
    if (!isValidNumberArray(item.position, 3)) return false;
    if (!isValidNumberArray(item.scale, 3)) return false;
    if (!Array.isArray(item.rotation) || item.rotation.length < 3) return false;
    if (![0, 1, 2].every((i) => Number.isFinite(item.rotation[i]))) return false;
    return true;
}

export function loadSceneData(data, scene, selectionManager, camera = null, orbitControls = null) {
    // Handle both old format (array) and new format (object with version)
    let objectsData = [];
    let version = 'unknown';
    let cameraData = null;
    
    if (Array.isArray(data)) {
        // Legacy format
        objectsData = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.objects)) {
        // New format with version
        objectsData = data.objects;
        version = data.version || 'unknown';
        cameraData = data.camera || null;
    } else {
        throw new Error('Invalid format: root should be an array or object with objects array');
    }

    selectionManager.deselect();
    const existingObjects = [...getObjects()];
    existingObjects.forEach((obj) => {
        scene.remove(obj);
        disposeObject(obj);
    });
    clearObjectsArray();

    let loadedCount = 0;
    let skippedCount = 0;

    objectsData.forEach((item) => {
        if (!validateItem(item)) {
            skippedCount++;
            return;
        }

        const geometry = buildGeometry(item.type);
        if (!geometry) {
            skippedCount++;
            return;
        }

        const material = new THREE.MeshStandardMaterial({
            color: safeParseNumber(item.color, DEFAULT_COLORS[item.type])
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Restore position with validation
        mesh.position.fromArray(item.position);
        if (!validatePosition(mesh.position)) {
            const clamped = clampPosition(mesh.position);
            mesh.position.copy(clamped);
        }

        // Restore rotation with validation
        mesh.rotation.fromArray(item.rotation.slice(0, 3));
        if (!validateRotation(mesh.rotation)) {
            const clamped = clampRotation(mesh.rotation);
            mesh.rotation.copy(clamped);
        }

        // Restore scale with validation
        mesh.scale.fromArray(item.scale);
        // Ensure scale is within limits
        if (!validateScale(mesh.scale)) {
            const clamped = clampScale(mesh.scale);
            mesh.scale.copy(clamped);
        }

        // Restore metadata
        const objectId = item.id || generateUUID();
        mesh.userData = {
            isEditable: true,
            type: item.type,
            id: objectId,
            name: item.name || `${item.type}-${objectId.substring(0, 4)}`,
            createdAt: item.createdAt || Date.now()
        };
        mesh.name = mesh.userData.name;
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);
        addObjectToRegistry(mesh);
        loadedCount++;
    });

    // Industry standard: Restore camera position and angle if available
    if (cameraData && camera && orbitControls) {
        try {
            if (isValidNumberArray(cameraData.position, 3)) {
                camera.position.fromArray(cameraData.position);
            }
            if (isValidNumberArray(cameraData.target, 3)) {
                orbitControls.target.fromArray(cameraData.target);
            }
            if (Number.isFinite(cameraData.fov) && cameraData.fov > 0 && cameraData.fov < 180) {
                camera.fov = cameraData.fov;
                camera.updateProjectionMatrix();
            }
            camera.lookAt(orbitControls.target);
        } catch (error) {
            console.warn('Could not restore camera position:', error);
        }
    }

    if (skippedCount > 0) {
        showNotification(`Loaded ${loadedCount} objects, skipped ${skippedCount} invalid entries.`, 'warning');
    } else {
        showNotification(`Scene loaded successfully! (${loadedCount} objects, version: ${version})`, 'success');
    }
    
    return { loadedCount, skippedCount, cameraRestored: !!cameraData };
}

export function importScene(jsonString, scene, selectionManager, camera = null, orbitControls = null) {
    try {
        // Validate JSON size (prevent memory issues)
        if (jsonString.length > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('File too large (max 10MB)');
        }

        const data = JSON.parse(jsonString);
        return loadSceneData(data, scene, selectionManager, camera, orbitControls);
    } catch (error) {
        showNotification('Failed to load JSON: ' + error.message, 'error');
        console.error('Import error:', error);
        return null;
    }
}

// Professional notification system
export function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
