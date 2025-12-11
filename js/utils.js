export function disposeObject(object) {
    if (!object) return;
    
    if (object.geometry) object.geometry.dispose();
    
    if (object.material) {
        if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
        } else {
            object.material.dispose();
        }
    }
}

export function generateUUID() {
    return Math.random().toString(36).substring(2, 9);
}