import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export function initControls(
    camera,
    renderer,
    scene,
    { onTransformChange, onTransformStart, onTransformEnd, requestRender }
) {
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.1;
    orbit.addEventListener('change', requestRender);

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

    scene.add(transform);

    return { orbit, transform };
}