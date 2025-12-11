import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export function initControls(
    camera,
    renderer,
    scene,
    { onTransformChange, onTransformStart, onTransformEnd, requestRender }
) {
    // Professional OrbitControls with limits and smooth behavior
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.1;
    orbit.minDistance = 2; // Prevent camera from getting too close
    orbit.maxDistance = 50; // Prevent camera from going too far
    orbit.minPolarAngle = 0; // Allow looking from top
    orbit.maxPolarAngle = Math.PI; // Allow looking from bottom
    orbit.enablePan = true;
    orbit.panSpeed = 1.0;
    orbit.zoomSpeed = 1.2;
    orbit.rotateSpeed = 0.8;
    
    // Prevent camera from going below grid (y = 0)
    orbit.addEventListener('change', () => {
        if (camera.position.y < 0.5) {
            camera.position.y = 0.5;
        }
        requestRender();
    });

    // Professional TransformControls with axis constraints support
    const transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('dragging-changed', (event) => {
        orbit.enabled = !event.value;
        if (event.value && onTransformStart) onTransformStart();
        if (!event.value && onTransformEnd) onTransformEnd();
        requestRender();
    });

    transform.addEventListener('change', () => {
        if (transform.object) {
            onTransformChange(transform.object);
        }
        requestRender();
    });

    // Show gizmo only when object is selected
    transform.visible = false;

    scene.add(transform);

    return { orbit, transform };
}
