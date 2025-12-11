## Three.js 3D Editor

Lightweight Three.js editor for creating, transforming, and saving simple 3D scenes. Uses ES modules and renders only when something changes.

### How to Run
1) Open `index.html` in any modern browser (ES modules enabled).  
2) Use the sidebar to add objects, edit them, and import/export JSON scenes.  
3) Controls: Left click select, right click pan, scroll zoom, `T` cycles transform modes (translate/rotate/scale). Enable “Snap to Grid” for integer moves; Undo/Redo steps through scene history.

### Completed Features
- Primitives: box, sphere, cylinder with default colors.
- Selection highlight + TransformControls for drag-based transforms.
- Position editing via UI inputs.
- Snap-to-grid option (translation).
- Undo/Redo with bounded history (scene snapshots).
- Import/export JSON with validation and safe defaults.
- Render-on-change loop; resize-safe camera/renderer.
- Proper disposal of geometries/materials when deleting/clearing.

### What I’d Add/Fix with More Time
- Rotation/scale snapping and configurable snap increments.
- Per-action undo granularity (add/remove/move/rotate/scale separately) instead of full-scene snapshots.
- Hierarchy panel and multi-select.
- Basic lighting presets and environment map options.
- Autosave/local storage recovery and downloadable thumbnails.

