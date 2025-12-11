import * as THREE from 'three';
import { getObjects } from './objects.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

export function initSelection(camera, canvas, transformControl, onSelectCallback, requestRender) {
    function onPointerDown(event) {
        if (event.button !== 0) return;
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        checkIntersection();
    }

    function checkIntersection() {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(getObjects(), false);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            selectObject(object);
        } else {
            deselect();
        }
        requestRender();
    }

    function selectObject(object) {
        if (selectedObject === object) return;

        if (selectedObject && selectedObject.material.emissive) {
            selectedObject.material.emissive.setHex(0x000000);
        }

        selectedObject = object;
        transformControl.attach(object);

        if (object.material.emissive) {
            object.material.emissive.setHex(0x333333);
        }

        onSelectCallback(object);
    }

    function deselect() {
        if (selectedObject && selectedObject.material.emissive) {
            selectedObject.material.emissive.setHex(0x000000);
        }
        selectedObject = null;
        transformControl.detach();
        onSelectCallback(null);
    }

    canvas.addEventListener('pointerdown', onPointerDown);

    return {
        getSelected: () => selectedObject,
        deselect,
        dispose: () => canvas.removeEventListener('pointerdown', onPointerDown)
    };
}