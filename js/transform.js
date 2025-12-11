export function updateObjectPosition(object, axis, value) {
    if (!object) return;
    
    const val = parseFloat(value);
    if (isNaN(val)) return;

    if (axis === 'x') object.position.x = val;
    if (axis === 'y') object.position.y = val;
    if (axis === 'z') object.position.z = val;
}