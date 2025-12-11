import * as THREE from 'three';
import { getObjects } from './objects.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;
let hoveredObject = null;
let outlinePass = null;

// Create outline effect using a simple approach
function createOutlineEffect(renderer, scene, camera) {
    // Store original materials for outline effect
    const originalMaterials = new WeakMap();
    
    return {
        highlight: (object) => {
            if (!object) return;
            
            // Store original material if not already stored
            if (!originalMaterials.has(object)) {
                originalMaterials.set(object, object.material);
            }
            
            // Create outline material
            const outlineMaterial = object.material.clone();
            outlineMaterial.emissive.setHex(0x007acc);
            outlineMaterial.emissiveIntensity = 0.5;
            object.material = outlineMaterial;
        },
        clear: () => {
            // Restore all original materials
            originalMaterials.forEach((originalMaterial, object) => {
                if (object && object.material) {
                    object.material = originalMaterial;
                }
            });
            originalMaterials.clear();
        },
        hover: (object) => {
            // Clear previous hover
            if (hoveredObject && hoveredObject !== selectedObject) {
                if (originalMaterials.has(hoveredObject)) {
                    hoveredObject.material = originalMaterials.get(hoveredObject);
                } else {
                    hoveredObject.material.emissive.setHex(0x000000);
                }
            }
            
            hoveredObject = object;
            
            // Apply hover effect
            if (object && object !== selectedObject) {
                if (!originalMaterials.has(object)) {
                    originalMaterials.set(object, object.material);
                }
                const hoverMaterial = object.material.clone();
                hoverMaterial.emissive.setHex(0x333333);
                hoverMaterial.emissiveIntensity = 0.3;
                object.material = hoverMaterial;
            }
        },
        clearHover: () => {
            if (hoveredObject && hoveredObject !== selectedObject) {
                if (originalMaterials.has(hoveredObject)) {
                    hoveredObject.material = originalMaterials.get(hoveredObject);
                } else {
                    hoveredObject.material.emissive.setHex(0x000000);
                }
                hoveredObject = null;
            }
        }
    };
}

export function initSelection(camera, canvas, transformControl, onSelectCallback, requestRender) {
    outlinePass = createOutlineEffect(null, null, camera);
    
    function onPointerMove(event) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Hover preview
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(getObjects(), false);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object !== hoveredObject && object !== selectedObject) {
                outlinePass.hover(object);
                canvas.style.cursor = 'pointer';
                requestRender();
            }
        } else {
            outlinePass.clearHover();
            canvas.style.cursor = 'default';
            requestRender();
        }
    }

    function onPointerDown(event) {
        if (event.button !== 0) return; // Only left click
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

        // Clear previous selection
        if (selectedObject) {
            if (selectedObject.material.emissive) {
                selectedObject.material.emissive.setHex(0x000000);
            }
        }

        selectedObject = object;
        transformControl.attach(object);
        transformControl.visible = true;

        // Visual feedback: selection highlight
        if (object.material.emissive) {
            object.material.emissive.setHex(0x007acc);
            object.material.emissiveIntensity = 0.6;
        }

        // Clear hover on selection
        outlinePass.clearHover();
        hoveredObject = null;

        onSelectCallback(object);
    }

    function deselect() {
        if (selectedObject) {
            if (selectedObject.material.emissive) {
                selectedObject.material.emissive.setHex(0x000000);
            }
        }
        selectedObject = null;
        transformControl.detach();
        transformControl.visible = false;
        onSelectCallback(null);
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);

    return {
        getSelected: () => selectedObject,
        deselect,
        selectObject: (obj) => {
            selectObject(obj);
            requestRender();
        },
        dispose: () => {
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
        }
    };
}
