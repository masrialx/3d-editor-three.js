import * as THREE from 'three';
import { WORKSPACE_BOUNDS } from './constants.js';

/**
 * Calculate optimal camera position to frame a bounding box with land-to-sky view
 * Ensures full vertical visibility from floor to top
 * @param {THREE.Box3} boundingBox - The bounding box to frame
 * @param {THREE.PerspectiveCamera} camera - The camera to position
 * @param {number} margin - Additional margin around the box (default: 0.2 = 20%)
 * @param {number} angle - Camera angle from horizontal (default: 60 degrees for diagonal top-down)
 * @returns {Object} { position: THREE.Vector3, target: THREE.Vector3 }
 */
export function calculateCameraFrame(boundingBox, camera, margin = 0.2, angle = 60) {
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    // Ensure minimum dimensions
    const width = Math.max(size.x, 1);
    const height = Math.max(size.y, 1); // Vertical extent is critical for land-to-sky
    const depth = Math.max(size.z, 1);
    
    // Calculate distance needed to fit the box in view
    // Account for camera FOV and aspect ratio
    const fov = camera.fov * (Math.PI / 180);
    const aspect = Math.max(camera.aspect || 1, 0.1);
    
    // For "land-to-sky" view, prioritize vertical visibility
    // Calculate distance needed to see full height
    const viewHeight = height * (1 + margin);
    const viewWidth = Math.max(width, depth) * (1 + margin);
    
    // Calculate distance based on both vertical and horizontal requirements
    const distanceForHeight = viewHeight / (2 * Math.tan(fov / 2));
    const distanceForWidth = (viewWidth / aspect) / (2 * Math.tan(fov / 2));
    
    // Use the larger distance to ensure everything fits
    const baseDistance = Math.max(distanceForHeight, distanceForWidth);
    
    // Add extra distance for better viewing angle and to prevent clipping
    const finalDistance = baseDistance * 1.3;
    
    // Calculate camera position with diagonal top-down perspective
    // Angle of 60 degrees provides good "land-to-sky" view
    const angleRad = angle * (Math.PI / 180);
    const horizontalDistance = finalDistance * Math.cos(angleRad);
    const verticalDistance = finalDistance * Math.sin(angleRad);
    
    // Position camera at diagonal angle (slight top-down perspective)
    // This ensures we see from floor to sky
    const position = new THREE.Vector3(
        center.x + horizontalDistance * 0.7,
        center.y + verticalDistance,
        center.z + horizontalDistance * 0.7
    );
    
    // Ensure camera doesn't go below floor (minimum y = 1.0)
    position.y = Math.max(position.y, 1.0);
    
    return {
        position,
        target: center.clone()
    };
}

/**
 * Frame the entire workspace (grid + all objects) with land-to-sky view
 * @param {THREE.Scene} scene - The scene
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {Array} objects - Array of objects to include
 * @param {THREE.GridHelper} gridHelper - The grid helper
 * @returns {Object} { position: THREE.Vector3, target: THREE.Vector3 }
 */
export function frameWorkspace(scene, camera, objects = [], gridHelper = null) {
    const boundingBox = new THREE.Box3();
    
    // Always include full workspace bounds (floor to sky)
    // This ensures "land-to-sky" view is always maintained
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
        const gridSize = 20; // Grid size from scene setup
        const gridBox = new THREE.Box3(
            new THREE.Vector3(-gridSize / 2, 0, -gridSize / 2),
            new THREE.Vector3(gridSize / 2, 0, gridSize / 2)
        );
        boundingBox.expandByBox(gridBox);
    }
    
    // Ensure minimum size for empty scene - always include full vertical range
    if (boundingBox.isEmpty() || boundingBox.getSize(new THREE.Vector3()).length() < 1) {
        boundingBox.setFromCenterAndSize(
            new THREE.Vector3(0, WORKSPACE_BOUNDS.maxY / 2, 0), // Center vertically
            new THREE.Vector3(
                WORKSPACE_BOUNDS.maxX - WORKSPACE_BOUNDS.minX,
                WORKSPACE_BOUNDS.maxY - WORKSPACE_BOUNDS.minY, // Full vertical range
                WORKSPACE_BOUNDS.maxZ - WORKSPACE_BOUNDS.minZ
            )
        );
    }
    
    // Use 60-degree angle for better "land-to-sky" diagonal view
    return calculateCameraFrame(boundingBox, camera, 0.2, 60);
}

/**
 * Frame specific objects with land-to-sky view
 * @param {Array} objects - Array of objects to frame
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {number} margin - Additional margin (default: 0.2)
 * @returns {Object} { position: THREE.Vector3, target: THREE.Vector3 }
 */
export function frameObjects(objects, camera, margin = 0.2) {
    if (!objects || objects.length === 0) {
        // Return a safe default frame if no objects
        const defaultBox = new THREE.Box3(
            new THREE.Vector3(-10, 0, -10),
            new THREE.Vector3(10, 10, 10)
        );
        return calculateCameraFrame(defaultBox, camera, margin, 60);
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
        // Return a safe default frame
        const defaultBox = new THREE.Box3(
            new THREE.Vector3(-10, 0, -10),
            new THREE.Vector3(10, 10, 10)
        );
        return calculateCameraFrame(defaultBox, camera, margin, 60);
    }
    
    // Ensure we always see from floor (y=0) to top
    // Expand bounding box to include floor if objects are above it
    if (boundingBox.min.y > WORKSPACE_BOUNDS.minY) {
        boundingBox.expandByPoint(new THREE.Vector3(
            boundingBox.getCenter(new THREE.Vector3()).x,
            WORKSPACE_BOUNDS.minY, // Include floor
            boundingBox.getCenter(new THREE.Vector3()).z
        ));
    }
    
    // Use 60-degree angle for "land-to-sky" view
    return calculateCameraFrame(boundingBox, camera, margin, 60);
}

/**
 * Smoothly animate camera to new position
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {THREE.Vector3} targetPosition - Target camera position
 * @param {THREE.Vector3} targetLookAt - Target look-at point
 * @param {OrbitControls} orbitControls - Orbit controls
 * @param {Function} requestRender - Render request function
 * @param {number} duration - Animation duration in ms (default: 500)
 */
export function animateCameraTo(
    camera,
    targetPosition,
    targetLookAt,
    orbitControls,
    requestRender,
    duration = 500
) {
    const startPosition = camera.position.clone();
    const startTarget = orbitControls.target.clone();
    
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out cubic for smooth professional animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate camera position
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        
        // Interpolate orbit target
        orbitControls.target.lerpVectors(startTarget, targetLookAt, easeProgress);
        
        // Update camera to look at target
        camera.lookAt(orbitControls.target);
        
        requestRender();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Ensure final position is exact
            camera.position.copy(targetPosition);
            orbitControls.target.copy(targetLookAt);
            camera.lookAt(orbitControls.target);
            requestRender();
        }
    }
    
    animate();
}
