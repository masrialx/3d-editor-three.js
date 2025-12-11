import { initScene } from './scene.js';
import { initControls } from './controls.js';
import { addBox, addSphere, addCylinder, getObjects, clearObjectsArray } from './objects.js';
import { initSelection } from './selection.js';
import { updateObjectPosition } from './transform.js';
import { exportScene, importScene } from './persistence.js';
import { disposeObject } from './utils.js';

// 1. Initialization
const container = document.getElementById('canvas-container');
const { scene, camera, renderer } = initScene(container);

// UI Elements
const uiIds = {
    posX: document.getElementById('pos-x'),
    posY: document.getElementById('pos-y'),
    posZ: document.getElementById('pos-z'),
    panel: document.getElementById('properties-panel'),
    selId: document.getElementById('selected-id')
};

// 2. UI Update Logic (Sync 3D -> UI)
function updateUI(object) {
    if (!object) {
        uiIds.panel.style.display = 'none';
        return;
    }
    uiIds.panel.style.display = 'block';
    uiIds.selId.textContent = object.userData.type;
    uiIds.posX.value = object.position.x.toFixed(2);
    uiIds.posY.value = object.position.y.toFixed(2);
    uiIds.posZ.value = object.position.z.toFixed(2);
}

// 3. Controls Setup
const { orbit, transform } = initControls(camera, renderer, scene, (obj) => {
    updateUI(obj); // Update inputs when dragging Gizmo
});

// 4. Selection Setup
const selectionManager = initSelection(camera, renderer.domElement, transform, (obj) => {
    updateUI(obj);
});

// 5. Input Event Listeners (Sync UI -> 3D)
['x', 'y', 'z'].forEach(axis => {
    const input = document.getElementById(`pos-${axis}`);
    input.addEventListener('input', (e) => {
        const selected = selectionManager.getSelected();
        if (selected) {
            updateObjectPosition(selected, axis, e.target.value);
        }
    });
});

// 6. Button Actions
document.getElementById('add-box').addEventListener('click', () => { 
    const mesh = addBox(scene); 
    // Auto select new object (optional)
});
document.getElementById('add-sphere').addEventListener('click', () => addSphere(scene));
document.getElementById('add-cylinder').addEventListener('click', () => addCylinder(scene));

document.getElementById('delete-btn').addEventListener('click', () => {
    const selected = selectionManager.getSelected();
    if(selected) {
        transform.detach();
        scene.remove(selected);
        disposeObject(selected);
        
        // Remove from registry
        const objects = getObjects();
        const index = objects.indexOf(selected);
        if (index > -1) objects.splice(index, 1);
        
        selectionManager.deselect();
    }
});

document.getElementById('clear-scene').addEventListener('click', () => {
    if(!confirm("Clear all objects?")) return;
    selectionManager.deselect();
    const objects = [...getObjects()];
    objects.forEach(obj => {
        scene.remove(obj);
        disposeObject(obj);
    });
    clearObjectsArray();
});

document.getElementById('save-scene').addEventListener('click', exportScene);

const fileInput = document.getElementById('file-input');
document.getElementById('load-scene').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => importScene(e.target.result, scene, selectionManager);
    reader.readAsText(file);
    fileInput.value = ''; // Reset
});

// Keybinds
window.addEventListener('keydown', function (event) {
    switch (event.key.toLowerCase()) {
        case 't': // Toggle Transform Mode
            if (transform.mode === 'translate') transform.setMode('rotate');
            else if (transform.mode === 'rotate') transform.setMode('scale');
            else transform.setMode('translate');
            break;
    }
});

// 7. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    orbit.update();
    renderer.render(scene, camera);
}
animate();