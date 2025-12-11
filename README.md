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
- **Smart Camera System**: Professional camera behavior matching industry standards
  - **Initial Setup**: Isometric-like view (45° horizontal, 30° elevation) at optimal distance (8 units)
  - **Auto-Framing**: First object automatically framed once with smooth animation (isometric view, not top view)
  - **Camera Persistence**: Camera position, target, and FOV saved/restored with scene export/import
  - **Camera Stabilization**: Prevents camera from flying away or going out of bounds
  - **Zoom Limits**: Min distance (1 unit) prevents going inside objects, Max distance (30 units) prevents leaving scene
  - **Target Management**: OrbitControls target automatically set to object center for proper zoom/rotate/pan behavior
  - **Frame Controls**: Frame Selected / Frame All with smooth animations
- **Grid & Snapping**: 
  - Configurable snap-to-grid for translation, rotation, and scale
  - Grid and axes visibility toggles
  - Objects automatically snap to grid when enabled
- **Conflict Prevention**:
  - Auto-shifts objects to prevent overlaps (spiral search algorithm)
  - Workspace boundary enforcement
  - Validation for all transformations
- **Undo/Redo**: Bounded history system with scene snapshots (50 action limit)
- **Visual Feedback**:
  - Instant object creation (no animation for stability)
  - Selection highlights with emissive glow
  - Hover preview on objects
  - Professional notifications for actions

### Performance & Safety
- **Optimized Rendering**: Render-on-change loop (no continuous rendering)
- **Memory Management**: Proper disposal of geometries/materials
- **Input Validation**: Comprehensive validation for positions, rotations, scales
- **Error Handling**: Graceful error handling with user-friendly notifications
- **Responsive**: Automatic resize handling for camera and renderer

## 🚀 How to Run the App

### Quick Start (No Installation Required)
1. **Open directly in browser**: Simply open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. **No build step required**: Uses ES modules directly, works out of the box
3. **Online hosting**: Can be hosted on GitHub Pages, CodeSandbox, Netlify, or any static hosting service

### Local Development Server

If you need to run a local server (required for some browsers due to CORS), use one of these methods:

**Option 1: Python HTTP Server**
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080

# Then open: http://localhost:8080/
```

**Option 2: Node.js http-server**
```bash
# Install globally (one time)
npm install -g http-server

# Run server
http-server -p 8080

# Or use npx (no installation needed)
npx http-server -p 8080

# Then open: http://localhost:8080/
```

**Option 3: VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

**Option 4: PHP Built-in Server**
```bash
php -S localhost:8080
```

### Requirements
- Modern browser with ES6 module support (Chrome 61+, Firefox 60+, Safari 11+, Edge 16+)
- No Node.js or build tools required
- Internet connection (for loading Three.js from CDN)

## 📖 Usage

### Basic Workflow

1. **Add Objects**: Click Box, Sphere, or Cylinder buttons in the sidebar
   - Objects are placed at origin (0, objectHeight/2, 0) to sit on the grid
   - Automatically selected and highlighted
   - OrbitControls target automatically set to object center
   - First object only: Camera smoothly frames with isometric view (45°/30° angle)
   - Subsequent objects: Camera stays where user left it (no auto-jump)

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

- **Left Click**: Select object (OrbitControls target updates to object center)
- **Right Click + Drag**: Pan camera
- **Scroll**: Zoom in/out (zooms toward OrbitControls target, not drifting away)
- **Left Click + Drag (on gizmo)**: Transform selected object
- **Middle Mouse + Drag**: Rotate camera around target

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
- **Initial View**: Isometric-like (45° horizontal, 30° elevation) at 8 units distance
- **Min Distance**: 1 unit (prevents camera from going inside objects)
- **Max Distance**: 30 units (prevents camera from flying away, capped for stability)
- **Target Management**: OrbitControls target automatically set to object center when objects are created/selected
- **Camera Bounds**: Camera position clamped to prevent leaving scene (-50 to +50 on X/Z, 0.5 to 50 on Y)
- **Persistence**: Camera position, target, and FOV saved with scene export and restored on import

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

### Camera Behavior (Professional Standards)
- **No Camera Jumps**: Camera stays where user left it when creating objects (except first object)
- **Stable Zoom**: Zoom always moves toward object center, never drifts away
- **No Shake/Jitter**: OrbitControls disabled during camera animations and transform operations
- **Bounds Enforcement**: Camera position and target clamped to prevent leaving scene
- **Smooth Animations**: Ease-out cubic animations for all camera movements
- **Target Management**: OrbitControls target automatically synchronized with object positions

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

The exported JSON includes scene objects and camera state:

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
  ],
  "camera": {
    "position": [8.66, 5, 8.66],
    "target": [0, 1, 0],
    "fov": 50
  }
}
```

**Note**: The `camera` field is optional. If present, the camera position, target, and FOV are restored on import. If absent, the scene is auto-framed.

## ✅ Complete Features

All features listed below are **fully implemented and working**:

### Core Functionality ✅
- ✅ **Add 3D Primitives**: Box, Sphere, Cylinder with default colors and proper dimensions
- ✅ **Object Selection**: Instant, smooth raycast-based selection with visual highlight
  - Single-click selection (no double-click needed)
  - Immediate selection switching between objects
  - No flicker, shake, or jitter
  - Hover preview on objects
- ✅ **Transform Controls**: Professional drag-based transform gizmo
  - Move (translate), Rotate, Scale modes
  - Visual handles that don't interfere with selection
  - OrbitControls disabled during drag to prevent conflicts
- ✅ **Numeric Editing**: Real-time position, rotation (degrees), and scale editing via sidebar
- ✅ **Scene Persistence**: Full JSON import/export with validation
  - Camera state saved and restored
  - Drag-and-drop file import
  - Versioning and metadata support

### Camera & View Management ✅
- ✅ **Professional Camera System**: Industry-standard behavior
  - Isometric-like initial view (45° horizontal, 30° elevation) at 8 units
  - Camera stays where user positions it (no auto-jumps on object creation)
  - First object auto-framed once only (isometric view, not top view)
  - Camera persistence (position, target, FOV saved/restored)
  - Camera stabilization (prevents flying away, bounds enforcement)
  - Zoom limits (1-30 units) prevent camera issues
  - OrbitControls target automatically set to object center
  - Smooth camera animations without jitter
- ✅ **View Controls**: Frame Selected (F), Frame All (A), Grid/Axes toggles

### Grid & Snapping ✅
- ✅ **Snap-to-Grid**: Configurable for translation, rotation, and scale
- ✅ **Grid & Axes**: Visibility toggles with proper rendering
- ✅ **Automatic Snapping**: Objects snap to grid when enabled

### Conflict Prevention & Validation ✅
- ✅ **Overlap Prevention**: Auto-shifts objects using spiral search algorithm
- ✅ **Workspace Bounds**: All positions clamped to workspace boundaries
- ✅ **Input Validation**: Comprehensive validation for all transformations
- ✅ **Error Handling**: Graceful error handling with user-friendly notifications

### Undo/Redo System ✅
- ✅ **History Management**: Bounded history system (50 action limit)
- ✅ **Scene Snapshots**: Full scene state saved for undo/redo
- ✅ **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Y/Ctrl+Shift+Z (redo)

### Visual Feedback ✅
- ✅ **Selection Highlights**: Emissive glow on selected objects (visual only, no transform modification)
- ✅ **Hover Preview**: Subtle highlight on hover
- ✅ **Notifications**: Professional toast notifications for actions
- ✅ **Instant Object Creation**: Objects appear immediately (no animation for stability)

### Performance & Stability ✅
- ✅ **Optimized Rendering**: Render-on-change loop (no continuous rendering)
- ✅ **Memory Management**: Proper disposal of geometries, materials, textures
- ✅ **Memory Leak Prevention**: Event listeners properly cleaned up
- ✅ **Responsive**: Automatic resize handling for camera and renderer
- ✅ **Smooth Interactions**: No jitter, shake, or flicker in selection or transforms

## 🚧 What Would Be Added/Fixed With More Time

This section outlines features and improvements that would be implemented given more development time:

### High Priority Enhancements

**Material & Appearance Editing**
- Color picker for object materials
- Opacity/transparency controls
- PBR (Physically Based Rendering) material parameters
- Texture mapping support
- Material presets library

**Object Management**
- Object duplication/cloning (Ctrl+D)
- Multi-object selection (Ctrl+Click, Shift+Click)
- Group operations (group/ungroup selected objects)
- Object hierarchy panel with tree view
- Object renaming in hierarchy
- Object visibility toggle

**Advanced Transform Features**
- Per-action undo granularity (instead of full-scene snapshots)
  - Currently: Full scene snapshot on each action
  - Would be: Individual action tracking (move, rotate, scale separately)
- Transform constraints (lock X/Y/Z axes)
- Local vs World space transform modes
- Transform history for individual objects

**Parametric Editing**
- Direct dimension editing (width, height, depth for boxes)
- Subdivision controls for spheres and cylinders
- Custom geometry creation
- Boolean operations (union, subtract, intersect)

### Medium Priority Features

**Lighting & Environment**
- Lighting presets (studio, outdoor, indoor)
- Environment maps (HDRI)
- Custom light placement and editing
- Shadow quality settings
- Ambient occlusion

**Scene Management**
- Scene layers/groups
- Scene templates
- Multiple scene tabs
- Scene comparison/diff view

**Import/Export Enhancements**
- Export to GLTF/GLB format
- Export thumbnails/previews
- Import from GLTF/OBJ/STL
- Batch export multiple scenes
- Export with different quality settings

**User Experience**
- Autosave with local storage recovery
- Keyboard shortcut customization
- Customizable UI layout
- Toolbar customization
- Context menus (right-click menus)
- Object properties panel with more details

### Technical Improvements

**Performance**
- Object instancing for repeated objects
- Level-of-detail (LOD) system
- Frustum culling optimization
- Web Workers for heavy computations
- Progressive rendering for large scenes

**Testing & Quality**
- Unit tests for validation functions
- Integration tests for history system
- E2E tests for user workflows
- Performance benchmarking
- Browser compatibility testing

**Code Architecture**
- TypeScript migration for type safety
- Component-based architecture
- Plugin system for extensibility
- Configuration file for settings
- Better error reporting and logging

### Nice-to-Have Features

**Collaboration**
- Real-time collaborative editing
- Scene sharing via URL
- Version control integration
- Comment system on objects

**Advanced Tools**
- Measurement tools (distance, angle)
- Grid alignment guides
- Object snapping to other objects
- Constraint system (align, distribute)
- Animation timeline
- Keyframe animation

**Documentation & Help**
- Interactive tutorials
- Tooltips with examples
- Keyboard shortcut reference panel
- Video tutorials
- Community examples gallery

### Known Issues to Fix

**Minor Bugs**
- None currently known (all reported issues have been fixed)

**Performance Optimizations**
- Large scene handling (100+ objects)
- Complex geometry rendering
- Mobile device optimization

**Browser Compatibility**
- Older browser fallbacks
- Mobile browser testing
- Touch gesture support for tablets

## 👤 Author

**Masresha Alemu**

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

**Note**: This is a production-ready 3D editor suitable for educational purposes, prototyping, and as a foundation for more complex 3D editing applications.
