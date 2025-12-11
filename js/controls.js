import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { WORKSPACE_BOUNDS } from './constants.js';

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
    
    // Calculate optimal zoom limits based on workspace size
    const workspaceSize = Math.max(
        WORKSPACE_BOUNDS.maxX - WORKSPACE_BOUNDS.minX,
        WORKSPACE_BOUNDS.maxZ - WORKSPACE_BOUNDS.minZ,
        WORKSPACE_BOUNDS.maxY - WORKSPACE_BOUNDS.minY
    );
    
    // Min distance: close enough to see details but not inside objects
    orbit.minDistance = Math.max(2, workspaceSize * 0.1);
    
    // Max distance: far enough to see entire workspace with margin
    orbit.maxDistance = workspaceSize * 3;
    
    // Allow full rotation but prevent going below floor
    orbit.minPolarAngle = 0; // Allow looking from top
    orbit.maxPolarAngle = Math.PI; // Allow looking from bottom
    
    orbit.enablePan = true;
    orbit.panSpeed = 1.0;
    orbit.zoomSpeed = 1.2;
    orbit.rotateSpeed = 0.8;
    
    // Pan limits to keep workspace in view
    const panBounds = {
        minX: WORKSPACE_BOUNDS.minX - 5,
        maxX: WORKSPACE_BOUNDS.maxX + 5,
        minY: WORKSPACE_BOUNDS.minY - 2,
        maxY: WORKSPACE_BOUNDS.maxY + 5,
        minZ: WORKSPACE_BOUNDS.minZ - 5,
        maxZ: WORKSPACE_BOUNDS.maxZ + 5
    };
    
    // Prevent camera from going below floor or outside workspace
    orbit.addEventListener('change', () => {
        // Prevent camera from going below floor
        if (camera.position.y < 1.0) {
            camera.position.y = 1.0;
        }
        
        // Clamp pan target to workspace bounds
        orbit.target.x = Math.max(panBounds.minX, Math.min(panBounds.maxX, orbit.target.x));
        orbit.target.y = Math.max(panBounds.minY, Math.min(panBounds.maxY, orbit.target.y));
        orbit.target.z = Math.max(panBounds.minZ, Math.min(panBounds.maxZ, orbit.target.z));
        
        requestRender();
    });
    
    // Prevent camera from getting too close to objects or going inside them
    orbit.addEventListener('change', () => {
        const distance = camera.position.distanceTo(orbit.target);
        if (distance < orbit.minDistance) {
            const direction = new THREE.Vector3()
                .subVectors(camera.position, orbit.target)
                .normalize();
            camera.position.copy(orbit.target).add(
                direction.multiplyScalar(orbit.minDistance)
            );
        }
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
