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
const { orbit: orbitCtrl, transform } = initControls(camera, renderer, scene, {
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
    requestRender
);

history = createHistory({
    serialize: () => serializeScene(),
    load: (data) => loadSceneData(data, scene, selectionManager),
    requestRender
});
history.record(); // initial empty state

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

// Professional frame functions
function frameSelected() {
    const selected = selectionManager.getSelected();
    if (!selected) return;
    
    const box = new THREE.Box3().setFromObject(selected);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;
    
    camera.position.set(
        center.x + distance,
        center.y + distance,
        center.z + distance
    );
    camera.lookAt(center);
    orbit.target.copy(center);
    requestRender();
}

function frameAll() {
    const objects = getObjects();
    if (objects.length === 0) return;
    
    const box = new THREE.Box3();
    objects.forEach(obj => box.expandByObject(obj));
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;
    
    camera.position.set(
        center.x + distance,
        center.y + distance,
        center.z + distance
    );
    camera.lookAt(center);
    orbit.target.copy(center);
    requestRender();
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
        
        // Professional camera framing: smoothly frame the new object
        frameNewObject(obj);
        
        // UI updates immediately (handled by selectObject callback)
        requestRender();
    }
}

// Frame newly created object smoothly
function frameNewObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 3; // Slightly further for new objects
    
    // Smooth camera transition
    const startPos = camera.position.clone();
    const targetPos = new THREE.Vector3(
        center.x + distance * 0.7,
        center.y + distance * 0.7,
        center.z + distance * 0.7
    );
    
    const startTarget = orbit.target.clone();
    const targetTarget = center.clone();
    
    const duration = 300; // milliseconds
    const startTime = Date.now();
    
    function animateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 2); // Ease-out
        
        camera.position.lerpVectors(startPos, targetPos, easeProgress);
        orbit.target.lerpVectors(startTarget, targetTarget, easeProgress);
        camera.lookAt(orbit.target);
        
        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        }
        requestRender();
    }
    
    animateCamera();
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
    requestRender();
});

document.getElementById('save-scene').addEventListener('click', exportScene);

document.getElementById('frame-selected').addEventListener('click', frameSelected);
document.getElementById('frame-all').addEventListener('click', frameAll);

const fileInput = document.getElementById('file-input');
document.getElementById('load-scene').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    history.record();
    const reader = new FileReader();
    reader.onload = (event) => {
        importScene(event.target.result, scene, selectionManager);
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
            importScene(event.target.result, scene, selectionManager);
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
requestRender();
