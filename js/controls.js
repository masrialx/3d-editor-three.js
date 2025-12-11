import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { WORKSPACE_BOUNDS } from './constants.js';

export function initControls(
    camera,
    renderer,
    scene,
    { onTransformChange, onTransformStart, onTransformEnd, requestRender }
) {
    // Professional OrbitControls with industry-standard settings
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.1;
    
    // Professional: rotation center = scene origin (0,1,0) - where objects appear
    // Objects spawn at (0, objectHeight, 0) where objectHeight ~0.5-1, so center at y=1
    orbit.target.set(0, 1, 0);
    
    // Calculate optimal zoom limits to prevent camera from flying away
    const workspaceSize = Math.max(
        WORKSPACE_BOUNDS.maxX - WORKSPACE_BOUNDS.minX,
        WORKSPACE_BOUNDS.maxZ - WORKSPACE_BOUNDS.minZ,
        WORKSPACE_BOUNDS.maxY - WORKSPACE_BOUNDS.minY
    );
    
    // Min distance: close enough to see details (1 unit) but not inside objects
    orbit.minDistance = 1;
    
    // Max distance: far enough to see entire workspace but not too far
    // Cap at reasonable distance to prevent camera from going out of scene
    orbit.maxDistance = Math.min(workspaceSize * 2, 30);
    
    // Allow full rotation but prevent going below floor
    orbit.minPolarAngle = 0;
    orbit.maxPolarAngle = Math.PI;
    
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
    
    // Professional camera stabilization: prevent camera from flying away or going out of bounds
    orbit.addEventListener('change', () => {
        const distance = camera.position.distanceTo(orbit.target);
        
        // Prevent camera from going below floor
        if (camera.position.y < 0.5) {
            camera.position.y = 0.5;
        }
        
        // Enforce min distance - prevent getting too close
        if (distance < orbit.minDistance) {
            const direction = new THREE.Vector3()
                .subVectors(camera.position, orbit.target)
                .normalize();
            camera.position.copy(orbit.target).add(
                direction.multiplyScalar(orbit.minDistance)
            );
        }
        
        // Enforce max distance - prevent camera from flying away
        if (distance > orbit.maxDistance) {
            const direction = new THREE.Vector3()
                .subVectors(camera.position, orbit.target)
                .normalize();
            camera.position.copy(orbit.target).add(
                direction.multiplyScalar(orbit.maxDistance)
            );
        }
        
        // Clamp pan target to workspace bounds (prevent target from drifting)
        orbit.target.x = Math.max(panBounds.minX, Math.min(panBounds.maxX, orbit.target.x));
        orbit.target.y = Math.max(panBounds.minY, Math.min(panBounds.maxY, orbit.target.y));
        orbit.target.z = Math.max(panBounds.minZ, Math.min(panBounds.maxZ, orbit.target.z));
        
        // Ensure camera stays within reasonable bounds
        camera.position.x = Math.max(-50, Math.min(50, camera.position.x));
        camera.position.y = Math.max(0.5, Math.min(50, camera.position.y));
        camera.position.z = Math.max(-50, Math.min(50, camera.position.z));
        
        requestRender();
    });

    // Professional TransformControls with stability fixes
    const transform = new TransformControls(camera, renderer.domElement);
    
    // Track dragging state to prevent accidental deselection and raycast interference
    let isDragging = false;
    let dragStartTime = 0;
    
    // Industry standard: handles must stay selected until user clicks empty space
    transform.addEventListener('dragging-changed', (event) => {
        isDragging = event.value;
        
        if (event.value) {
            // Drag start: lock OrbitControls and prevent raycasting
            dragStartTime = Date.now();
            orbit.enabled = false;
            if (onTransformStart) onTransformStart();
        } else {
            // Drag end: re-enable OrbitControls after a small delay to prevent jitter
            const dragDuration = Date.now() - dragStartTime;
            const minDragTime = 50; // Minimum drag time to consider it intentional
            
            if (dragDuration < minDragTime) {
                // Very short drag - might be accidental, wait a bit
                setTimeout(() => {
                    orbit.enabled = true;
                }, 150);
            } else {
                // Normal drag - re-enable after short delay to prevent selection flicker
                setTimeout(() => {
                    orbit.enabled = true;
                }, 100);
            }
            
            if (onTransformEnd) onTransformEnd();
        }
        requestRender();
    });

    transform.addEventListener('change', () => {
        if (transform.object) {
            onTransformChange(transform.object);
        }
        requestRender();
    });

    // Ensure handles draw on top (zIndex fix)
    transform.setSpace('world');
    
    // Show gizmo only when object is selected
    transform.visible = false;

    scene.add(transform);

    return { 
        orbit, 
        transform,
        isDragging: () => isDragging
    };
}
