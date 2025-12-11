import * as THREE from 'three';
import { WORKSPACE_BOUNDS } from './constants.js';
import { frameWorkspace } from './camera-utils.js';

export function initScene(container, requestRender) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Professional camera setup with proper FOV and limits
    // Ensure container has dimensions - use window size as fallback
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    
    const camera = new THREE.PerspectiveCamera(
        50, // Professional FOV (50-60 degrees is standard)
        width / height,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for realism
    container.appendChild(renderer.domElement);

    // Adaptive grid helper with visibility toggle support
    // Grid aligned with workspace boundaries
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x555555);
    scene.add(gridHelper);

    // Axes helper with subtle coloring
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Professional lighting setup: ambient + directional for clear visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2); // Softer ambient
    scene.add(ambientLight);

    // Main directional light with soft shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    // Optional fill light for better visualization
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Set initial camera position - will be properly framed after controls are initialized
    // Use a safe default that shows the workspace
    camera.position.set(18, 18, 18);
    camera.lookAt(0, 5, 0);

    const handleResize = () => {
        const newWidth = Math.max(container.clientWidth || 800, 800);
        const newHeight = Math.max(container.clientHeight || 600, 600);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        requestRender();
    };

    window.addEventListener('resize', handleResize);
    
    // Ensure initial render
    requestRender();

    return {
        scene,
        camera,
        renderer,
        gridHelper,
        axesHelper,
        dispose: () => window.removeEventListener('resize', handleResize)
    };
}
