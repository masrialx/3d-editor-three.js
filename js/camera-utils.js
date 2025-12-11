import * as THREE from 'three';
import { WORKSPACE_BOUNDS } from './constants.js';

/**
 * Calculate optimal camera position with isometric-like view (35-45° angle)
 * Industry standard: x=45°, y=30°, distance 8-12 units
 * @param {THREE.Box3} boundingBox - The bounding box to frame
 * @param {THREE.PerspectiveCamera} camera - The camera to position
 * @param {number} margin - Additional margin around the box (default: 0.2 = 20%)
 * @param {number} distance - Preferred distance (default: 10 units)
 * @returns {Object} { position: THREE.Vector3, target: THREE.Vector3 }
 */
export function calculateCameraFrame(boundingBox, camera, margin = 0.2, distance = 10) {
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    // Ensure minimum dimensions
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    
    // Calculate required distance to fit the box
    const fov = camera.fov * (Math.PI / 180);
    const aspect = Math.max(camera.aspect || 1, 0.1);
    
    const viewHeight = maxDim * (1 + margin);
    const viewWidth = viewHeight * aspect;
    
    const requiredDistance = Math.max(
        viewHeight / (2 * Math.tan(fov / 2)),
        viewWidth / (2 * Math.tan(fov / 2))
    );
    
    // Use preferred distance or calculated distance, whichever is larger
    const finalDistance = Math.max(distance, requiredDistance * 1.2);
    
    // Industry standard isometric-like angles: x=45°, y=30° (elevation)
    const horizontalAngle = 45 * (Math.PI / 180); // 45° around Y axis
    const elevationAngle = 30 * (Math.PI / 180);  // 30° elevation (downward)
    
    // Calculate position with isometric-like view
    const horizontalDistance = finalDistance * Math.cos(elevationAngle);
    const verticalDistance = finalDistance * Math.sin(elevationAngle);
    
    // Position camera at 45° horizontal, 30° elevation
    const position = new THREE.Vector3(
        center.x + horizontalDistance * Math.cos(horizontalAngle),
        center.y + verticalDistance,
        center.z + horizontalDistance * Math.sin(horizontalAngle)
    );
    
    // Ensure camera doesn't go below floor
    position.y = Math.max(position.y, 1.0);
    
    return {
        position,
        target: center.clone()
    };
}

/**
 * Frame the entire workspace with isometric-like view
 * Ensures full visibility: ground, sky, left, right, front, back
 */
export function frameWorkspace(scene, camera, objects = [], gridHelper = null) {
    const boundingBox = new THREE.Box3();
    
    // Always include full workspace bounds (floor to sky)
    boundingBox.expandByPoint(new THREE.Vector3(
        WORKSPACE_BOUNDS.minX, 
        WORKSPACE_BOUNDS.minY, // Floor (y = 0)
        WORKSPACE_BOUNDS.minZ
    ));
    boundingBox.expandByPoint(new THREE.Vector3(
        WORKSPACE_BOUNDS.maxX, 
        WORKSPACE_BOUNDS.maxY, // Sky (y = 20)
        WORKSPACE_BOUNDS.maxZ
    ));
    
    // Include all objects
    if (objects && objects.length > 0) {
        objects.forEach(obj => {
            if (obj && obj.visible) {
                try {
                    const objBox = new THREE.Box3().setFromObject(obj);
                    if (!objBox.isEmpty()) {
                        boundingBox.expandByBox(objBox);
                    }
                } catch (error) {
                    console.warn('Error calculating bounding box for object:', obj, error);
                }
            }
        });
    }
    
    // Include grid if present (ensures floor is visible)
    if (gridHelper && gridHelper.visible) {
        const gridSize = 20;
        const gridBox = new THREE.Box3(
            new THREE.Vector3(-gridSize / 2, 0, -gridSize / 2),
            new THREE.Vector3(gridSize / 2, 0, gridSize / 2)
        );
        boundingBox.expandByBox(gridBox);
    }
    
    // Ensure minimum size for empty scene - always include full vertical range
    if (boundingBox.isEmpty() || boundingBox.getSize(new THREE.Vector3()).length() < 1) {
        boundingBox.setFromCenterAndSize(
            new THREE.Vector3(0, WORKSPACE_BOUNDS.maxY / 2, 0),
            new THREE.Vector3(
                WORKSPACE_BOUNDS.maxX - WORKSPACE_BOUNDS.minX,
                WORKSPACE_BOUNDS.maxY - WORKSPACE_BOUNDS.minY,
                WORKSPACE_BOUNDS.maxZ - WORKSPACE_BOUNDS.minZ
            )
        );
    }
    
    // Use industry standard distance: 8-12 units, prefer 10
    return calculateCameraFrame(boundingBox, camera, 0.25, 10);
}

/**
 * Frame specific objects with isometric-like view
 */
export function frameObjects(objects, camera, margin = 0.2) {
    if (!objects || objects.length === 0) {
        const defaultBox = new THREE.Box3(
            new THREE.Vector3(-10, 0, -10),
            new THREE.Vector3(10, 10, 10)
        );
        return calculateCameraFrame(defaultBox, camera, margin, 10);
    }
    
    const boundingBox = new THREE.Box3();
    let hasValidObjects = false;
    
    objects.forEach(obj => {
        if (obj && obj.visible) {
            try {
                const objBox = new THREE.Box3().setFromObject(obj);
                if (!objBox.isEmpty()) {
                    boundingBox.expandByBox(objBox);
                    hasValidObjects = true;
                }
            } catch (error) {
                console.warn('Error calculating bounding box for object:', obj, error);
            }
        }
    });
    
    if (!hasValidObjects || boundingBox.isEmpty()) {
        const defaultBox = new THREE.Box3(
            new THREE.Vector3(-10, 0, -10),
            new THREE.Vector3(10, 10, 10)
        );
        return calculateCameraFrame(defaultBox, camera, margin, 10);
    }
    
    // Ensure we always see from floor (y=0) to top
    if (boundingBox.min.y > WORKSPACE_BOUNDS.minY) {
        boundingBox.expandByPoint(new THREE.Vector3(
            boundingBox.getCenter(new THREE.Vector3()).x,
            WORKSPACE_BOUNDS.minY,
            boundingBox.getCenter(new THREE.Vector3()).z
        ));
    }
    
    return calculateCameraFrame(boundingBox, camera, margin, 10);
}

/**
 * Smoothly animate camera to new position
 * Professional: Stable animation without jitter, no OrbitControls interference
 * @param {Function} setAnimationActive - Callback to set animation state (prevents OrbitControls updates)
 */
export function animateCameraTo(
    camera,
    targetPosition,
    targetLookAt,
    orbitControls,
    requestRender,
    duration = 500,
    setAnimationActive = null
) {
    const startPosition = camera.position.clone();
    const startTarget = orbitControls.target.clone();
    
    const startTime = Date.now();
    let animationActive = true;
    
    // Notify that animation is starting
    if (setAnimationActive) {
        setAnimationActive(true);
    }
    
    function animate() {
        if (!animationActive) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out cubic for smooth professional animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate camera position
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        
        // Interpolate orbit target
        orbitControls.target.lerpVectors(startTarget, targetLookAt, easeProgress);
        
        // Update camera to look at target (only once per frame, no jitter)
        camera.lookAt(orbitControls.target);
        
        // Request render (will be handled by main render loop)
        requestRender();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Ensure final position is exact
            camera.position.copy(targetPosition);
            orbitControls.target.copy(targetLookAt);
            camera.lookAt(orbitControls.target);
            animationActive = false;
            
            // Notify that animation is complete
            if (setAnimationActive) {
                setAnimationActive(false);
            }
            
            requestRender();
        }
    }
    
    animate();
}
