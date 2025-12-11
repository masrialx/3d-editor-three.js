# Three.js 3D Editor

A professional, production-ready Three.js editor for creating, transforming, and managing 3D scenes. Built with ES modules, optimized rendering, and comprehensive validation for a smooth, professional editing experience.

## ✨ Features

### Core Functionality
- **Add Primitives**: Box, Sphere, Cylinder with default colors and proper dimensions
- **Object Selection**: Raycast-based selection with visual highlight and hover preview
- **Transform Controls**: Drag-based translate, rotate, and scale with TransformControls gizmo
- **Numeric Editing**: Real-time position, rotation (degrees), and scale editing via sidebar inputs
- **Scene Persistence**: Import/Export scenes as validated JSON with versioning and metadata

### Professional Enhancements
- **Smart Camera Framing**: Automatic land-to-sky view with smooth camera animations
  - Frames entire workspace on page load
  - Auto-adjusts when objects are added
  - Frame Selected / Frame All controls
- **Grid & Snapping**: 
  - Configurable snap-to-grid for translation, rotation, and scale
  - Grid and axes visibility toggles
  - Objects automatically snap to grid when enabled
- **Conflict Prevention**:
  - Auto-shifts objects to prevent overlaps
  - Workspace boundary enforcement
  - Validation for all transformations
- **Undo/Redo**: Bounded history system with scene snapshots
- **Visual Feedback**:
  - Object creation animations (scale-up effect)
  - Selection highlights with emissive glow
  - Hover preview on objects
  - Professional notifications for actions

### Performance & Safety
- **Optimized Rendering**: Render-on-change loop (no continuous rendering)
- **Memory Management**: Proper disposal of geometries/materials
- **Input Validation**: Comprehensive validation for positions, rotations, scales
- **Error Handling**: Graceful error handling with user-friendly notifications
- **Responsive**: Automatic resize handling for camera and renderer

## 🚀 Installation

### Quick Start (Online)
1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. No build step required - uses ES modules directly
3. Can be hosted on GitHub Pages, CodeSandbox, or any static hosting

### Local Development
```bash
# Clone the repository
git clone <repo-url> threejs-editor
cd threejs-editor

# Serve with Python
python -m http.server 8080
# Open http://localhost:8080/

# Or use Node.js http-server
npx http-server -p 8080

# Or use VS Code Live Server extension
```

## 📖 Usage

### Basic Workflow

1. **Add Objects**: Click Box, Sphere, or Cylinder buttons in the sidebar
   - Objects are placed at origin (0, objectHeight/2, 0) to sit on the grid
   - Automatically selected and highlighted
   - Camera smoothly frames the new object

2. **Select Objects**: 
   - Left-click on any object to select it
   - Selected object shows highlight and transform gizmo
   - Properties appear in sidebar

3. **Transform Objects**:
   - **Move**: Click "Move" button or press `T` to cycle to translate mode, then drag gizmo
   - **Rotate**: Click "Rotate" button or press `T` again, then drag gizmo
   - **Scale**: Click "Scale" button or press `T` again, then drag gizmo
   - Or edit values directly in sidebar inputs

4. **Save/Load Scenes**:
   - Click "Export JSON" to download scene file
   - Click "Import JSON" to load a saved scene
   - Drag and drop JSON files onto the canvas

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `B` | Add Box |
| `S` | Add Sphere |
| `C` | Add Cylinder |
| `T` | Toggle Transform Mode (Move → Rotate → Scale) |
| `Del` / `Backspace` | Delete Selected Object |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `F` | Frame Selected Object |
| `A` | Frame All Objects |

### Mouse Controls

- **Left Click**: Select object
- **Right Click + Drag**: Pan camera
- **Scroll**: Zoom in/out
- **Left Click + Drag (on gizmo)**: Transform selected object

### View Controls

- **Frame Selected**: Smoothly frames the currently selected object
- **Frame All**: Frames all objects in the scene (or workspace if empty)
- **Show Grid**: Toggle grid visibility
- **Show Axes**: Toggle axes helper visibility

### Snap to Grid

Enable "Snap to Grid" checkbox to:
- Snap translation to grid units (configurable)
- Snap rotation to degree increments (default: 15°)
- Snap scale to step increments (default: 0.1)

Adjust snap values in the sidebar for fine control.

## 📁 Project Structure

```
3d-editor-three.js/
├── index.html          # Main HTML file with UI layout
├── style.css           # Professional styling (Microsoft-inspired)
├── README.md           # This file
└── js/
    ├── main.js         # Application entry point, UI wiring, event handlers
    ├── scene.js        # Scene, camera, renderer, lighting setup
    ├── controls.js     # OrbitControls and TransformControls configuration
    ├── selection.js    # Raycast selection, hover preview, highlight effects
    ├── objects.js      # Object creation, registry management, default placement
    ├── transform.js    # Position, rotation, scale updates with validation
    ├── persistence.js  # JSON import/export with validation and versioning
    ├── history.js      # Undo/redo system with scene snapshots
    ├── camera-utils.js # Camera framing utilities (land-to-sky view)
    ├── utils.js        # Helper functions (disposal, validation, UUID generation)
    └── constants.js    # Shared constants (dimensions, colors, workspace bounds)
```

### Module Responsibilities

- **main.js**: Orchestrates all modules, handles UI events, manages render loop
- **scene.js**: Initializes Three.js scene, camera, renderer, lighting, helpers
- **controls.js**: Configures camera controls with limits and constraints
- **selection.js**: Handles object selection via raycasting with visual feedback
- **objects.js**: Creates primitives with proper defaults and conflict prevention
- **transform.js**: Validates and applies transformations with workspace bounds
- **persistence.js**: Serializes/deserializes scenes with comprehensive validation
- **history.js**: Manages undo/redo stack with bounded history
- **camera-utils.js**: Calculates optimal camera positions for framing
- **utils.js**: Utility functions for disposal, validation, and helpers
- **constants.js**: Centralized configuration and constants

## 🛠 Technologies Used

- **Three.js** (v0.160.0): 3D graphics library
- **JavaScript ES6 Modules**: Modern module system
- **HTML5 / CSS3**: UI and styling
- **Three.js Addons**:
  - `OrbitControls`: Camera orbit, pan, zoom
  - `TransformControls`: Interactive transform gizmo

## ⚙️ Configuration

### Workspace Bounds
Default workspace: X/Z: -10 to +10, Y: 0 to 20
- Configurable in `js/constants.js`

### Default Object Dimensions
- **Box**: 1 × 1 × 1 units
- **Sphere**: Radius 0.5 units
- **Cylinder**: Radius 0.5, Height 1 unit
- Configurable in `js/constants.js`

### Camera Settings
- **FOV**: 50° (professional standard)
- **View Angle**: 60° diagonal top-down (land-to-sky view)
- **Min Distance**: Prevents camera from going inside objects
- **Max Distance**: Ensures full workspace visibility

## 🎯 Best Practices & Performance

### Rendering Optimization
- **Render-on-Change**: Only renders when scene changes (no continuous loop)
- **Pixel Ratio Cap**: Limited to 2 for performance on high-DPI displays
- **Efficient Raycasting**: Only checks editable objects (excludes helpers)

### Memory Management
- **Proper Disposal**: Geometries and materials disposed when objects removed
- **Event Cleanup**: Event listeners properly removed on disposal
- **WeakMap Usage**: Efficient material storage for outline effects

### Validation & Safety
- **Input Validation**: All user inputs validated before applying
- **Workspace Bounds**: All positions clamped to workspace boundaries
- **JSON Validation**: Imported scenes validated before loading
- **Error Handling**: Comprehensive try-catch with user notifications

### Code Quality
- **Modular Architecture**: Single-responsibility modules
- **ES6 Modules**: Clean imports/exports, no global pollution
- **Type Safety**: Validation functions prevent invalid operations
- **Error Messages**: User-friendly notifications for all actions

## 🔒 Security & Validation

- **JSON Validation**: Strict validation of imported scene data
- **File Size Limits**: 10MB maximum for imported files
- **Type Checking**: Validates object types, positions, rotations, scales
- **Bounds Checking**: Prevents objects from being placed outside workspace
- **Safe Parsing**: All numeric inputs safely parsed with fallbacks

## 🎨 UI/UX Features

- **Professional Design**: Microsoft Fluent UI-inspired styling
- **Smooth Animations**: Ease-out cubic animations for camera and objects
- **Visual Feedback**: 
  - Selection highlights
  - Hover previews
  - Object creation animations
  - Notification system
- **Responsive Layout**: Sidebar with scrollable content
- **Keyboard Navigation**: Full keyboard support for power users
- **Tooltips**: Helpful hints on buttons

## 📝 JSON Export Format

```json
{
  "version": "1.0.0",
  "timestamp": 1234567890,
  "objects": [
    {
      "type": "box",
      "id": "abc123",
      "name": "Box-abc1",
      "position": [0, 0.5, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "color": 52428
    }
  ]
}
```

## 🚧 Future Improvements

- Material editing (color picker, opacity, PBR parameters)
- Hierarchy panel with multi-select
- Parametric editing (dimensions, subdivisions)
- Rotation/scale snapping with configurable increments
- Per-action undo granularity (instead of full-scene snapshots)
- Lighting presets and environment maps
- Autosave with local storage recovery
- Export thumbnails/previews
- Unit tests for validation and history

## 👤 Author

**Masresha Alemu**

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

**Note**: This is a production-ready 3D editor suitable for educational purposes, prototyping, and as a foundation for more complex 3D editing applications.
