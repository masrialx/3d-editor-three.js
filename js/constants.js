export const OBJECT_TYPES = {
    BOX: 'box',
    SPHERE: 'sphere',
    CYLINDER: 'cylinder'
};

export const DEFAULT_COLORS = {
    [OBJECT_TYPES.BOX]: 0x007acc,
    [OBJECT_TYPES.SPHERE]: 0xff6b6b,
    [OBJECT_TYPES.CYLINDER]: 0x4ecdc4
};

export const EXPORT_FILE_NAME = 'scene-data.json';

// Professional default object dimensions
export const DEFAULT_DIMENSIONS = {
    [OBJECT_TYPES.BOX]: { width: 1, height: 1, depth: 1 },
    [OBJECT_TYPES.SPHERE]: { radius: 0.5 },
    [OBJECT_TYPES.CYLINDER]: { radius: 0.5, height: 1 }
};

// Workspace constraints (professional standard)
export const WORKSPACE_BOUNDS = {
    minX: -10,
    maxX: 10,
    minY: 0,
    maxY: 20,
    minZ: -10,
    maxZ: 10
};

// Grid configuration
export const GRID_CONFIG = {
    size: 1,
    snapEnabled: false
};

// Scale constraints
export const SCALE_LIMITS = {
    min: 0.1,
    max: 10
};

// Rotation constraints (degrees)
export const ROTATION_LIMITS = {
    min: 0,
    max: 360
};
