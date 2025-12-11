import * as THREE from 'three';

export function initScene(container) {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x555555);
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return { scene, camera, renderer };
}