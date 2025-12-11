// Efeito 3D com Three.js para a página inicial
let scene, camera, renderer, airplane, clouds = [];
let mouseX = 0, mouseY = 0;
let scrollY = 0;

function init3D() {
    const canvas = document.getElementById('canvas-3d');
    if (!canvas) return;

    // Criar cena
    scene = new THREE.Scene();
    
    // Criar câmera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;
    camera.position.y = 0;

    // Criar renderizador
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Criar avião 3D
    const airplaneGroup = new THREE.Group();
    
    // Corpo do avião
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x40E0D0,
        metalness: 0.7,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    airplaneGroup.add(body);

    // Asas
    const wingGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.3);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0x20B2AA,
        metalness: 0.7,
        roughness: 0.3
    });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.set(0, 0, 0.2);
    airplaneGroup.add(wing);

    // Cauda
    const tailGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.1);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.3, 0);
    airplaneGroup.add(tail);

    // Hélice
    const propGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8);
    const prop = new THREE.Mesh(propGeometry, new THREE.MeshStandardMaterial({
        color: 0xD4AF37
    }));
    prop.position.set(0.45, 0, 0);
    airplaneGroup.add(prop);

    airplaneGroup.position.set(-5, 2, -3);
    airplaneGroup.rotation.y = Math.PI / 4;
    scene.add(airplaneGroup);
    airplane = airplaneGroup;

    // Criar paisagem tropical em camadas
    createTropicalLandscape();

    // Criar partículas (brilho)
    createParticles();

    // Event listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onWindowResize);

    // Iniciar animação
    animate();
}

function createTropicalLandscape() {
    // Fundo - céu gradiente
    const skyGeometry = new THREE.PlaneGeometry(50, 30);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.DoubleSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.set(0, 5, -10);
    scene.add(sky);

    // Palmeiras em camadas
    for (let i = 0; i < 15; i++) {
        const palmGroup = new THREE.Group();
        
        // Tronco
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        palmGroup.add(trunk);

        // Folhas
        for (let j = 0; j < 6; j++) {
            const leafGeometry = new THREE.ConeGeometry(0.3, 1, 3);
            const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            const angle = (j / 6) * Math.PI * 2;
            leaf.position.set(
                Math.cos(angle) * 0.3,
                2,
                Math.sin(angle) * 0.3
            );
            leaf.rotation.z = angle;
            palmGroup.add(leaf);
        }

        const x = (Math.random() - 0.5) * 30;
        const z = -5 - Math.random() * 10;
        palmGroup.position.set(x, 0, z);
        palmGroup.scale.set(
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
        );
        scene.add(palmGroup);
    }

    // Oceano
    const oceanGeometry = new THREE.PlaneGeometry(50, 20);
    const oceanMaterial = new THREE.MeshStandardMaterial({
        color: 0x4682B4,
        metalness: 0.3,
        roughness: 0.7
    });
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -2;
    scene.add(ocean);
}

function createParticles() {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 30;
        positions[i + 1] = Math.random() * 15;
        positions[i + 2] = (Math.random() - 0.5) * 20;
        
        const color = new THREE.Color(0xD4AF37);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onScroll() {
    scrollY = window.scrollY;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (airplane) {
        // Movimento em zigue-zague baseado no scroll
        const zigzagX = Math.sin(scrollY * 0.01) * 3;
        const zigzagY = Math.cos(scrollY * 0.008) * 2;
        
        airplane.position.x += (zigzagX - airplane.position.x) * 0.05;
        airplane.position.y += (zigzagY - airplane.position.y) * 0.05;
        airplane.position.z = -3 - (scrollY * 0.01);
        
        // Rotação suave
        airplane.rotation.y += 0.01;
        airplane.rotation.z = Math.sin(scrollY * 0.01) * 0.2;
        
        // Efeito parallax com mouse
        const parallaxX = mouseX * 0.5;
        const parallaxY = mouseY * 0.5;
        airplane.position.x += parallaxX * 0.1;
        airplane.position.y += parallaxY * 0.1;
    }

    // Rotação suave da câmera
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 0.5 + scrollY * 0.001 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// Carregar Three.js e inicializar quando a página estiver pronta
document.addEventListener('DOMContentLoaded', function() {
    if (typeof THREE !== 'undefined') {
        init3D();
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = init3D;
        document.head.appendChild(script);
    }
});
