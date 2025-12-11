# Three.js 3D Editor

A lightweight, production-ready Three.js editor for creating, transforming, and saving simple 3D scenes. Built with ES modules and a render-on-change loop to stay efficient.

## Features
- Add primitives: Box, Sphere, Cylinder (default colors).
- Selection highlight with `TransformControls` for translate/rotate/scale.
- Position, rotation (deg), and scale editing via sidebar inputs.
- Snap-to-grid option (integer translation).
- Undo/Redo with bounded history (scene snapshots).
- Import/Export scenes as validated JSON with safe defaults.
- Render-on-change loop; resize-safe camera/renderer.
- Proper disposal of geometries/materials when deleting or clearing the scene.

## Installation
### Online (quick view)
- Open in CodeSandbox or host the root on GitHub Pages; `index.html` runs directly in modern browsers.

### Local
```bash
git clone <repo-url> threejs-editor
cd threejs-editor
# Serve statically with any simple server
python -m http.server 8080
# then open http://localhost:8080/
```
Any static server works (e.g., VS Code Live Server).

## Usage
1) Open `index.html` in a modern browser (ES modules enabled).  
2) Sidebar:
   - Add: Box / Sphere / Cylinder.
   - Properties: selected object ID; transform mode buttons (Move/Rotate/Scale); inputs for Position (X/Y/Z), Rotation (deg), Scale; dimensions summary.
   - Scene: Export JSON, Import JSON (file picker), Clear Scene, Snap to Grid toggle, Undo/Redo.  
3) Viewport controls:
   - Left click: select object (highlight + gizmo attach).
   - Right click: pan; Scroll: zoom.
   - `T`: cycle gizmo modes (translate → rotate → scale).
4) Import/Export:
   - Export saves `scene-data.json`.
   - Import expects validated JSON and rebuilds objects safely.

## Project Structure
- `index.html` — Layout, import map, module bootstrapping.
- `style.css` — Sidebar and UI styling.
- `js/main.js` — App bootstrap, UI wiring, render scheduling, history, snap toggle.
- `js/scene.js` — Scene/camera/renderer setup, resize handling.
- `js/controls.js` — Orbit + Transform controls, render-on-change hooks.
- `js/selection.js` — Raycast selection, highlight, gizmo attach/detach.
- `js/objects.js` — Primitive factories and registry.
- `js/transform.js` — Safe position, rotation (deg), and scale updates from inputs.
- `js/persistence.js` — JSON serialize/import with validation and rebuild.
- `js/history.js` — Undo/redo stack (scene snapshots).
- `js/utils.js` — Disposal and parsing helpers.
- `js/constants.js` — Shared constants (types, colors, filenames).

## Technologies Used
- Three.js, JavaScript (ES modules), HTML, CSS.
- Three.js addons: `OrbitControls`, `TransformControls`.

## Performance & Best Practices
- Render only on change (no continuous loop).
- Resize-aware camera/renderer; orbit damping with transform drag disabling orbit.
- Memory safety: dispose geometries/materials on delete/clear.
- Validated JSON import (known types, numeric vectors) before mutating the scene.
- Modular, single-responsibility ES modules to reduce globals and ease maintenance.

## Future Improvements
- Rotation/scale snapping with configurable increments.
- Per-action undo granularity (add/remove/move/rotate/scale) instead of whole-scene snapshots.
- Parametric editing (dimensions, subdivisions) and material editing (color picker, opacity, PBR params).
- Hierarchy panel, multi-select, and group transforms.
- Lighting presets, environment maps, and simple ground/shadow toggles.
- Autosave/local recovery and downloadable thumbnails.
- Lightweight tests for import/export validation and history.

## Author
- Your Name Masresha Alemu
