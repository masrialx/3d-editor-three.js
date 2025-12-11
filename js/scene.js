import * as THREE from 'three';

export function initScene(container, requestRender) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Professional camera setup with proper FOV and limits
    const camera = new THREE.PerspectiveCamera(
        50, // Professional FOV (50-60 degrees is standard)
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for realism
    container.appendChild(renderer.domElement);

    // Adaptive grid helper with visibility toggle support
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x555555);
    scene.add(gridHelper);

    // Axes helper with subtle coloring
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Professional lighting setup: ambient + directional + optional point light
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

    const handleResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        requestRender();
    };

    window.addEventListener('resize', handleResize);

    return {
        scene,
        camera,
        renderer,
        gridHelper,
        axesHelper,
        dispose: () => window.removeEventListener('resize', handleResize)
    };
}
