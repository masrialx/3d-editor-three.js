import * as THREE from 'three';
import { getObjects } from './objects.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;
let hoveredObject = null;
let outlinePass = null;
let isDraggingTransform = false; // Track if transform is being dragged

// Create outline effect using a simple approach
function createOutlineEffect(renderer, scene, camera) {
    const originalMaterials = new WeakMap();
    
    return {
        highlight: (object) => {
            if (!object) return;
            
            if (!originalMaterials.has(object)) {
                originalMaterials.set(object, object.material);
            }
            
            const outlineMaterial = object.material.clone();
            outlineMaterial.emissive.setHex(0x007acc);
            outlineMaterial.emissiveIntensity = 0.5;
            object.material = outlineMaterial;
        },
        clear: () => {
            originalMaterials.forEach((originalMaterial, object) => {
                if (object && object.material) {
                    object.material = originalMaterial;
                }
            });
            originalMaterials.clear();
        },
        hover: (object) => {
            if (hoveredObject && hoveredObject !== selectedObject) {
                if (originalMaterials.has(hoveredObject)) {
                    hoveredObject.material = originalMaterials.get(hoveredObject);
                } else {
                    hoveredObject.material.emissive.setHex(0x000000);
                }
            }
            
            hoveredObject = object;
            
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

export function initSelection(camera, canvas, transformControl, onSelectCallback, requestRender, getIsDragging, orbitControls = null) {
    outlinePass = createOutlineEffect(null, null, camera);
    
    // Track if we're currently dragging to prevent deselection
    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };
    const DRAG_THRESHOLD = 5; // pixels
    
    function onPointerMove(event) {
        // Don't process hover if dragging transform
        if (getIsDragging && getIsDragging()) {
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Hover preview - only if not dragging
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
        
        // Don't deselect if transform is being dragged
        if (getIsDragging && getIsDragging()) {
            return;
        }
        
        pointerDownTime = Date.now();
        pointerDownPos = { x: event.clientX, y: event.clientY };
        
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        checkIntersection();
    }
    
    function onPointerUp(event) {
        if (event.button !== 0) return;
        
        // Check if this was a click (not a drag)
        const pointerUpTime = Date.now();
        const timeDiff = pointerUpTime - pointerDownTime;
        const moveDist = Math.sqrt(
            Math.pow(event.clientX - pointerDownPos.x, 2) +
            Math.pow(event.clientY - pointerDownPos.y, 2)
        );
        
        // Only deselect if it was a click (short time, small movement) and not dragging transform
        if (timeDiff < 200 && moveDist < DRAG_THRESHOLD && !(getIsDragging && getIsDragging())) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Raycast priority: Transform handles > Selected object > Other objects > Ground
            raycaster.setFromCamera(mouse, camera);
            
            // First check if clicking on transform controls (handles)
            // TransformControls handles are part of the scene, so we check selected object first
            if (selectedObject) {
                const selectedIntersects = raycaster.intersectObject(selectedObject, false);
                if (selectedIntersects.length > 0) {
                    // Clicked on selected object - keep selection
                    return;
                }
            }
            
            // Then check other objects
            const intersects = raycaster.intersectObjects(getObjects(), false);
            
            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object !== selectedObject) {
                    selectObject(object);
                }
            } else {
                // Clicked empty space - deselect only if not dragging
                if (!(getIsDragging && getIsDragging())) {
                    deselect();
                }
            }
            requestRender();
        }
    }

    function checkIntersection() {
        // Raycast priority: Transform handles > Selected object > Other objects
        raycaster.setFromCamera(mouse, camera);
        
        // First check selected object (handles might be near it)
        if (selectedObject) {
            const selectedIntersects = raycaster.intersectObject(selectedObject, false);
            if (selectedIntersects.length > 0) {
                // Keep selection, don't change
                return;
            }
        }
        
        // Then check other objects
        const intersects = raycaster.intersectObjects(getObjects(), false);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            selectObject(object);
        } else {
            // Only deselect if not dragging
            if (!(getIsDragging && getIsDragging())) {
                deselect();
            }
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
        
        // Set pivot to object center (industry standard)
        transformControl.setSpace('world');
        
        // Professional: Update OrbitControls target to object center for proper zoom behavior
        // This ensures zoom, rotate, and pan behave around the object center
        if (orbitControls) {
            orbitControls.target.copy(object.position);
        }

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
        // Don't deselect if dragging
        if (getIsDragging && getIsDragging()) {
            return;
        }
        
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
    canvas.addEventListener('pointerup', onPointerUp);
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
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointermove', onPointerMove);
        }
    };
}
