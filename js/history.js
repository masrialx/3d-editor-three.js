/**
 * Simple undo/redo manager using full-scene snapshots.
 * Stores a bounded stack of serialized scene states.
 */
export function createHistory({ serialize, load, requestRender, limit = 50 }) {
    const undoStack = [];
    const redoStack = [];

    const push = (stack, data) => {
        stack.push(structuredClone(data));
        if (stack.length > limit) stack.shift();
    };

    function record() {
        const snapshot = serialize();
        push(undoStack, snapshot);
        redoStack.length = 0;
    }

    function undo() {
        if (!undoStack.length) return;
        const current = serialize();
        const previous = undoStack.pop();
        push(redoStack, current);
        load(previous);
        requestRender();
    }

    function redo() {
        if (!redoStack.length) return;
        const current = serialize();
        const next = redoStack.pop();
        push(undoStack, current);
        load(next);
        requestRender();
    }

    return {
        record,
        undo,
        redo,
        canUndo: () => undoStack.length > 0,
        canRedo: () => redoStack.length > 0
    };
}

