// Main scene variables
let scene, camera, renderer;
let roadGroup, skybox, sun, moon;
let ambientLight, directionalLight;
let isNight = false;
let speed = 0.5;
let groundPlane; // Reference to the ground plane for opacity changes
let isTransitioning = false; // For sunset/sunrise animation
let transitionProgress = 0; // For tracking transition progress
let transitionDirection = 1; // 1 for day->night, -1 for night->day
let sunObject; // Reference to the sun object
let clouds = []; // Reference to cloud objects
let mountains = [];
let dayNightCycle = 0; // 0 to 2π for full day/night cycle
let dayNightSpeed = 0.0005; // Speed of day/night cycle
let specks = []; // Added specks array
const sunPathRadius = 400; // Increased radius for sun/moon path
const sunPathHeight = 300; // Maximum height of sun/moon

// Scene transition variables
const scenes = ['desert', 'forest', 'snowy', 'urban'];
let currentSceneIndex = 0;
let nextSceneIndex = 0;
let isSceneTransitioning = false;
let sceneTransitionProgress = 0;
const sceneTransitionDuration = 10000; // 10 seconds for transition
let lastSceneChangeTime = 0;
const sceneChangeDuration = 30000; // 30 seconds between scene changes

// Scene-specific color palettes and lighting states
const sceneStates = {
    desert: {
        dayColors: {
            ground: new THREE.Color(0xC2B280),
            sky: new THREE.Color(0x87CEEB),
            ambient: 1.0
        },
        nightColors: {
            ground: new THREE.Color(0x3B3530),
            sky: new THREE.Color(0x000033),
            ambient: 0.3
        }
    },
    forest: {
        dayColors: {
            ground: new THREE.Color(0x228B22),
            sky: new THREE.Color(0x87CEEB),
            ambient: 1.0
        },
        nightColors: {
            ground: new THREE.Color(0x0B2F0B),
            sky: new THREE.Color(0x000033),
            ambient: 0.3
        }
    },
    snowy: {
        dayColors: {
            ground: new THREE.Color(0xFFFFFF),
            sky: new THREE.Color(0xB0E0E6),
            ambient: 1.0
        },
        nightColors: {
            ground: new THREE.Color(0xCCCCCC),
            sky: new THREE.Color(0x000033),
            ambient: 0.3
        }
    },
    urban: {
        dayColors: {
            ground: new THREE.Color(0x808080),
            sky: new THREE.Color(0x87CEEB),
            ambient: 1.0
        },
        nightColors: {
            ground: new THREE.Color(0x202020),
            sky: new THREE.Color(0x000033),
            ambient: 0.3
        }
    }
};

// Object definitions for each scene
const sceneObjects = {
    desert: {
        createObject: (scale = 1) => {
            const group = new THREE.Group();
            const type = Math.random();
            
            if (type < 0.33) {
                // Cactus
                const height = (Math.random() * 3 + 1) * scale;
                const geo = new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, height, 8);
                const mat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
                const cactus = new THREE.Mesh(geo, mat);
                group.add(cactus);
                
                if (Math.random() > 0.5) {
                    const armGeo = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, Math.random() * 2 * scale, 8);
                    const arm = new THREE.Mesh(armGeo, mat);
                    arm.position.y = Math.random() * 2 * scale;
                    arm.position.x = (Math.random() > 0.5 ? 0.3 : -0.3) * scale;
                    arm.rotation.z = Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4;
                    group.add(arm);
                }
            } else if (type < 0.66) {
                // Rock
                const geo = new THREE.DodecahedronGeometry((Math.random() * 0.5 + 0.2) * scale);
                const mat = new THREE.MeshBasicMaterial({ color: 0x808080 });
                const rock = new THREE.Mesh(geo, mat);
                group.add(rock);
            } else {
                // Desert shrub
                const geo = new THREE.SphereGeometry((Math.random() * 0.5 + 0.2) * scale, 8, 8);
                const mat = new THREE.MeshBasicMaterial({ color: 0x556B2F });
                const shrub = new THREE.Mesh(geo, mat);
                group.add(shrub);
            }
            return group;
        }
    },
    forest: {
        createObject: (scale = 1) => {
            const group = new THREE.Group();
            const type = Math.random();
            
            if (type < 0.5) {
                // Tree
                const height = (Math.random() * 10 + 5) * scale;
                const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, height, 8);
                const trunkMat = new THREE.MeshBasicMaterial({ color: 0x4A3728 });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                
                const leavesGeo = new THREE.ConeGeometry(2 * scale, height * 0.7, 8);
                const leavesMat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
                const leaves = new THREE.Mesh(leavesGeo, leavesMat);
                leaves.position.y = height * 0.2;
                
                group.add(trunk);
                group.add(leaves);
            } else if (type < 0.75) {
                // Forest rock
                const geo = new THREE.DodecahedronGeometry((Math.random() * 0.5 + 0.2) * scale);
                const mat = new THREE.MeshBasicMaterial({ color: 0x696969 });
                const rock = new THREE.Mesh(geo, mat);
                group.add(rock);
            } else {
                // Bush
                const geo = new THREE.SphereGeometry((Math.random() * 1 + 0.5) * scale, 8, 8);
                const mat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
                const bush = new THREE.Mesh(geo, mat);
                group.add(bush);
            }
            return group;
        }
    },
    snowy: {
        createObject: (scale = 1) => {
            const group = new THREE.Group();
            const type = Math.random();
            
            if (type < 0.4) {
                // Snow-covered pine
                const height = (Math.random() * 8 + 4) * scale;
                const layers = 5;
                const layerHeight = height / layers;
                
                for (let i = 0; i < layers; i++) {
                    const coneGeo = new THREE.ConeGeometry((1 - i/layers) * 2 * scale, layerHeight, 8);
                    const coneMat = new THREE.MeshBasicMaterial({ color: 0xF0FFF0 });
                    const cone = new THREE.Mesh(coneGeo, coneMat);
                    cone.position.y = i * layerHeight;
                    group.add(cone);
                }
            } else if (type < 0.7) {
                // Snow mound
                const geo = new THREE.SphereGeometry((Math.random() * 1 + 0.5) * scale, 8, 8);
                const mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
                const mound = new THREE.Mesh(geo, mat);
                group.add(mound);
            } else {
                // Ice crystal
                const geo = new THREE.OctahedronGeometry((Math.random() * 0.5 + 0.2) * scale);
                const mat = new THREE.MeshBasicMaterial({ color: 0xE0FFFF, transparent: true, opacity: 0.7 });
                const crystal = new THREE.Mesh(geo, mat);
                group.add(crystal);
            }
            return group;
        }
    },
    urban: {
        createObject: (scale = 1) => {
            const group = new THREE.Group();
            const type = Math.random();
            
            if (type < 0.4) {
                // Street light
                const height = (Math.random() * 4 + 3) * scale;
                const poleGeo = new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, height, 8);
                const poleMat = new THREE.MeshBasicMaterial({ color: 0x696969 });
                const pole = new THREE.Mesh(poleGeo, poleMat);
                
                const lampGeo = new THREE.SphereGeometry(0.3 * scale, 8, 8);
                const lampMat = new THREE.MeshBasicMaterial({ color: 0xFFFF99, transparent: true, opacity: 0.5 });
                const lamp = new THREE.Mesh(lampGeo, lampMat);
                lamp.position.y = height * 0.5;
                
                group.add(pole);
                group.add(lamp);
            } else if (type < 0.7) {
                // Traffic sign
                const poleGeo = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 2 * scale, 8);
                const poleMat = new THREE.MeshBasicMaterial({ color: 0x808080 });
                const pole = new THREE.Mesh(poleGeo, poleMat);
                
                const signGeo = new THREE.BoxGeometry(0.8 * scale, 0.8 * scale, 0.1 * scale);
                const signMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
                const sign = new THREE.Mesh(signGeo, signMat);
                sign.position.y = 1 * scale;
                
                group.add(pole);
                group.add(sign);
            } else {
                // Fire hydrant
                const baseGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 0.8 * scale, 8);
                const baseMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
                const base = new THREE.Mesh(baseGeo, baseMat);
                
                const topGeo = new THREE.SphereGeometry(0.2 * scale, 8, 8);
                const top = new THREE.Mesh(topGeo, baseMat);
                top.position.y = 0.5 * scale;
                
                group.add(base);
                group.add(top);
            }
            return group;
        }
    }
};

// Object arrays
let roadSegments = [], streetLamps = [], buildings = [], stars = [], desertObjects = [];
let leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine; // Continuous road lines
let laneLines = [], centerDashes = [];

// Constants
const roadWidth = 10, roadLength = 100, segmentCount = 100; // Increased length and segments
const totalRoadLength = roadLength * segmentCount * 4; // Quadrupled for extra visibility
const lampHeight = 10, lampSpacing = 30;
const speckCount = 2000;
const dashLength = 1, dashSpacing = 10;
const fadeDelay = 5000; // 5 seconds before UI fades

// Camera controls
const moveSpeed = 0.5;
const keysPressed = {};
let cameraTarget = new THREE.Vector3(0, 2, -20);

// Add at the top with other variables
let statusDisplay;

// Initialize the scene
function init() {
    try {
        console.log('Starting initialization...');
        
        // Create the scene
        scene = new THREE.Scene();
        if (!scene) {
            throw new Error('Failed to create THREE.Scene');
        }
        console.log('Scene created successfully');

        const currentState = sceneStates[scenes[currentSceneIndex]];
        if (!currentState) {
            throw new Error(`Invalid scene state for scene: ${scenes[currentSceneIndex]}`);
        }
        
        scene.background = currentState.dayColors.sky;
        scene.fog = new THREE.FogExp2(currentState.dayColors.sky, 0.002);
        console.log('Scene background and fog set');
        
        // Create status display
        createStatusDisplay();
        
        // Create the camera
        try {
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(5, 5, 20);
            cameraTarget = new THREE.Vector3(0, 0, -20);
            camera.lookAt(cameraTarget);
            console.log('Camera initialized successfully');
        } catch (cameraError) {
            console.error('Failed to initialize camera:', cameraError);
            throw cameraError;
        }
        
        // Create the renderer
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.body.appendChild(renderer.domElement);
            console.log('Renderer initialized successfully');
        } catch (rendererError) {
            console.error('Failed to initialize renderer:', rendererError);
            throw rendererError;
        }
        
        // Create lighting
        createLighting();
        
        // Create sun object
        createSun();
        
        // Create desert ground
        createDesertGround();
        
        // Create road
        createRoad();
        
        // Create street lamps
        createStreetLamps();
        
        // Create buildings
        createBuildings();
        
        // Create random desert objects
        createDesertObjects();
        
        // Create mountains
        createMountains();
        
        // Create stars
        createStars();
        
        // Create clouds
        createClouds();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize at night
        dayNightCycle = Math.PI;
        isNight = true;
        
        // Start the animation loop
        try {
            animate();
            console.log('Animation loop started');
        } catch (error) {
            console.error('Failed to start animation loop:', error);
            throw error;
        }

        console.log('Initialization complete');
        console.log('Scene contains', scene.children.length, 'objects');
        console.log('Road segments:', roadSegments.length);
        console.log('Camera position:', camera.position);
        console.log('Current scene:', scenes[currentSceneIndex]);
        
    } catch (error) {
        console.error('Critical initialization error:', error);
        // Display error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.zIndex = '1000';
        errorDiv.innerHTML = `
            <h2>Failed to initialize scene</h2>
            <p>Error: ${error.message}</p>
            <p>Please check the console for more details.</p>
            <button onclick="location.reload()">Reload Page</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

function createLighting() {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 0);
    scene.add(directionalLight);
}

function createSun() {
    // Create a sun sphere
    const sunGeometry = new THREE.SphereGeometry(10, 16, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFF00, 
        transparent: true,
        opacity: 0.9
    });
    sunObject = new THREE.Mesh(sunGeometry, sunMaterial);
    
    // Position the sun behind and above
    sunObject.position.set(0, sunPathHeight, sunPathRadius);
    scene.add(sunObject);
    
    // Create a subtle glow around the sun
    const sunLightGeometry = new THREE.SphereGeometry(12, 16, 16);
    const sunLightMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF99,
        transparent: true,
        opacity: 0.4
    });
    const sunGlow = new THREE.Mesh(sunLightGeometry, sunLightMaterial);
    sunObject.add(sunGlow);

    // Create moon
    const moonGeometry = new THREE.SphereGeometry(8, 16, 16);
    const moonMaterial = new THREE.MeshBasicMaterial({
        color: 0xEEEEEE,
        transparent: true,
        opacity: 0.9
    });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    
    // Position moon opposite to sun
    moon.position.set(0, -sunPathHeight, -sunPathRadius);
    scene.add(moon);
    
    // Create moon glow
    const moonLightGeometry = new THREE.SphereGeometry(10, 16, 16);
    const moonLightMaterial = new THREE.MeshBasicMaterial({
        color: 0xCCCCFF,
        transparent: true,
        opacity: 0.3
    });
    const moonGlow = new THREE.Mesh(moonLightGeometry, moonLightMaterial);
    moon.add(moonGlow);
}

function createDesertGround() {
    // Create a gradient ground to hide blue sky underneath
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const currentState = sceneStates[scenes[currentSceneIndex]];
    const groundMaterial = new THREE.MeshBasicMaterial({ 
        color: currentState.dayColors.ground,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1.0
    });
    groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.2;
    scene.add(groundPlane);
    
    // Create specks for desert simulation
    createSpecks();
}

function createSpecks() {
    // Clear existing specks
    specks.forEach(speck => scene.remove(speck));
    specks = [];
    
    const currentState = sceneStates[scenes[currentSceneIndex]];
    const baseColor = currentState.dayColors.ground;
    
    // Create a richer color palette
    const colors = [
        baseColor.clone(),
        baseColor.clone().multiplyScalar(1.2),  // Lighter
        baseColor.clone().multiplyScalar(0.8),  // Darker
        baseColor.clone().lerp(new THREE.Color(0xffffff), 0.2), // Slightly desaturated
        baseColor.clone().lerp(new THREE.Color(0x000000), 0.2), // Slightly darkened
        baseColor.clone().offsetHSL(0.05, 0, 0),  // Hue shift
        baseColor.clone().offsetHSL(-0.05, 0, 0), // Opposite hue shift
        baseColor.clone().offsetHSL(0, 0.1, 0),   // More saturated
        baseColor.clone().offsetHSL(0, -0.1, 0),  // Less saturated
        baseColor.clone().offsetHSL(0, 0, 0.1)    // Brighter
    ];

    for (let i = 0; i < speckCount; i++) {
        const speckGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 8, 8);
        const speckMaterial = new THREE.MeshBasicMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 0.8
        });
        const speck = new THREE.Mesh(speckGeometry, speckMaterial);
        
        speck.position.set(
            (Math.random() < 0.5 ? -1 : 1) * (roadWidth / 2 + Math.random() * 200),
            0.1,
            Math.random() * -400
        );

        speck.userData = {
            colorShiftSpeed: Math.random() * 0.002 + 0.001,
            colorPhase: Math.random() * colors.length,
            colors: colors
        };

        scene.add(speck);
        specks.push(speck);
    }
}

function createRoad() {
    // Clear any existing road segments
    roadSegments.forEach(segment => scene.remove(segment));
    if (leftEdgeLine) scene.remove(leftEdgeLine);
    if (rightEdgeLine) scene.remove(rightEdgeLine);
    if (leftYellowLine) scene.remove(leftYellowLine);
    if (rightYellowLine) scene.remove(rightYellowLine);
    
    roadSegments = [];
    
    // Create one large road plane with extended length
    const roadGeometry = new THREE.PlaneGeometry(
        roadWidth,
        totalRoadLength,
        1,  // width segments
        segmentCount * 8 // length segments - octupled for extra smoothness
    );
    
    // Road material - pure black with 100% opacity
    const roadMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        side: THREE.DoubleSide,
        transparent: false // No transparency for better performance
    });
    
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    road.position.z = -totalRoadLength / 2;
    scene.add(road);
    roadSegments.push(road);
    
    // Create lines using BufferGeometry for better performance
    const lineWidth = 0.2;
    const lineHeight = 0.2;
    
    // Create a single geometry for all lines
    const lineGeometry = new THREE.BoxBufferGeometry(lineWidth, lineHeight, totalRoadLength);
    
    // White material for edge lines
    const whiteMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: false
    });
    
    // Yellow material for center lines
    const yellowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        transparent: false
    });
    
    // Create edge lines
    leftEdgeLine = new THREE.Mesh(lineGeometry, whiteMaterial);
    rightEdgeLine = new THREE.Mesh(lineGeometry, whiteMaterial);
    
    // Position edge lines
    leftEdgeLine.position.set(-roadWidth / 2, 0.1, -totalRoadLength / 2);
    rightEdgeLine.position.set(roadWidth / 2, 0.1, -totalRoadLength / 2);
    
    // Create center lines
    const centerLineGeometry = new THREE.BoxBufferGeometry(0.15, lineHeight, totalRoadLength);
    leftYellowLine = new THREE.Mesh(centerLineGeometry, yellowMaterial);
    rightYellowLine = new THREE.Mesh(centerLineGeometry, yellowMaterial);
    
    // Position center lines
    leftYellowLine.position.set(-0.3, 0.1, -totalRoadLength / 2);
    rightYellowLine.position.set(0.3, 0.1, -totalRoadLength / 2);
    
    // Add all lines to scene
    scene.add(leftEdgeLine);
    scene.add(rightEdgeLine);
    scene.add(leftYellowLine);
    scene.add(rightYellowLine);
}

function createStreetLamps() {
    // Clear any existing street lamps
    streetLamps.forEach(lamp => scene.remove(lamp));
    streetLamps = [];
    
    // Create street lamps along the road
    const lampCount = 10;
    const lampSpacing = roadLength * 4;
    
    for (let i = 0; i < lampCount; i++) {
        const lamp = new THREE.Group();
        
        // Lamp post
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
        const postMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 2.5;
        lamp.add(post);
        
        // Lamp head
        const headGeometry = new THREE.BoxGeometry(1, 0.5, 1);
        const headMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 5;
        lamp.add(head);
        
        // Create downward-facing glow using hemispheres
        const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF7F00,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 4.75;
        lamp.add(glow);
        
        // Slightly larger outer glow
        const outerGlowGeometry = new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF9F00,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.position.y = 4.75;
        lamp.add(outerGlow);
        
        // Lamp light - orange point light positioned to shine downward
        const light = new THREE.PointLight(0xFF7F00, 1, 15);
        light.position.y = 4.75;
        lamp.add(light);
        
        // Position lamp along the road
        lamp.position.z = -i * lampSpacing;
        lamp.position.x = (i % 2 === 0) ? -roadWidth / 2 - 2 : roadWidth / 2 + 2;
        
        // Store reference to glow objects for animation
        lamp.userData = {
            glow: glow,
            outerGlow: outerGlow,
            light: light
        };
        
        scene.add(lamp);
        streetLamps.push(lamp);
    }
}

function createBuildings() {
    // Create buildings with improved materials
    for (let i = 0; i < 10; i++) {
        const building = createRandomBuilding();
        building.position.set(
            (Math.random() < 0.5 ? -1 : 1) * (roadWidth / 2 + 15 + Math.random() * 20),
            0,
            -i * roadLength * 4 - Math.random() * 50
        );
        scene.add(building);
        buildings.push(building);
    }
}

function createRandomBuilding() {
    const width = 5 + Math.random() * 5;
    const floorCount = Math.floor(3 + Math.random() * 5);
    const depth = 5 + Math.random() * 5;
    const totalHeight = floorCount * 3;

    // Create main building geometry
    const buildingGeometry = new THREE.BoxGeometry(width, totalHeight, depth);
    const buildingMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080,
        shininess: 0
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    
    // Position building with bottom at ground level
    building.position.y = totalHeight / 2;
    
    // Create wireframe with proper position offset
    const edgesGeometry = new THREE.EdgesGeometry(buildingGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    
    // Add small structure on top (30% chance)
    if (Math.random() < 0.3) {
        const topWidth = width * 0.5;
        const topHeight = 2;
        const topDepth = depth * 0.5;
        
        const topGeometry = new THREE.BoxGeometry(topWidth, topHeight, topDepth);
        const topMesh = new THREE.Mesh(topGeometry, buildingMaterial);
        topMesh.position.y = totalHeight / 2 + topHeight / 2;
        
        const topEdges = new THREE.EdgesGeometry(topGeometry);
        const topWireframe = new THREE.LineSegments(topEdges, edgesMaterial);
        topWireframe.position.copy(topMesh.position);
        
        building.add(topMesh);
        building.add(topWireframe);
    }
    
    building.add(wireframe);
    return building;
}

function createDesertObjects() {
    // Clear any existing objects
    desertObjects.forEach(object => scene.remove(object));
    desertObjects = [];
    
    // Create objects for current scene
    const currentScene = scenes[currentSceneIndex];
    
    for (let i = 0; i < 20; i++) {
        const object = sceneObjects[currentScene].createObject();
        object.position.set(
            (Math.random() < 0.5 ? -1 : 1) * (roadWidth / 2 + 15 + Math.random() * 50),
            0,
            -i * roadLength * 2 - Math.random() * 20
        );
        scene.add(object);
        desertObjects.push(object);
    }
}

function createMountains() {
    // Clear any existing mountains
    mountains.forEach(mountain => scene.remove(mountain));
    mountains = [];
    
    // Create mountains on both sides of the road
    const mountainCount = 8;
    
    // Define zones (from road outward):
    // Road: 0 to roadWidth/2
    // Street Lamps: roadWidth/2 to roadWidth/2 + 5
    // Buildings: roadWidth/2 + 5 to roadWidth/2 + 30
    // Objects: roadWidth/2 + 30 to roadWidth/2 + 100
    // Mountains: roadWidth/2 + 100 onwards
    
    const mountainZoneStart = roadWidth/2 + 100;
    const mountainZoneWidth = 200; // How wide the mountain zone is
    
    const mountainColors = [
        new THREE.Color(0x8B4513), // Saddle brown
        new THREE.Color(0x8B5E3C), // Light brown
        new THREE.Color(0x6B4423), // Dark brown
        new THREE.Color(0x7B3F00)  // Deep brown
    ];

    for (let side = -1; side <= 1; side += 2) { // -1 for left, 1 for right
        for (let i = 0; i < mountainCount; i++) {
            const mountain = new THREE.Group();
            
            // Calculate mountain size based on distance from road
            const distanceFromRoad = mountainZoneStart + Math.random() * mountainZoneWidth;
            const maxAllowedRadius = Math.min(20, distanceFromRoad - (roadWidth/2 + 80)); // Ensure mountain radius doesn't overlap with object zone
            
            // Create main mountain shape with more detail
            const height = Math.random() * 40 + 30; // Slightly smaller mountains
            const baseWidth = Math.random() * maxAllowedRadius + maxAllowedRadius/2; // Base width constrained by max radius
            const baseDepth = Math.random() * maxAllowedRadius + maxAllowedRadius/2;
            
            // More segments for better detail
            const segments = 12;
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            const indices = [];
            const uvs = [];
            
            // Create base vertices in a circle with minimal noise
            for (let j = 0; j < segments; j++) {
                const angle = (j / segments) * Math.PI * 2;
                const radius = baseWidth * (0.9 + Math.random() * 0.2); // Less random variation
                const noiseX = (Math.random() - 0.5) * 2; // Reduced noise
                const noiseZ = (Math.random() - 0.5) * 2;
                vertices.push(
                    Math.cos(angle) * radius + noiseX,
                    0,
                    Math.sin(angle) * radius + noiseZ
                );
                uvs.push(j / segments, 0);
            }
            
            // Create intermediate rings for better mountain shape
            const ringCount = 4;
            for (let ring = 1; ring < ringCount; ring++) {
                const ringHeight = (height * ring) / ringCount;
                const ringRadius = baseWidth * (1 - ring / ringCount) * 0.8;
                
                for (let j = 0; j < segments; j++) {
                    const angle = (j / segments) * Math.PI * 2;
                    const noiseX = (Math.random() - 0.5) * (2 * (1 - ring / ringCount));
                    const noiseZ = (Math.random() - 0.5) * (2 * (1 - ring / ringCount));
                    vertices.push(
                        Math.cos(angle) * ringRadius + noiseX,
                        ringHeight,
                        Math.sin(angle) * ringRadius + noiseZ
                    );
                    uvs.push(j / segments, ring / ringCount);
                }
            }
            
            // Add peak vertex
            vertices.push(0, height, 0);
            uvs.push(0.5, 1);
            
            // Create faces between rings
            for (let ring = 0; ring < ringCount; ring++) {
                const currentRing = ring * segments;
                const nextRing = (ring + 1) * segments;
                
                for (let j = 0; j < segments; j++) {
                    const next = (j + 1) % segments;
                    indices.push(
                        currentRing + j,
                        nextRing + j,
                        currentRing + next,
                        currentRing + next,
                        nextRing + j,
                        nextRing + next
                    );
                }
            }
            
            // Create faces for final peak
            const peakIndex = segments * ringCount;
            for (let j = 0; j < segments; j++) {
                const next = (j + 1) % segments;
                indices.push(
                    peakIndex - segments + j,
                    peakIndex,
                    peakIndex - segments + next
                );
            }
            
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            
            const mountainColor = mountainColors[Math.floor(Math.random() * mountainColors.length)];
            const mountainMaterial = new THREE.MeshBasicMaterial({
                color: mountainColor,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.75
            });
            
            const mountainMesh = new THREE.Mesh(geometry, mountainMaterial);
            
            const edgesGeometry = new THREE.EdgesGeometry(geometry, 15);
            const edgesMaterial = new THREE.LineBasicMaterial({
                color: mountainColor.clone().multiplyScalar(1.2),
                transparent: true,
                opacity: 0.5
            });
            const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
            
            mountain.add(mountainMesh);
            mountain.add(edges);
            
            // Position mountain along the road, ensuring it stays in mountain zone
            const zOffset = -i * 200 - Math.random() * 200;
            
            mountain.position.set(
                side * distanceFromRoad,
                0,
                zOffset - 200
            );
            
            // Minimal rotation to maintain clean zoning
            mountain.rotation.y = (Math.random() - 0.5) * 0.05;
            
            scene.add(mountain);
            mountains.push(mountain);
        }
    }
}

function createStars() {
    // Clear existing stars
    stars.forEach(star => scene.remove(star));
    stars = [];

    // Create a particle system for stars
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.5,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    // Create arrays for star positions and custom attributes
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const twinkleSpeeds = new Float32Array(starCount);
    const twinklePhases = new Float32Array(starCount);
    const movementSpeeds = new Float32Array(starCount);

    // Initialize star positions in a dome shape that extends lower
    for (let i = 0; i < starCount; i++) {
        const radius = 800 + Math.random() * 200;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI * 0.8;

        positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
        positions[i * 3 + 1] = 200 + radius * Math.cos(theta);
        positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi);

        // Set initial color (white)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 1.0; // B

        twinkleSpeeds[i] = 0.0005 + Math.random() * 0.001;
        twinklePhases[i] = Math.random() * Math.PI * 2;
        movementSpeeds[i] = 0.05 + Math.random() * 0.05;
    }

    // Add attributes to geometry
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
    starGeometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));
    starGeometry.setAttribute('movementSpeed', new THREE.BufferAttribute(movementSpeeds, 1));

    // Enable vertex colors
    starMaterial.vertexColors = true;

    // Create the particle system
    const particleSystem = new THREE.Points(starGeometry, starMaterial);
    scene.add(particleSystem);
    stars.push(particleSystem);
}

function animateStars() {
    if (stars.length === 0) return;

    const time = Date.now() * 0.001;
    const particleSystem = stars[0];
    const positions = particleSystem.geometry.attributes.position.array;
    const colors = particleSystem.geometry.attributes.color.array;
    const twinkleSpeeds = particleSystem.geometry.attributes.twinkleSpeed.array;
    const twinklePhases = particleSystem.geometry.attributes.twinklePhase.array;
    const movementSpeeds = particleSystem.geometry.attributes.movementSpeed.array;

    // Calculate day/night factor
    const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
    const targetOpacity = isNight ? 1.0 : 0.0;
    
    // Smoothly transition star visibility
    particleSystem.material.opacity += (targetOpacity - particleSystem.material.opacity) * 0.1;

    for (let i = 0; i < positions.length; i += 3) {
        // Update position based on camera movement - reversed direction
        const movementSpeed = movementSpeeds[i / 3];
        positions[i] += camera.position.x * movementSpeed * 0.1;
        positions[i + 2] += camera.position.z * movementSpeed * 0.1;

        // Reset position if too far from original and generate new star position
        if (Math.abs(positions[i]) > 2000 || Math.abs(positions[i + 2]) > 2000) {
            const radius = 800 + Math.random() * 200;
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI * 0.8;

            // Position new star behind the camera
            positions[i] = radius * Math.sin(theta) * Math.cos(phi);
            positions[i + 1] = 200 + radius * Math.cos(theta);
            positions[i + 2] = camera.position.z - 1000 - Math.random() * 500;
        }

        // Update twinkle effect using luminosity
        const twinkle = Math.sin(time * twinkleSpeeds[i / 3] + twinklePhases[i / 3]);
        const luminosity = 0.5 + 0.5 * twinkle;
        
        // Apply luminosity to RGB values
        colors[i] = luminosity;     // R
        colors[i + 1] = luminosity; // G
        colors[i + 2] = luminosity; // B
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;
}

function animateStreetLamps() {
    const time = Date.now() * 0.001;
    
    streetLamps.forEach((lamp, index) => {
        lamp.position.z += speed;
        
        // If lamp is behind camera, reset position
        if (lamp.position.z > camera.position.z + 10) {
            lamp.position.z = camera.position.z - 400 + Math.random() * 50;
            // Alternate lamps on left and right sides
            lamp.position.x = (index % 2 === 0) ? -roadWidth / 2 - 2 : roadWidth / 2 + 2;
        }
        
        // Animate glow effects
        if (lamp.userData.glow && lamp.userData.outerGlow && lamp.userData.light) {
            const glowFactor = 0.8 + Math.sin(time * 2 + index) * 0.2;
            
            // Update glow opacity based on time of day
            let nightFactor = 1.0;
            if (!isNight) {
                nightFactor = 0.2;
            } else if (isTransitioning) {
                nightFactor = transitionDirection > 0 ? 
                    1.0 - transitionProgress * 0.8 : 
                    0.2 + transitionProgress * 0.8;
            }
            
            lamp.userData.glow.material.opacity = 0.4 * glowFactor * nightFactor;
            lamp.userData.outerGlow.material.opacity = 0.2 * glowFactor * nightFactor;
            lamp.userData.light.intensity = glowFactor * nightFactor;
        }
    });
}

function animate() {
    try {
        requestAnimationFrame(animate);
        
        // Update day/night cycle
        dayNightCycle += dayNightSpeed;
        if (dayNightCycle > Math.PI * 2) {
            dayNightCycle = 0;
        }
        
        // Calculate day/night factor (0 = night, 1 = day)
        const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
        isNight = dayFactor < 0.5;
        
        // Get current scene colors
        const currentState = sceneStates[scenes[currentSceneIndex]];
        const dayColors = currentState.dayColors;
        const nightColors = currentState.nightColors;
        
        // Calculate base colors for current time of day
        let targetSkyColor = dayColors.sky.clone().lerp(nightColors.sky, 1 - dayFactor);
        let targetGroundColor = dayColors.ground.clone().lerp(nightColors.ground, 1 - dayFactor);
        let targetAmbientIntensity = dayColors.ambient * dayFactor + nightColors.ambient * (1 - dayFactor);
        
        // Handle scene transitions
        if (isSceneTransitioning) {
            try {
                const nextState = sceneStates[scenes[nextSceneIndex]];
                const nextDayColors = nextState.dayColors;
                const nextNightColors = nextState.nightColors;
                
                // Calculate target colors for next scene
                const nextSkyColor = nextDayColors.sky.clone().lerp(nextNightColors.sky, 1 - dayFactor);
                const nextGroundColor = nextDayColors.ground.clone().lerp(nextNightColors.ground, 1 - dayFactor);
                const nextAmbientIntensity = nextDayColors.ambient * dayFactor + nextNightColors.ambient * (1 - dayFactor);
                
                // Interpolate between current and next scene
                const t = easeInOutCubic(sceneTransitionProgress);
                targetSkyColor.lerp(nextSkyColor, t);
                targetGroundColor.lerp(nextGroundColor, t);
                targetAmbientIntensity = targetAmbientIntensity * (1 - t) + nextAmbientIntensity * t;
                
                updateSceneTransition();
            } catch (error) {
                console.error('Error in scene transition:', error);
                isSceneTransitioning = false;
            }
        }
        
        // Update scene colors
        scene.background = targetSkyColor;
        scene.fog.color.copy(targetSkyColor);
        
        if (groundPlane) {
            groundPlane.material.color.copy(targetGroundColor);
        }
        
        // Update lights
        if (ambientLight) {
            ambientLight.intensity = targetAmbientIntensity;
        }
        if (directionalLight) {
            directionalLight.intensity = Math.max(0.2, dayFactor);
        }
        
        // Update status display
        updateStatusDisplay(dayFactor);

        // Animate components
        const animations = [
            { name: 'road', func: animateRoad },
            { name: 'desert objects', func: animateDesertObjects },
            { name: 'buildings', func: animateBuildings },
            { name: 'mountains', func: animateMountains },
            { name: 'specks', func: animateSpecks },
            { name: 'clouds', func: animateClouds },
            { name: 'stars', func: animateStars },
            { name: 'street lamps', func: animateStreetLamps }
        ];

        for (const animation of animations) {
            try {
                animation.func();
            } catch (error) {
                console.error(`Error in ${animation.name} animation:`, error);
            }
        }

        // Update camera and render
        try {
            updateCamera();
            renderer.render(scene, camera);
        } catch (error) {
            console.error('Error in render cycle:', error);
            throw error;
        }

    } catch (error) {
        console.error('Critical animation error:', error);
        cancelAnimationFrame(animate);
        throw error;
    }
}

function startSceneTransition() {
    isSceneTransitioning = true;
    sceneTransitionProgress = 0;
    nextSceneIndex = (currentSceneIndex + 1) % scenes.length;
    console.log(`Starting transition from ${scenes[currentSceneIndex]} to ${scenes[nextSceneIndex]}`);
}

function updateSceneTransition() {
    sceneTransitionProgress += (1000 / 120) / sceneTransitionDuration;
    
    if (sceneTransitionProgress >= 1) {
        isSceneTransitioning = false;
        currentSceneIndex = nextSceneIndex;
        lastSceneChangeTime = Date.now();
        sceneTransitionProgress = 0;
        
        createDesertObjects();
        return;
    }
    
    const eased = easeInOutCubic(sceneTransitionProgress);
    
    const currentState = sceneStates[scenes[currentSceneIndex]];
    const nextState = sceneStates[scenes[nextSceneIndex]];
    
    // Interpolate between current and next state colors
    if (groundPlane && groundPlane.material) {
        groundPlane.material.color.copy(currentState.dayColors.ground)
            .lerp(nextState.dayColors.ground, eased);
        groundPlane.material.opacity = 1.0;
    }
    
    // Update fog and sky colors
    const currentSkyColor = currentState.dayColors.sky.clone();
    const nextSkyColor = nextState.dayColors.sky.clone();
    scene.fog.color.copy(currentSkyColor).lerp(nextSkyColor, eased);
    scene.background.copy(currentSkyColor).lerp(nextSkyColor, eased);
}

// Add easing function for smoother transitions
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function animateRoad() {
    // Move the main road
    roadSegments[0].position.z += speed;
    
    // Reset road when it's far behind the camera
    // We want to reset when the end of the road is approaching the camera's view
    const roadEndPosition = roadSegments[0].position.z + roadLength * segmentCount * 4;
    if (roadEndPosition < camera.position.z + 200) { // Keep 200 units of road ahead at all times
        roadSegments[0].position.z = camera.position.z - roadLength * segmentCount;
    }
    
    // Move and reset the lines with the same logic
    [leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine].forEach(line => {
        if (line) {
            line.position.z += speed;
            const lineEndPosition = line.position.z + roadLength * segmentCount * 4;
            if (lineEndPosition < camera.position.z + 200) {
                line.position.z = camera.position.z - roadLength * segmentCount;
            }
        }
    });
}

function animateDesertObjects() {
    desertObjects.forEach(object => {
        object.position.z += speed;
        
        // If object is behind us, reset far ahead with new scene's object
        if (object.position.z > camera.position.z + 10) {
            const currentScene = scenes[currentSceneIndex];
            const newObject = sceneObjects[currentScene].createObject();
            
            // Keep x value but randomize z far ahead
            newObject.position.z = camera.position.z - 400 + Math.random() * 50;
            
            // Slightly randomize x value for variety
            const sign = object.position.x < 0 ? -1 : 1;
            const distance = roadWidth / 2 + 5 + Math.random() * 100;
            newObject.position.x = sign * distance;
            
            // Remove old object and add new one
            scene.remove(object);
            scene.add(newObject);
            
            // Update reference in array
            const index = desertObjects.indexOf(object);
            if (index !== -1) {
                desertObjects[index] = newObject;
            }
        }
    });
}

function animateBuildings() {
    buildings.forEach((building, index) => {
        building.position.z += speed;
        
        // If building is behind camera, move it far ahead
        if (building.position.z > camera.position.z + 10) {
            // Keep on same side of road but randomize z
            const keepOnSameSide = building.position.x < 0 ? -1 : 1;
            building.position.z = camera.position.z - 400 + Math.random() * 50;
            building.position.x = keepOnSameSide * (roadWidth / 2 + 5 + Math.random() * 10);
            
            // Replace old building with new one to have variety
            scene.remove(building);
            buildings[index] = createRandomBuilding();
            buildings[index].position.set(building.position.x, 0, building.position.z);
            scene.add(buildings[index]);
        }
    });
}

function animateMountains() {
    mountains.forEach((mountain, index) => {
        mountain.position.z += speed;
        
        // If mountain is behind camera, move it far ahead
        if (mountain.position.z > camera.position.z + 100) {
            // Keep on same side of road within mountain zone
            const side = mountain.position.x < 0 ? -1 : 1;
            const mountainZoneStart = roadWidth/2 + 100;
            const mountainZoneWidth = 200;
            const distanceFromRoad = mountainZoneStart + Math.random() * mountainZoneWidth;
            
            mountain.position.x = side * distanceFromRoad;
            mountain.position.z = camera.position.z - 500 - Math.random() * 100;
            
            // Minimal rotation when resetting
            mountain.rotation.y = (Math.random() - 0.5) * 0.05;
        }
    });
}

function animateSpecks() {
    const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
    const currentState = sceneStates[scenes[currentSceneIndex]];
    
    specks.forEach(speck => {
        speck.position.z += speed;

        if (speck.position.z > camera.position.z) {
            speck.position.z -= 400;
            speck.position.x = (Math.random() < 0.5 ? -1 : 1) * (roadWidth / 2 + Math.random() * 200);
        }

        if (isSceneTransitioning) {
            const nextState = sceneStates[scenes[nextSceneIndex]];
            const currentColor = speck.userData.colors[Math.floor(speck.userData.colorPhase) % speck.userData.colors.length];
            const nextColor = nextState.dayColors.ground.clone().multiplyScalar(0.8 + Math.random() * 0.4);
            speck.material.color.copy(currentColor).lerp(nextColor, sceneTransitionProgress);
        } else {
            speck.userData.colorPhase += speck.userData.colorShiftSpeed;
            const colorIndex = Math.floor(speck.userData.colorPhase) % speck.userData.colors.length;
            const nextColorIndex = (colorIndex + 1) % speck.userData.colors.length;
            const lerpFactor = speck.userData.colorPhase % 1;
            
            speck.material.color.copy(speck.userData.colors[colorIndex])
                .lerp(speck.userData.colors[nextColorIndex], lerpFactor);
        }
        
        // Adjust opacity based on day/night cycle
        speck.material.opacity = 0.8 * (dayFactor * 0.7 + 0.3);
    });
}

function createClouds() {
    // Clear existing clouds
    clouds.forEach(cloud => scene.remove(cloud));
    clouds = [];

    // Create several clouds at different positions
    const cloudCount = 10;
    for (let i = 0; i < cloudCount; i++) {
        const cloud = new THREE.Group();
        
        // Create multiple boxes for each cloud
        const particleCount = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < particleCount; j++) {
            const width = Math.random() * 20 + 15;
            const height = Math.random() * 5 + 3;
            const depth = Math.random() * 10 + 8;
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.6
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // Position each box slightly offset from center
            particle.position.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 15
            );
            
            // Slight random rotation for variety
            particle.rotation.z = (Math.random() - 0.5) * 0.2;
            
            cloud.add(particle);
        }
        
        // Position cloud in sky
        cloud.position.set(
            (Math.random() - 0.5) * 400,  // Spread clouds wider
            100 + Math.random() * 50,     // Height variation
            -i * 200 - Math.random() * 200 // Spread along z-axis
        );
        
        // Store movement properties
        cloud.userData = {
            speed: 0.1 + Math.random() * 0.2,
            originalX: cloud.position.x
        };
        
        scene.add(cloud);
        clouds.push(cloud);
    }
}

function animateClouds() {
    clouds.forEach(cloud => {
        // Move cloud forward with scene
        cloud.position.z += speed * 0.5; // Clouds move slower than ground
        
        // Gentle sideways drift
        cloud.position.x = cloud.userData.originalX + Math.sin(Date.now() * 0.0001) * 10;
        
        // If cloud is behind camera, move it far ahead
        if (cloud.position.z > camera.position.z + 50) {
            cloud.position.z = camera.position.z - 600 - Math.random() * 200;
            cloud.userData.originalX = (Math.random() - 0.5) * 400;
            cloud.position.x = cloud.userData.originalX;
        }
        
        // Adjust opacity based on day/night cycle
        cloud.children.forEach(particle => {
            const dayFactor = (Math.sin(dayNightCycle) + 1) / 2;
            particle.material.opacity = 0.3 + dayFactor * 0.3;
        });
    });
}

// Performance monitoring
function initStats() {
    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    return stats;
}

function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        
        // Toggle day/night with 'n' key
        if (e.key === 'n' || e.key === 'N') {
            if (!isTransitioning) {
                isTransitioning = true;
                transitionProgress = 0;
                transitionDirection = isNight ? -1 : 1; // 1 for day->night, -1 for night->day
                console.log("Starting transition from " + (isNight ? "night to day" : "day to night"));
            }
        }
        
        // Force scene change with 'm' key
        if (e.key === 'm' || e.key === 'M') {
            if (!isSceneTransitioning) {
                startSceneTransition();
            }
        }
        
        // Reset camera with ESC key
        if (e.key === 'Escape') {
            camera.position.set(5, 5, 20);
            cameraTarget = new THREE.Vector3(0, 0, -20);
            camera.lookAt(cameraTarget);
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function updateCamera() {
    // Forward/Backward movement
    if (keysPressed['w'] || keysPressed['W'] || keysPressed['ArrowUp']) {
        camera.position.z -= moveSpeed;
        cameraTarget.z -= moveSpeed;
    }
    if (keysPressed['s'] || keysPressed['S'] || keysPressed['ArrowDown']) {
        camera.position.z += moveSpeed;
        cameraTarget.z += moveSpeed;
    }
    
    // Left/Right movement
    if (keysPressed['a'] || keysPressed['A'] || keysPressed['ArrowLeft']) {
        camera.position.x -= moveSpeed;
        cameraTarget.x -= moveSpeed;
    }
    if (keysPressed['d'] || keysPressed['D'] || keysPressed['ArrowRight']) {
        camera.position.x += moveSpeed;
        cameraTarget.x += moveSpeed;
    }
    
    // Up/Down movement
    if (keysPressed['q'] || keysPressed['Q']) {
        camera.position.y += moveSpeed;
        cameraTarget.y += moveSpeed;
    }
    if (keysPressed['e'] || keysPressed['E']) {
        camera.position.y = Math.max(1, camera.position.y - moveSpeed);
        cameraTarget.y = Math.max(0, cameraTarget.y - moveSpeed);
    }
    
    // Update camera look target
    camera.lookAt(cameraTarget);
}

function createStatusDisplay() {
    statusDisplay = document.createElement('div');
    statusDisplay.style.position = 'fixed';
    statusDisplay.style.top = '10px';
    statusDisplay.style.right = '10px';
    statusDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    statusDisplay.style.color = 'white';
    statusDisplay.style.padding = '10px';
    statusDisplay.style.borderRadius = '5px';
    statusDisplay.style.fontFamily = 'Arial, sans-serif';
    statusDisplay.style.zIndex = '1000';
    document.body.appendChild(statusDisplay);
}

function updateStatusDisplay(dayFactor) {
    if (!statusDisplay) return;
    
    const timeOfDay = dayFactor > 0.5 ? 'Day' : 'Night';
    const currentScene = scenes[currentSceneIndex].charAt(0).toUpperCase() + scenes[currentSceneIndex].slice(1);
    const transitionText = isSceneTransitioning ? 
        ` (Transitioning to ${scenes[nextSceneIndex].charAt(0).toUpperCase() + scenes[nextSceneIndex].slice(1)})` : '';
    
    statusDisplay.innerHTML = `
        <div>Time: ${timeOfDay}</div>
        <div>Scene: ${currentScene}${transitionText}</div>
        <div>Light: ${Math.round(dayFactor * 100)}%</div>
    `;
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', init);

// Export functions for external access if needed
if (typeof module !== 'undefined') {
    module.exports = {
        init,
        animate
    };
} 