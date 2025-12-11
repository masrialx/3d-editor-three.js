import { safeParseNumber } from './utils.js';

export function updateObjectPosition(object, axis, value) {
    if (!object) return;
    const parsed = safeParseNumber(value, object.position[axis] ?? 0);
    if (axis === 'x') object.position.x = parsed;
    if (axis === 'y') object.position.y = parsed;
    if (axis === 'z') object.position.z = parsed;
}

export function updateObjectRotationDeg(object, axis, degValue) {
    if (!object) return;
    const parsed = safeParseNumber(degValue, object.rotation[axis] ?? 0);
    const radians = (parsed * Math.PI) / 180;
    if (axis === 'x') object.rotation.x = radians;
    if (axis === 'y') object.rotation.y = radians;
    if (axis === 'z') object.rotation.z = radians;
}

export function updateObjectScale(object, axis, value) {
    if (!object) return;
    const parsed = safeParseNumber(value, object.scale[axis] ?? 1);
    if (axis === 'x') object.scale.x = parsed;
    if (axis === 'y') object.scale.y = parsed;
    if (axis === 'z') object.scale.z = parsed;
}