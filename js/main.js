import { initScene } from './scene.js';
import { initControls } from './controls.js';
import { addBox, addSphere, addCylinder, getObjects, clearObjectsArray } from './objects.js';
import { initSelection } from './selection.js';
import { updateObjectPosition } from './transform.js';
import { exportScene, importScene } from './persistence.js';
import { disposeObject } from './utils.js';
import { OBJECT_TYPES } from './constants.js';

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

const ui = {
    posX: document.getElementById('pos-x'),
    posY: document.getElementById('pos-y'),
    posZ: document.getElementById('pos-z'),
    panel: document.getElementById('properties-panel'),
    selId: document.getElementById('selected-id')
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
}

const { orbit, transform } = initControls(camera, renderer, scene, {
    onTransformChange: (obj) => {
        updateUI(obj);
    },
    requestRender
});

const selectionManager = initSelection(
    camera,
    renderer.domElement,
    transform,
    (obj) => {
        updateUI(obj);
    },
    requestRender
);

['x', 'y', 'z'].forEach((axis) => {
    const input = document.getElementById(`pos-${axis}`);
    input.addEventListener('input', (e) => {
        const selected = selectionManager.getSelected();
        if (selected) {
            updateObjectPosition(selected, axis, e.target.value);
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
    addBox(scene);
    requestRender();
});
addButtons[OBJECT_TYPES.SPHERE].addEventListener('click', () => {
    addSphere(scene);
    requestRender();
});
addButtons[OBJECT_TYPES.CYLINDER].addEventListener('click', () => {
    addCylinder(scene);
    requestRender();
});

document.getElementById('delete-btn').addEventListener('click', () => {
    const selected = selectionManager.getSelected();
    if (!selected) return;
    try {
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
    const reader = new FileReader();
    reader.onload = (event) => importScene(event.target.result, scene, selectionManager);
    reader.onerror = () => alert('Failed to read the selected file.');
    reader.readAsText(file);
    fileInput.value = '';
});

window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 't') {
        if (transform.mode === 'translate') transform.setMode('rotate');
        else if (transform.mode === 'rotate') transform.setMode('scale');
        else transform.setMode('translate');
        requestRender();
    }
});

requestRender();