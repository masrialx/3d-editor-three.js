import * as THREE from 'three';
import { WORKSPACE_BOUNDS } from './constants.js';

export function initScene(container, requestRender) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Professional camera setup with proper FOV and limits
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Grid helper aligned with workspace boundaries
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x555555);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Professional lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);

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

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Industry standard initial camera position: isometric-like view
    // x=45°, y=30° elevation, distance ~10 units
    const initialDistance = 10;
    const horizontalAngle = 45 * (Math.PI / 180);
    const elevationAngle = 30 * (Math.PI / 180);
    const horizontalDist = initialDistance * Math.cos(elevationAngle);
    const verticalDist = initialDistance * Math.sin(elevationAngle);
    
    camera.position.set(
        horizontalDist * Math.cos(horizontalAngle),
        verticalDist + 5, // Center vertically
        horizontalDist * Math.sin(horizontalAngle)
    );
    camera.lookAt(0, 5, 0); // Look at scene center

    const handleResize = () => {
        const newWidth = Math.max(container.clientWidth || 800, 800);
        const newHeight = Math.max(container.clientHeight || 600, 600);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        requestRender();
    };

    window.addEventListener('resize', handleResize);
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
