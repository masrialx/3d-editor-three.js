import * as THREE from 'three';
import { getObjects, addObjectToRegistry, clearObjectsArray } from './objects.js';
import { disposeObject } from './utils.js';

export function exportScene() {
    const objects = getObjects();
    const data = objects.map(obj => ({
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
    link.download = 'scene-data.json';
    link.click();
}

export function importScene(jsonString, scene, selectionManager) {
    try {
        const data = JSON.parse(jsonString);

        if (!Array.isArray(data)) throw new Error("Invalid Format");

        // 1. Clear current scene
        selectionManager.deselect();
        const existingObjects = [...getObjects()];
        existingObjects.forEach(obj => {
            scene.remove(obj);
            disposeObject(obj);
        });
        clearObjectsArray();

        // 2. Rebuild Scene
        data.forEach(item => {
            let geometry;
            if (item.type === 'box') geometry = new THREE.BoxGeometry(1, 1, 1);
            else if (item.type === 'sphere') geometry = new THREE.SphereGeometry(0.6, 32, 16);
            else if (item.type === 'cylinder') geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
            else return; // Skip unknown

            const material = new THREE.MeshStandardMaterial({ color: item.color || 0xffffff });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Restore Transforms
            mesh.position.fromArray(item.position);
            mesh.rotation.fromArray(item.rotation.slice(0, 3)); // Ensure only x,y,z used
            mesh.scale.fromArray(item.scale);

            mesh.userData = { isEditable: true, type: item.type };
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            scene.add(mesh);
            addObjectToRegistry(mesh);
        });

        alert("Scene loaded successfully!");

    } catch (e) {
        console.error(e);
        alert("Failed to load JSON. Check format.");
    }
}