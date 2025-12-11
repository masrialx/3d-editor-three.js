import { safeParseNumber, clampPosition, clampRotation, clampScale, validatePosition, validateRotation, validateScale } from './utils.js';
import { SCALE_LIMITS, ROTATION_LIMITS } from './constants.js';

export function updateObjectPosition(object, axis, value) {
    if (!object) return;
    const parsed = safeParseNumber(value, object.position[axis] ?? 0);
    
    // Update position
    if (axis === 'x') object.position.x = parsed;
    if (axis === 'y') object.position.y = parsed;
    if (axis === 'z') object.position.z = parsed;
    
    // Validate and clamp to workspace bounds
    if (!validatePosition(object.position)) {
        const clamped = clampPosition(object.position);
        object.position.copy(clamped);
    }
}

export function updateObjectRotationDeg(object, axis, degValue) {
    if (!object) return;
    let parsed = safeParseNumber(degValue, (object.rotation[axis] * 180) / Math.PI);
    
    // Normalize to 0-360 range
    parsed = parsed % 360;
    if (parsed < 0) parsed += 360;
    
    // Clamp to rotation limits
    parsed = Math.max(ROTATION_LIMITS.min, Math.min(ROTATION_LIMITS.max, parsed));
    
    const radians = (parsed * Math.PI) / 180;
    if (axis === 'x') object.rotation.x = radians;
    if (axis === 'y') object.rotation.y = radians;
    if (axis === 'z') object.rotation.z = radians;
    
    // Validate rotation
    if (!validateRotation(object.rotation)) {
        const clamped = clampRotation(object.rotation);
        object.rotation.copy(clamped);
    }
}

export function updateObjectScale(object, axis, value) {
    if (!object) return;
    let parsed = safeParseNumber(value, object.scale[axis] ?? 1);
    
    // Prevent zero or negative scale
    parsed = Math.max(SCALE_LIMITS.min, Math.min(SCALE_LIMITS.max, parsed));
    
    if (axis === 'x') object.scale.x = parsed;
    if (axis === 'y') object.scale.y = parsed;
    if (axis === 'z') object.scale.z = parsed;
    
    // Validate scale
    if (!validateScale(object.scale)) {
        const clamped = clampScale(object.scale);
        object.scale.copy(clamped);
    }
}
