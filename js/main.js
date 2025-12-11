import * as THREE from 'three';
import { initScene } from './scene.js';
import { initControls } from './controls.js';
import { addBox, addSphere, addCylinder, getObjects, clearObjectsArray, removeObjectFromRegistry } from './objects.js';
import { initSelection } from './selection.js';
import { updateObjectPosition, updateObjectRotationDeg, updateObjectScale } from './transform.js';
import { exportScene, importScene, serializeScene, loadSceneData, showNotification } from './persistence.js';
import { disposeObject } from './utils.js';
import { OBJECT_TYPES } from './constants.js';
import { createHistory } from './history.js';
import { frameObjects, frameWorkspace, animateCameraTo } from './camera-utils.js';

const container = document.getElementById('canvas-container');

let renderPending = false;
let orbit = null;
let scene = null;
let camera = null;
let renderer = null;

const requestRender = () => {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => {
        renderPending = false;
        if (orbit) orbit.update();
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    });
};

const sceneInit = initScene(container, requestRender);
scene = sceneInit.scene;
camera = sceneInit.camera;
renderer = sceneInit.renderer;
const gridHelper = sceneInit.gridHelper;
const axesHelper = sceneInit.axesHelper;

// Ensure initial render happens immediately
requestRender();

let selectionManager = null;
let snapEnabled = false;
let snapConfig = {
    translate: 1,
    rotateDeg: 15,
    scale: 0.1
};
let history = null;

const ui = {
    posX: document.getElementById('pos-x'),
    posY: document.getElementById('pos-y'),
    posZ: document.getElementById('pos-z'),
    rotX: document.getElementById('rot-x'),
    rotY: document.getElementById('rot-y'),
    rotZ: document.getElementById('rot-z'),
    scaleX: document.getElementById('scale-x'),
    scaleY: document.getElementById('scale-y'),
    scaleZ: document.getElementById('scale-z'),
    panel: document.getElementById('properties-panel'),
    selId: document.getElementById('selected-id'),
    dims: document.getElementById('dims-label'),
    modeButtons: {
        translate: document.getElementById('mode-translate'),
        rotate: document.getElementById('mode-rotate'),
        scale: document.getElementById('mode-scale')
    },
    snapTranslate: document.getElementById('snap-translate'),
    snapRotate: document.getElementById('snap-rotate'),
    snapScale: document.getElementById('snap-scale')
};

function updateUI(object) {
    if (!object) {
        ui.panel.style.display = 'none';
        return;
    }
    ui.panel.style.display = 'block';
    const displayName = object.userData.name || object.userData.type || 'Unknown';
    ui.selId.textContent = `${displayName} (${object.userData.type})`;
    ui.posX.value = object.position.x.toFixed(2);
    ui.posY.value = object.position.y.toFixed(2);
    ui.posZ.value = object.position.z.toFixed(2);
    ui.rotX.value = (object.rotation.x * 180 / Math.PI).toFixed(1);
    ui.rotY.value = (object.rotation.y * 180 / Math.PI).toFixed(1);
    ui.rotZ.value = (object.rotation.z * 180 / Math.PI).toFixed(1);
    ui.scaleX.value = object.scale.x.toFixed(2);
    ui.scaleY.value = object.scale.y.toFixed(2);
    ui.scaleZ.value = object.scale.z.toFixed(2);
    
    // Professional dimension display
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    ui.dims.textContent = `Dimensions: ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`;
}

let transformSnapshotTaken = false;
const { orbit: orbitCtrl, transform, isDragging: getIsDragging } = initControls(camera, renderer, scene, {
    onTransformChange: (obj) => {
        updateUI(obj);
    },
    onTransformStart: () => {
        if (!transformSnapshotTaken && history) {
            history.record();
            transformSnapshotTaken = true;
        }
    },
    onTransformEnd: () => {
        transformSnapshotTaken = false;
        requestRender();
    },
    requestRender
});
orbit = orbitCtrl;

selectionManager = initSelection(
    camera,
    renderer.domElement,
    transform,
    (obj) => {
    updateUI(obj);
    },
    requestRender,
    getIsDragging
);

history = createHistory({
    serialize: () => serializeScene(camera, orbit),
    load: (data) => loadSceneData(data, scene, selectionManager, camera, orbit),
    requestRender
});
history.record(); // initial empty state

// Frame workspace after controls are initialized with smooth animation
setTimeout(() => {
    if (orbit && camera && scene && gridHelper) {
        try {
            const initialFrame = frameWorkspace(scene, camera, [], gridHelper);
            if (initialFrame && initialFrame.position) {
                // Smoothly animate to initial frame for better UX
                animateCameraTo(
                    camera,
                    initialFrame.position,
                    initialFrame.target,
                    orbit,
                    requestRender,
                    600
                );
            }
        } catch (error) {
            console.warn('Could not frame workspace initially:', error);
            // Keep default camera position but ensure it shows workspace
            camera.position.set(20, 20, 20);
            camera.lookAt(0, 10, 0);
            orbit.target.set(0, 10, 0);
            requestRender();
        }
    }
}, 100);

const snapToggle = document.getElementById('snap-toggle');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

function applySnap() {
    if (snapEnabled) {
        transform.setTranslationSnap(snapConfig.translate);
        transform.setRotationSnap((snapConfig.rotateDeg * Math.PI) / 180);
        transform.setScaleSnap(snapConfig.scale);
    } else {
        transform.setTranslationSnap(null);
        transform.setRotationSnap(null);
        transform.setScaleSnap(null);
    }
}

// Professional frame functions using camera utilities
function frameSelected() {
    try {
        const selected = selectionManager.getSelected();
        if (!selected) {
            showNotification('No object selected. Please select an object first.', 'warning');
            return;
        }
        
        const frame = frameObjects([selected], camera, 0.3);
        if (frame && frame.position && frame.target) {
            animateCameraTo(camera, frame.position, frame.target, orbit, requestRender, 400);
            showNotification('Framed selected object', 'success');
        } else {
            console.error('Invalid frame data:', frame);
            showNotification('Could not frame selected object', 'error');
        }
    } catch (error) {
        console.error('Error framing selected object:', error);
        showNotification('Error framing selected object: ' + error.message, 'error');
    }
}

function frameAll() {
    try {
        const objects = getObjects();
        if (objects.length === 0) {
            // Frame workspace if no objects
            const frame = frameWorkspace(scene, camera, [], gridHelper);
            if (frame && frame.position && frame.target) {
                orbit.target.set(0, 0, 0); // Reset pivot to origin
                animateCameraTo(camera, frame.position, frame.target, orbit, requestRender, 400);
                showNotification('Framed workspace', 'success');
            } else {
                console.error('Invalid frame data:', frame);
                showNotification('Could not frame workspace', 'error');
            }
            return;
        }
        
        const frame = frameObjects(objects, camera, 0.3);
        if (frame && frame.position && frame.target) {
            // Industry standard: OrbitControls pivot to scene center
            orbit.target.copy(frame.target);
            animateCameraTo(camera, frame.position, frame.target, orbit, requestRender, 400);
            showNotification(`Framed ${objects.length} object(s)`, 'success');
        } else {
            console.error('Invalid frame data:', frame);
            showNotification('Could not frame objects', 'error');
        }
    } catch (error) {
        console.error('Error framing all objects:', error);
        showNotification('Error framing objects: ' + error.message, 'error');
    }
}

// Check if object is visible in camera view
function isObjectInView(object, camera) {
    if (!object) return false;
    
    const box = new THREE.Box3().setFromObject(object);
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    return frustum.intersectsBox(box);
}

// Input handlers with snap support
['x', 'y', 'z'].forEach((axis) => {
    const input = document.getElementById(`pos-${axis}`);
    input.addEventListener('input', (e) => {
        const selected = selectionManager.getSelected();
        if (selected) {
            if (!transformSnapshotTaken) {
                history.record();
                transformSnapshotTaken = true;
            }
            const value = snapEnabled 
                ? Math.round(Number(e.target.value) / snapConfig.translate) * snapConfig.translate
                : e.target.value;
            updateObjectPosition(selected, axis, value);
            requestRender();
        }
    });
    input.addEventListener('blur', () => {
        transformSnapshotTaken = false;
    });
});

['x', 'y', 'z'].forEach((axis) => {
    const input = document.getElementById(`rot-${axis}`);
    input.addEventListener('input', (e) => {
        const selected = selectionManager.getSelected();
        if (selected) {
            if (!transformSnapshotTaken) {
                history.record();
                transformSnapshotTaken = true;
            }
            const value = snapEnabled
                ? Math.round(Number(e.target.value) / snapConfig.rotateDeg) * snapConfig.rotateDeg
                : e.target.value;
            updateObjectRotationDeg(selected, axis, value);
            requestRender();
        }
    });
    input.addEventListener('blur', () => {
        transformSnapshotTaken = false;
    });
});

['x', 'y', 'z'].forEach((axis) => {
    const input = document.getElementById(`scale-${axis}`);
    input.addEventListener('input', (e) => {
        const selected = selectionManager.getSelected();
        if (selected) {
            if (!transformSnapshotTaken) {
                history.record();
                transformSnapshotTaken = true;
            }
            const value = snapEnabled
                ? Math.round(Number(e.target.value) / snapConfig.scale) * snapConfig.scale
                : e.target.value;
            updateObjectScale(selected, axis, value);
            requestRender();
        }
    });
    input.addEventListener('blur', () => {
        transformSnapshotTaken = false;
    });
});

const addButtons = {
    [OBJECT_TYPES.BOX]: document.getElementById('add-box'),
    [OBJECT_TYPES.SPHERE]: document.getElementById('add-sphere'),
    [OBJECT_TYPES.CYLINDER]: document.getElementById('add-cylinder')
};

// Professional object creation with animation and camera framing
function addObjectWithHistory(type, addFn) {
    if (!history) return;
    history.record();
    
    // Create object with snap-to-grid option and conflict prevention
    const obj = addFn(scene, { 
        snapToGrid: snapEnabled,
        gridSize: snapConfig.translate || 1,
        checkOverlap: true
    });
    
    if (obj) {
        // Show notification if position was shifted due to overlap
        if (obj.userData.positionShifted) {
            showNotification('Object position adjusted to avoid overlap', 'warning');
            delete obj.userData.positionShifted;
        }
        
        // Subtle animation: start small and scale up
        obj.scale.set(0.1, 0.1, 0.1);
        const targetScale = 1;
        const duration = 200; // milliseconds
        const startTime = Date.now();
        
        function animateCreation() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out animation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentScale = 0.1 + (targetScale - 0.1) * easeProgress;
            obj.scale.set(currentScale, currentScale, currentScale);
            
            if (progress < 1) {
                requestAnimationFrame(animateCreation);
            } else {
                obj.scale.set(targetScale, targetScale, targetScale);
            }
            requestRender();
        }
        
        animateCreation();
        
        // Auto-select the new object
        selectionManager.selectObject(obj);
        
        // Professional camera framing: smoothly frame the new object and workspace
        frameNewObject(obj);
        
        // UI updates immediately (handled by selectObject callback)
        requestRender();
    }
}

// Frame newly created object smoothly with auto-adjustment
// Industry standard: OrbitControls pivot snaps to new object
function frameNewObject(object) {
    if (!object) return;
    
    // Get all objects including the new one
    const allObjects = getObjects();
    
    // Frame all objects to ensure workspace remains visible
    const frame = frameObjects(allObjects, camera, 0.3);
    
    // Industry standard: Snap OrbitControls pivot to new object center
    orbit.target.copy(object.position);
    
    // Smoothly animate camera to frame the new object
    animateCameraTo(camera, frame.position, frame.target, orbit, requestRender, 400);
}

addButtons[OBJECT_TYPES.BOX].addEventListener('click', () => {
    addObjectWithHistory(OBJECT_TYPES.BOX, addBox);
});

addButtons[OBJECT_TYPES.SPHERE].addEventListener('click', () => {
    addObjectWithHistory(OBJECT_TYPES.SPHERE, addSphere);
});

addButtons[OBJECT_TYPES.CYLINDER].addEventListener('click', () => {
    addObjectWithHistory(OBJECT_TYPES.CYLINDER, addCylinder);
});

document.getElementById('delete-btn').addEventListener('click', () => {
    const selected = selectionManager.getSelected();
    if (!selected) return;
    try {
        history.record();
        transform.detach();
        scene.remove(selected);
        disposeObject(selected);
        removeObjectFromRegistry(selected);
        selectionManager.deselect();
        requestRender();
    } catch (error) {
        console.error('Delete error:', error);
    }
});

document.getElementById('clear-scene').addEventListener('click', () => {
    if (!confirm('Clear all objects? This cannot be undone.')) return;
    history.record();
    selectionManager.deselect();
    const objects = [...getObjects()];
    objects.forEach((obj) => {
        scene.remove(obj);
        disposeObject(obj);
    });
    clearObjectsArray();
    
    // Industry standard: Frame workspace after clear
    setTimeout(() => {
        const frame = frameWorkspace(scene, camera, [], gridHelper);
        orbit.target.set(0, 0, 0); // Reset pivot to origin
        animateCameraTo(camera, frame.position, frame.target, orbit, requestRender, 400);
    }, 50);
    
    requestRender();
});

document.getElementById('save-scene').addEventListener('click', () => exportScene(camera, orbit));

// Frame controls with error handling
const frameSelectedBtn = document.getElementById('frame-selected');
const frameAllBtn = document.getElementById('frame-all');

if (frameSelectedBtn) {
    frameSelectedBtn.addEventListener('click', frameSelected);
} else {
    console.error('Frame Selected button not found!');
}

if (frameAllBtn) {
    frameAllBtn.addEventListener('click', frameAll);
} else {
    console.error('Frame All button not found!');
}

const fileInput = document.getElementById('file-input');
document.getElementById('load-scene').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    history.record();
    const reader = new FileReader();
    reader.onload = (event) => {
        const result = importScene(event.target.result, scene, selectionManager, camera, orbit);
        // Auto-frame all objects after import (if camera wasn't restored)
        setTimeout(() => {
            const objects = getObjects();
            if (objects.length > 0) {
                // Only frame if camera wasn't restored from file
                if (!result || !result.cameraRestored) {
                    frameAll();
                } else {
                    requestRender();
                }
            } else {
                // Frame workspace if no objects
                const frame = frameWorkspace(scene, camera, [], gridHelper);
                animateCameraTo(camera, frame.position, frame.target, orbit, requestRender, 400);
            }
        }, 100);
        requestRender();
    };
    reader.onerror = () => {
        console.error('File read error');
    };
    reader.readAsText(file);
    fileInput.value = '';
});

// Professional drag and drop import
container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.style.borderColor = '#007acc';
});

container.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.style.borderColor = '';
});

container.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.style.borderColor = '';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
        history.record();
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = importScene(event.target.result, scene, selectionManager, camera, orbit);
            // Auto-frame all objects after import (if camera wasn't restored)
            setTimeout(() => {
                const objects = getObjects();
                if (objects.length > 0) {
                    // Only frame if camera wasn't restored from file
                    if (!result || !result.cameraRestored) {
                        frameAll();
                    } else {
                        requestRender();
                    }
                } else {
                    // Frame workspace if no objects
                    const frame = frameWorkspace(scene, camera, [], gridHelper);
                    animateCameraTo(camera, frame.position, frame.target, orbit, requestRender, 400);
                }
            }, 100);
            requestRender();
        };
        reader.readAsText(file);
    }
});

// Professional keyboard shortcuts
window.addEventListener('keydown', (event) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    
    switch (key) {
        case 't':
            event.preventDefault();
            if (transform.mode === 'translate') transform.setMode('rotate');
            else if (transform.mode === 'rotate') transform.setMode('scale');
            else transform.setMode('translate');
            setModeButtons(transform.mode);
            requestRender();
            break;
        case 'b':
            event.preventDefault();
            addObjectWithHistory(OBJECT_TYPES.BOX, addBox);
            break;
        case 's':
            event.preventDefault();
            addObjectWithHistory(OBJECT_TYPES.SPHERE, addSphere);
            break;
        case 'c':
            event.preventDefault();
            addObjectWithHistory(OBJECT_TYPES.CYLINDER, addCylinder);
            break;
        case 'delete':
        case 'backspace':
            event.preventDefault();
            const selected = selectionManager.getSelected();
            if (selected) {
                history.record();
                transform.detach();
                scene.remove(selected);
                disposeObject(selected);
                removeObjectFromRegistry(selected);
                selectionManager.deselect();
                requestRender();
            }
            break;
        case 'z':
            if (ctrl && !event.shiftKey) {
                event.preventDefault();
                history.undo();
            } else if (ctrl && event.shiftKey) {
                event.preventDefault();
                history.redo();
            }
            break;
        case 'y':
            if (ctrl) {
                event.preventDefault();
                history.redo();
            }
            break;
        case 'f':
            event.preventDefault();
            frameSelected();
            break;
        case 'a':
            event.preventDefault();
            frameAll();
            break;
    }
});

snapToggle.addEventListener('change', (e) => {
    snapEnabled = e.target.checked;
    applySnap();
});

undoBtn.addEventListener('click', () => {
    history.undo();
});

redoBtn.addEventListener('click', () => {
    history.redo();
});

const clampNumber = (value, fallback, min = Number.EPSILON) => {
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n) || n < min) return fallback;
    return n;
};

ui.snapTranslate.addEventListener('input', (e) => {
    snapConfig.translate = clampNumber(e.target.value, snapConfig.translate, 0.01);
    if (snapEnabled) applySnap();
});

ui.snapRotate.addEventListener('input', (e) => {
    snapConfig.rotateDeg = clampNumber(e.target.value, snapConfig.rotateDeg, 1);
    if (snapEnabled) applySnap();
});

ui.snapScale.addEventListener('input', (e) => {
    snapConfig.scale = clampNumber(e.target.value, snapConfig.scale, 0.01);
    if (snapEnabled) applySnap();
});

function setModeButtons(mode) {
    Object.entries(ui.modeButtons).forEach(([key, btn]) => {
        if (!btn) return;
        btn.classList.toggle('active', key === mode);
    });
}

ui.modeButtons.translate.addEventListener('click', () => {
    transform.setMode('translate');
    setModeButtons('translate');
    requestRender();
});

ui.modeButtons.rotate.addEventListener('click', () => {
    transform.setMode('rotate');
    setModeButtons('rotate');
    requestRender();
});

ui.modeButtons.scale.addEventListener('click', () => {
    transform.setMode('scale');
    setModeButtons('scale');
    requestRender();
});

setModeButtons('translate');
applySnap();

// Grid and Axes toggle controls
const gridToggle = document.getElementById('grid-toggle');
const axesToggle = document.getElementById('axes-toggle');

if (gridToggle && gridHelper) {
    gridToggle.addEventListener('change', (e) => {
        gridHelper.visible = e.target.checked;
        requestRender();
    });
}

if (axesToggle && axesHelper) {
    axesToggle.addEventListener('change', (e) => {
        axesHelper.visible = e.target.checked;
        requestRender();
    });
}

requestRender();
