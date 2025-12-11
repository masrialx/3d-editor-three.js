import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export function initControls(camera, renderer, scene, onTransformChange) {
    // Orbit Controls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;

    // Transform Controls (Gizmo)
    const transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('dragging-changed', function (event) {
        // Disable orbit when dragging gizmo to prevent conflict
        orbit.enabled = !event.value;
    });
    
    // Trigger UI update when object is moved via Gizmo
    transform.addEventListener('change', () => {
        if (transform.object) {
            onTransformChange(transform.object);
        }
    });

    scene.add(transform);

    return { orbit, transform };
}