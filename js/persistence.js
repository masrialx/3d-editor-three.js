import * as THREE from 'three';
import { getObjects, addObjectToRegistry, clearObjectsArray } from './objects.js';
import { disposeObject, isValidNumberArray, safeParseNumber } from './utils.js';
import { DEFAULT_COLORS, EXPORT_FILE_NAME, OBJECT_TYPES } from './constants.js';

export function exportScene() {
    const objects = getObjects();
    const data = objects.map((obj) => ({
        type: obj.userData.type,
        position: obj.position.toArray(),
        rotation: obj.rotation.toArray(),
        scale: obj.scale.toArray(),
        color: obj.material.color.getHex()
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = EXPORT_FILE_NAME;
    link.click();
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
    if (!isValidNumberArray(item.rotation, 3)) return false;
    return true;
}

export function importScene(jsonString, scene, selectionManager) {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data)) throw new Error('Invalid format: root should be an array');

        selectionManager.deselect();
        const existingObjects = [...getObjects()];
        existingObjects.forEach((obj) => {
            scene.remove(obj);
            disposeObject(obj);
        });
        clearObjectsArray();

        data.forEach((item) => {
            if (!validateItem(item)) {
                return;
            }

            const geometry = buildGeometry(item.type);
            if (!geometry) return;

            const material = new THREE.MeshStandardMaterial({
                color: safeParseNumber(item.color, DEFAULT_COLORS[item.type])
            });
            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.fromArray(item.position);
            mesh.rotation.fromArray(item.rotation.slice(0, 3));
            mesh.scale.fromArray(item.scale);

            mesh.userData = { isEditable: true, type: item.type };
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            scene.add(mesh);
            addObjectToRegistry(mesh);
        });

        alert('Scene loaded successfully!');
    } catch (e) {
        alert('Failed to load JSON. Please verify the file content.');
    }
}