import { safeParseNumber } from './utils.js';

export function updateObjectPosition(object, axis, value) {
    if (!object) return;

    const parsed = safeParseNumber(value, object.position[axis] ?? 0);
    if (axis === 'x') object.position.x = parsed;
    if (axis === 'y') object.position.y = parsed;
    if (axis === 'z') object.position.z = parsed;
}