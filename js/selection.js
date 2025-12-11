import * as THREE from 'three';
import { getObjects } from './objects.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;
let hoveredObject = null;
let outlinePass = null;

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
    
    // Track if transform controls are active to prevent raycasting interference
    let isTransformActive = false;
    
    // Listen to transform control events to know when it's active
    if (transformControl) {
        transformControl.addEventListener('dragging-changed', (event) => {
            isTransformActive = event.value;
        });
    }
    
    function onPointerMove(event) {
        // Don't process hover if dragging transform or transform is active
        if (getIsDragging && getIsDragging()) {
            return;
        }
        if (isTransformActive) {
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
        // Only handle left click
        if (event.button !== 0) return;
        
        // CRITICAL: Don't process selection if transform controls are active or dragging
        if (getIsDragging && getIsDragging()) {
            return;
        }
        if (isTransformActive) {
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        // Check all objects for selection (exclude transform controls by only checking editable objects)
        const intersects = raycaster.intersectObjects(getObjects(), false);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Check if this is the currently selected object
            if (object === selectedObject) {
                // Clicking on selected object - keep selection, don't change
                return;
            }
            
            // Instant selection - select immediately on first click
            selectObject(object);
        } else {
            // Clicked empty space - deselect
            deselect();
        }
        
        requestRender();
    }

    function selectObject(object) {
        // Prevent selection if transform is active
        if (isTransformActive || (getIsDragging && getIsDragging())) {
            return;
        }
        
        if (selectedObject === object) return;
        
        // Clear previous selection highlight (only visual, no transform modification)
        if (selectedObject) {
            if (selectedObject.material && selectedObject.material.emissive !== undefined) {
                selectedObject.material.emissive.setHex(0x000000);
                selectedObject.material.emissiveIntensity = 0;
            }
        }

        selectedObject = object;
        
        // Attach transform control (this only shows handles, doesn't modify object transform)
        // The transform control handles are separate from the object itself
        transformControl.attach(object);
        transformControl.visible = true;
        
        // Set pivot to object center (industry standard)
        transformControl.setSpace('world');
        
        // Professional: Update OrbitControls target to object center for proper zoom behavior
        // This ensures zoom, rotate, and pan behave around the object center
        if (orbitControls) {
            orbitControls.target.copy(object.position);
        }

        // Visual feedback: selection highlight (ONLY visual, no position/rotation/scale modification)
        // We only modify the emissive property for highlighting, not the object's transform
        if (object.material && object.material.emissive !== undefined) {
            object.material.emissive.setHex(0x007acc);
            object.material.emissiveIntensity = 0.6;
        }

        // Clear hover on selection
        outlinePass.clearHover();
        hoveredObject = null;

        onSelectCallback(object);
    }

    function deselect() {
        // Don't deselect if dragging or transform is active
        if (isTransformActive || (getIsDragging && getIsDragging())) {
            return;
        }
        
        if (selectedObject) {
            if (selectedObject.material && selectedObject.material.emissive) {
                selectedObject.material.emissive.setHex(0x000000);
                selectedObject.material.emissiveIntensity = 0;
            }
        }
        selectedObject = null;
        transformControl.detach();
        transformControl.visible = false;
        onSelectCallback(null);
    }

    // Use pointerdown only for instant, smooth selection
    // Remove pointerup to prevent double-click issues
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
