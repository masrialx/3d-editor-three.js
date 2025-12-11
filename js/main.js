import { initScene } from './scene.js';
import { initControls } from './controls.js';
import { addBox, addSphere, addCylinder, getObjects, clearObjectsArray } from './objects.js';
import { initSelection } from './selection.js';
import { updateObjectPosition, updateObjectRotationDeg, updateObjectScale } from './transform.js';
import { exportScene, importScene, serializeScene, loadSceneData } from './persistence.js';
import { disposeObject } from './utils.js';
import { OBJECT_TYPES } from './constants.js';
import { createHistory } from './history.js';

const container = document.getElementById('canvas-container');

let renderPending = false;
const requestRender = () => {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => {
        renderPending = false;
        orbit.update();
        renderer.render(scene, camera);
    });
};

const { scene, camera, renderer } = initScene(container, requestRender);
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
    ui.selId.textContent = object.userData.type;
    ui.posX.value = object.position.x.toFixed(2);
    ui.posY.value = object.position.y.toFixed(2);
    ui.posZ.value = object.position.z.toFixed(2);
    ui.rotX.value = (object.rotation.x * 180 / Math.PI).toFixed(1);
    ui.rotY.value = (object.rotation.y * 180 / Math.PI).toFixed(1);
    ui.rotZ.value = (object.rotation.z * 180 / Math.PI).toFixed(1);
    ui.scaleX.value = object.scale.x.toFixed(2);
    ui.scaleY.value = object.scale.y.toFixed(2);
    ui.scaleZ.value = object.scale.z.toFixed(2);
    ui.dims.textContent = `Dimensions (approx): ${object.scale.x.toFixed(2)} x ${object.scale.y.toFixed(2)} x ${object.scale.z.toFixed(2)}`;
}

let transformSnapshotTaken = false;
const { orbit, transform } = initControls(camera, renderer, scene, {
    onTransformChange: (obj) => {
        updateUI(obj);
    },
    onTransformStart: () => {
        if (!transformSnapshotTaken) {
            history.record();
            transformSnapshotTaken = true;
        }
    },
    onTransformEnd: () => {
        transformSnapshotTaken = false;
    },
    requestRender
});

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

['x', 'y', 'z'].forEach((axis) => {
    const input = document.getElementById(`pos-${axis}`);
    input.addEventListener('input', (e) => {
        const selected = selectionManager.getSelected();
        if (selected) {
            history.record();
            const value = snapEnabled ? Math.round(Number(e.target.value)) : e.target.value;
            updateObjectPosition(selected, axis, value);
            requestRender();
        }
    });
});

['x', 'y', 'z'].forEach((axis) => {
    const input = document.getElementById(`rot-${axis}`);
    input.addEventListener('input', (e) => {
        const selected = selectionManager.getSelected();
        if (selected) {
            history.record();
            updateObjectRotationDeg(selected, axis, e.target.value);
            requestRender();
        }
    });
});

['x', 'y', 'z'].forEach((axis) => {
    const input = document.getElementById(`scale-${axis}`);
    input.addEventListener('input', (e) => {
        const selected = selectionManager.getSelected();
        if (selected) {
            history.record();
            updateObjectScale(selected, axis, e.target.value);
            requestRender();
        }
    });
});

const addButtons = {
    [OBJECT_TYPES.BOX]: document.getElementById('add-box'),
    [OBJECT_TYPES.SPHERE]: document.getElementById('add-sphere'),
    [OBJECT_TYPES.CYLINDER]: document.getElementById('add-cylinder')
};

addButtons[OBJECT_TYPES.BOX].addEventListener('click', () => {
    history.record();
    addBox(scene);
    requestRender();
});
addButtons[OBJECT_TYPES.SPHERE].addEventListener('click', () => {
    history.record();
    addSphere(scene);
    requestRender();
});
addButtons[OBJECT_TYPES.CYLINDER].addEventListener('click', () => {
    history.record();
    addCylinder(scene);
    requestRender();
});

document.getElementById('delete-btn').addEventListener('click', () => {
    const selected = selectionManager.getSelected();
    if (!selected) return;
    try {
        history.record();
        transform.detach();
        scene.remove(selected);
        disposeObject(selected);

        const objects = getObjects();
        const index = objects.indexOf(selected);
        if (index > -1) objects.splice(index, 1);

        selectionManager.deselect();
        requestRender();
    } catch (_e) {
        alert('Unable to delete the selected object.');
    }
});

document.getElementById('clear-scene').addEventListener('click', () => {
    if (!confirm('Clear all objects?')) return;
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
    reader.onerror = () => alert('Failed to read the selected file.');
    reader.readAsText(file);
    fileInput.value = '';
});

window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 't') {
        if (transform.mode === 'translate') transform.setMode('rotate');
        else if (transform.mode === 'rotate') transform.setMode('scale');
        else transform.setMode('translate');
        setModeButtons(transform.mode);
        requestRender();
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