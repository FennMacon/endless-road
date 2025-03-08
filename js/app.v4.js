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
const scenes = ['desert', 'forest', 'snowy', 'city'];
let currentSceneIndex = 0;
let nextSceneIndex = 0;
let isSceneTransitioning = false;
let sceneTransitionProgress = 0;
const sceneTransitionDuration = 10000; // 10 seconds for transition
let lastSceneChangeTime = 0;
const sceneChangeDuration = 30000; // 30 seconds between scene changes

// Scene-specific color palettes
const palettes = {
    desert: [
        new THREE.Color(0xC2B280),
        new THREE.Color(0xD2B48C),
        new THREE.Color(0xF4A460),
        new THREE.Color(0xDEB887),
        new THREE.Color(0x8B4513)
    ],
    forest: [
        new THREE.Color(0x228B22),
        new THREE.Color(0x2E8B57),
        new THREE.Color(0x6B8E23),
        new THREE.Color(0x8FBC8F),
        new THREE.Color(0x006400)
    ],
    snowy: [
        new THREE.Color(0xFFFFFF),
        new THREE.Color(0xF0F8FF),
        new THREE.Color(0xE0FFFF),
        new THREE.Color(0xF5F5F5),
        new THREE.Color(0xD3D3D3)
    ],
    city: [
        new THREE.Color(0x808080),
        new THREE.Color(0x696969),
        new THREE.Color(0xA9A9A9),
        new THREE.Color(0xDCDCDC),
        new THREE.Color(0xC0C0C0)
    ]
};

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
    city: {
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
                
                // Calculate trunk and foliage proportions
                const trunkHeight = height * 0.4;  // Trunk takes 40% of total height
                const foliageHeight = height * 0.7; // Foliage takes 70% of total height
                
                // Create trunk (brown cylinder)
                const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, trunkHeight, 8);
                const trunkMat = new THREE.MeshBasicMaterial({ color: 0x4A3728 });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                
                // Position trunk with bottom at y=0 (ground level)
                trunk.position.y = trunkHeight / 2;
                
                // Create foliage (green cone)
                const leavesGeo = new THREE.ConeGeometry(2 * scale, foliageHeight, 8);
                const leavesMat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
                const leaves = new THREE.Mesh(leavesGeo, leavesMat);
                
                // Position leaves above the trunk, starting slightly above the ground
                // Bottom of cone positioned at trunkHeight * 0.6 to create overlap
                leaves.position.y = trunkHeight * 0.6 + foliageHeight / 2;
                
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
    city: {
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
let cameraTarget = new THREE.Vector3(0, 0, -40); // Adjusted to keep the same viewing angle

// Add at the top with other variables
let statusDisplay;

// Add at the top with other variables
const DEBUG = {
    enabled: true,
    menu: null,
    logs: [],
    maxLogs: 100,
    variables: {
        speed: { value: 0.5, min: 0, max: 2, step: 0.1, label: 'Movement Speed' },
        moveSpeed: { value: 0.5, min: 0.1, max: 2, step: 0.1, label: 'Camera Move Speed' },
        dayNightSpeed: { value: 0.0005, min: 0, max: 0.01, step: 0.0001, label: 'Day/Night Cycle Speed' },
        sceneTransitionDuration: { value: 10000, min: 1000, max: 20000, step: 1000, label: 'Scene Transition Duration (ms)' },
        roadWidth: { value: 10, min: 5, max: 20, step: 1, label: 'Road Width' },
        speckCount: { value: 5000, min: 0, max: 10000, step: 100, label: 'Ground Speck Count' },
        speckSize: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, label: 'Ground Speck Size' },
        starCount: { value: 8000, min: 0, max: 20000, step: 100, label: 'Star Count' },
        starSize: { value: 2.0, min: 0.1, max: 5.0, step: 0.1, label: 'Star Size' },
        starSpread: { value: 0.8, min: 0.1, max: 1.0, step: 0.1, label: 'Star Spread (Height)' },
        starDistance: { value: 600, min: 400, max: 1200, step: 50, label: 'Star Distance' },
        starTwinkleSpeed: { value: 0.05, min: 0, max: 0.1, step: 0.001, label: 'Star Twinkle Speed' },
        buildingDensity: { value: 10, min: 0, max: 30, step: 1, label: 'Building Density' },
        objectDensity: { value: 15, min: 0, max: 30, step: 1, label: 'Scene Object Density' }
    },
    toggles: {
        showFPS: { value: true, label: 'Show FPS Counter' },
        showRoad: { value: true, label: 'Show Road' },
        showBuildings: { value: true, label: 'Show Buildings' },
        showMountains: { value: true, label: 'Show Mountains' },
        showStreetLamps: { value: true, label: 'Show Street Lamps' },
        showSceneObjects: { value: true, label: 'Show Scene Objects' },
        showStars: { value: true, label: 'Show Stars' },
        showSpecks: { value: true, label: 'Show Ground Specks' },
        autoRotateScenes: { value: true, label: 'Auto Rotate Scenes' }
    },
    sceneObjectsState: {
        desert: true,
        forest: true,
        snowy: true,
        city: true
    },
    presets: {
        default: null,
        saved: {}
    },
    savePreset: function(name) {
        const preset = {
            variables: {},
            toggles: {},
            sceneObjectsState: { ...this.sceneObjectsState }
        };
        
        // Save all variable values
        Object.entries(this.variables).forEach(([key, config]) => {
            preset.variables[key] = config.value;
        });
        
        // Save all toggle states
        Object.entries(this.toggles).forEach(([key, config]) => {
            preset.toggles[key] = config.value;
        });
        
        this.presets.saved[name] = preset;
        this.savePresetsToLocalStorage();
        log(`Saved preset: ${name}`, 'info');
    },
    
    loadPreset: function(name) {
        const preset = name === 'default' ? this.presets.default : this.presets.saved[name];
        if (!preset) {
            log(`Preset not found: ${name}`, 'error');
            return;
        }
        
        // Load variable values
        Object.entries(preset.variables).forEach(([key, value]) => {
            if (this.variables[key]) {
                this.variables[key].value = value;
            }
        });
        
        // Load toggle states
        Object.entries(preset.toggles).forEach(([key, value]) => {
            if (this.toggles[key]) {
                this.toggles[key].value = value;
            }
        });
        
        // Load scene object states
        if (preset.sceneObjectsState) {
            this.sceneObjectsState = { ...preset.sceneObjectsState };
        }
        
        log(`Loaded preset: ${name}`, 'info');
        
        // Update any necessary components
        updateStars();
        createBuildings();
    },
    
    savePresetsToLocalStorage: function() {
        try {
            localStorage.setItem('endlessRoadPresets', JSON.stringify(this.presets.saved));
            log('Presets saved to local storage', 'info');
        } catch (error) {
            log('Failed to save presets to local storage', 'error');
        }
    },
    
    loadPresetsFromLocalStorage: function() {
        try {
            const saved = localStorage.getItem('endlessRoadPresets');
            if (saved) {
                this.presets.saved = JSON.parse(saved);
                log('Loaded presets from local storage', 'info');
            }
        } catch (error) {
            log('Failed to load presets from local storage', 'error');
        }
    }
};

// Add logging utility functions
function log(message, type = 'info') {
    if (!DEBUG.enabled) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { message, type, timestamp };
    
    DEBUG.logs.unshift(logEntry);
    if (DEBUG.logs.length > DEBUG.maxLogs) {
        DEBUG.logs.pop();
    }
    
    // Also log to console with appropriate styling
    const styles = {
        info: 'color: #4CAF50',
        warn: 'color: #FFC107',
        error: 'color: #F44336'
    };
    console.log(`%c[${timestamp}] ${message}`, styles[type]);
    
    updateDebugLogs();
}

function createDebugMenu() {
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: none;
        justify-content: center;
        align-items: center;
        padding: 20px;
        font-family: Arial, sans-serif;
        color: white;
        z-index: 1000;
        overflow: auto;
    `;

    const flexContainer = document.createElement('div');
    flexContainer.style.cssText = `
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(5px);
        border-radius: 10px;
        padding: 20px;
        max-width: 1200px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
    `;

    // Create content grid
    const content = document.createElement('div');
    content.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    `;

    // Create sections object to organize controls
    const sections = {
        status: {
            title: 'Status',
            content: createStatusSection(),
            fullWidth: true
        },
        scene: {
            title: 'Scene Controls',
            content: createSceneSection()
        },
        visibility: {
            title: 'Object Visibility',
            content: createVisibilitySection()
        },
        environment: {
            title: 'Environment',
            content: createEnvironmentSection()
        },
        camera: {
            title: 'Camera Controls',
            content: createCameraSection()
        },
        objects: {
            title: 'Object Controls',
            content: createObjectsSection()
        },
        debug: {
            title: 'Debug Options',
            content: createDebugSection()
        }
    };

    // Add sections to grid
    Object.entries(sections).forEach(([key, section]) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            ${section.fullWidth ? 'grid-column: 1 / -1;' : ''}
        `;

        // Add collapsible header
        const sectionHeader = document.createElement('div');
        sectionHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            cursor: pointer;
            user-select: none;
        `;
        sectionHeader.innerHTML = `<h4 style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${section.title}</h4>`;
        
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '−';
        toggleButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 0 5px;
            opacity: 0.7;
            transition: opacity 0.2s;
        `;
        toggleButton.onmouseover = () => toggleButton.style.opacity = '1';
        toggleButton.onmouseout = () => toggleButton.style.opacity = '0.7';
        
        sectionHeader.appendChild(toggleButton);
        
        const sectionContent = section.content;
        sectionContent.style.display = 'block';
        
        const toggleSection = () => {
            const isCollapsed = sectionContent.style.display === 'none';
            sectionContent.style.display = isCollapsed ? 'block' : 'none';
            toggleButton.textContent = isCollapsed ? '−' : '+';
        };
        
        // Make entire header clickable
        sectionHeader.addEventListener('click', toggleSection);
        
        sectionDiv.appendChild(sectionHeader);
        sectionDiv.appendChild(sectionContent);
        content.appendChild(sectionDiv);
    });

    flexContainer.appendChild(content);
    debugContainer.appendChild(flexContainer);
    document.body.appendChild(debugContainer);
}

// Helper functions to create each section
function createStatusSection() {
    const section = document.createElement('div');
    section.id = 'status-display';
    return section;
}

function createSceneSection() {
    const section = document.createElement('div');
    
    // Scene buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 15px;
    `;
    
    scenes.forEach(scene => {
        const button = document.createElement('button');
        button.textContent = scene.charAt(0).toUpperCase() + scene.slice(1);
        button.style.cssText = `
            padding: 5px 10px;
            background: ${scene === scenes[currentSceneIndex] ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 3px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        
        button.onmouseover = () => {
            if (scene !== scenes[currentSceneIndex]) {
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            }
        };
        
        button.onmouseout = () => {
            button.style.background = scene === scenes[currentSceneIndex] ? 
                'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        };
        
        button.addEventListener('click', () => {
            const newIndex = scenes.indexOf(scene);
            if (newIndex !== currentSceneIndex && !isSceneTransitioning) {
                nextSceneIndex = newIndex;
                startSceneTransition();
                log(`Manually transitioning to ${scene} scene`, 'info');
                
                // Update button styles
                buttonContainer.querySelectorAll('button').forEach(btn => {
                    btn.style.background = 'rgba(255, 255, 255, 0.1)';
                });
                button.style.background = 'rgba(255, 255, 255, 0.3)';
            }
        });
        
        buttonContainer.appendChild(button);
    });
    
    section.appendChild(buttonContainer);
    
    // Add scene-related variables
    const sceneVars = ['sceneTransitionDuration', 'dayNightSpeed'];
    addVariableSliders(section, sceneVars);
    
    // Add scene-related toggles
    const sceneToggles = ['autoRotateScenes'];
    addToggles(section, sceneToggles);
    
    return section;
}

function createEnvironmentSection() {
    const section = document.createElement('div');
    
    // Speck controls
    const speckControls = ['speckCount', 'speckSize'];
    addVariableSliders(section, speckControls);
    
    // Add speck toggle
    addToggles(section, ['showSpecks']);
    
    // Add update specks button
    const updateSpecksButton = createButton('Update Specks', () => {
        createSpecks();
        log('Ground specks updated with new settings', 'info');
    });
    section.appendChild(updateSpecksButton);
    
    // Star controls
    const starControls = ['starCount', 'starSize', 'starSpread', 'starDistance', 'starTwinkleSpeed'];
    addVariableSliders(section, starControls);
    
    // Add update stars button
    const updateStarsButton = createButton('Update Stars', updateStars);
    section.appendChild(updateStarsButton);
    
    // Add star toggle
    addToggles(section, ['showStars']);
    
    return section;
}

function createCameraSection() {
    const section = document.createElement('div');
    
    // Camera-related variables
    const cameraVars = ['moveSpeed', 'speed'];
    addVariableSliders(section, cameraVars);
    
    return section;
}

function createObjectsSection() {
    const section = document.createElement('div');
    
    // Add object visibility toggles
    const objectToggles = ['showRoad', 'showStreetLamps', 'showBuildings', 'showMountains', 'showSceneObjects'];
    addToggles(section, objectToggles);
    
    // Add a divider
    const divider = document.createElement('div');
    divider.style.cssText = `
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
        margin: 15px 0;
    `;
    section.appendChild(divider);
    
    // Building controls
    const buildingVars = ['buildingDensity'];
    addVariableSliders(section, buildingVars);
    
    // Add refresh buildings button
    const refreshButton = createButton('Refresh Buildings', () => {
        createBuildings();
        log('Buildings refreshed with new density settings', 'info');
    });
    section.appendChild(refreshButton);

    // Add another divider
    const divider2 = document.createElement('div');
    divider2.style.cssText = `
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
        margin: 15px 0;
    `;
    section.appendChild(divider2);

    // Scene object controls
    const objectVars = ['objectDensity'];
    addVariableSliders(section, objectVars);

    // Add refresh objects button
    const refreshObjectsButton = createButton('Refresh Scene Objects', () => {
        createDesertObjects();
        log('Scene objects refreshed with new density settings', 'info');
    });
    section.appendChild(refreshObjectsButton);
    
    return section;
}

function createDebugSection() {
    const section = document.createElement('div');
    
    // Debug toggles
    const debugToggles = ['showFPS', 'showLogs'];
    addToggles(section, debugToggles);
    
    // Add debug logs
    const logsDiv = document.createElement('div');
    logsDiv.id = 'debug-logs';
    logsDiv.style.cssText = `
        margin-top: 15px;
        font-family: monospace;
        font-size: 12px;
        max-height: 200px;
        overflow-y: auto;
    `;
    section.appendChild(logsDiv);
    
    return section;
}

// Helper function to create variable sliders
function addVariableSliders(container, variables) {
    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
        display: grid;
        gap: 10px;
    `;

    Object.entries(DEBUG.variables).forEach(([key, config]) => {
        if (!variables.includes(key)) return;

        const row = document.createElement('div');
        row.style.cssText = `
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
            align-items: center;
        `;

        const label = document.createElement('label');
        label.textContent = config.label || key;
        label.style.cssText = `
            font-size: 12px;
            opacity: 0.9;
        `;

        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = config.min;
        slider.max = config.max;
        slider.step = config.step;
        slider.value = config.value;
        slider.style.cssText = `
            width: 100px;
            margin: 0;
        `;

        const value = document.createElement('span');
        value.textContent = config.value;
        value.style.cssText = `
            font-size: 12px;
            min-width: 40px;
            text-align: right;
        `;

        slider.addEventListener('input', () => {
            config.value = parseFloat(slider.value);
            value.textContent = slider.value;
        });

        controlsDiv.appendChild(slider);
        controlsDiv.appendChild(value);
        row.appendChild(label);
        row.appendChild(controlsDiv);
        sliderContainer.appendChild(row);
    });

    container.appendChild(sliderContainer);
}

// Helper function to create toggles
function addToggles(container, toggles) {
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
        display: grid;
        gap: 8px;
    `;

    Object.entries(DEBUG.toggles).forEach(([key, config]) => {
        if (!toggles.includes(key)) return;

        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 5px;
            border-radius: 3px;
            transition: background-color 0.2s;
            user-select: none;
        `;

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = config.value;
        toggle.id = `toggle-${key}`;
        toggle.style.cssText = `
            margin: 0;
            cursor: pointer;
        `;

        const label = document.createElement('label');
        label.textContent = config.label || key;
        label.htmlFor = `toggle-${key}`;
        label.style.cssText = `
            font-size: 12px;
            cursor: pointer;
            user-select: none;
            opacity: 0.9;
            flex-grow: 1;
        `;

        const updateToggle = () => {
            config.value = toggle.checked;
            row.style.backgroundColor = toggle.checked ? 'rgba(255, 255, 255, 0.2)' : 'transparent';
            
            // Special handling for road toggle
            if (key === 'showRoad' && !toggle.checked) {
                // Immediately remove road when toggled off
                roadSegments.forEach(segment => {
                    if (segment) {
                        scene.remove(segment);
                    }
                });
                roadSegments = [];
                [leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine].forEach(line => {
                    if (line) {
                        scene.remove(line);
                    }
                });
                leftEdgeLine = null;
                rightEdgeLine = null;
                leftYellowLine = null;
                rightYellowLine = null;
            }
            
            log(`${config.label} ${toggle.checked ? 'enabled' : 'disabled'}`, 'info');
        };

        // Make the entire row clickable
        row.onclick = (e) => {
            if (e.target !== toggle) {
                toggle.checked = !toggle.checked;
                updateToggle();
            }
        };

        // Handle direct checkbox clicks
        toggle.onclick = (e) => {
            e.stopPropagation();
            updateToggle();
        };

        row.appendChild(toggle);
        row.appendChild(label);
        toggleContainer.appendChild(row);

        // Set initial background
        row.style.backgroundColor = toggle.checked ? 'rgba(255, 255, 255, 0.2)' : 'transparent';

        // Add hover effect
        row.onmouseover = () => {
            if (!toggle.checked) {
                row.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
        };
        row.onmouseout = () => {
            if (!toggle.checked) {
                row.style.backgroundColor = 'transparent';
            }
        };
    });

    container.appendChild(toggleContainer);
}

// Helper function to create buttons
function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
        width: 100%;
        padding: 8px;
        background: rgba(76, 175, 80, 0.8);
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        margin-bottom: 15px;
        transition: background 0.3s;
        font-size: 12px;
    `;
    
    button.addEventListener('mouseover', () => {
        button.style.background = 'rgba(76, 175, 80, 1)';
    });
    button.addEventListener('mouseout', () => {
        button.style.background = 'rgba(76, 175, 80, 0.8)';
    });
    button.addEventListener('click', onClick);
    
    return button;
}

function updateDebugLogs() {
    if (!DEBUG.enabled || !DEBUG.menu) return;
    
    const logsSection = document.getElementById('debug-logs');
    if (!logsSection) return;
    
    logsSection.innerHTML = '<h4>Debug Logs</h4>';
    DEBUG.logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.style.color = {
            info: '#4CAF50',
            warn: '#FFC107',
            error: '#F44336'
        }[log.type];
        logEntry.textContent = `[${log.timestamp}] ${log.message}`;
        logsSection.appendChild(logEntry);
    });
}

// Initialize the scene
function init() {
    try {
        console.log('Starting initialization...');
        
        // Initialize scene
        scene = new THREE.Scene();
        const currentState = sceneStates[scenes[currentSceneIndex]];
        scene.background = currentState.dayColors.sky;
        scene.fog = new THREE.FogExp2(currentState.dayColors.sky, 0.002);
        
        // Initialize camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(5, 5, 0); // Changed from (5, 5, 20) to position camera at start of road
        cameraTarget = new THREE.Vector3(0, 0, -40); // Adjusted to keep the same viewing angle
        camera.lookAt(cameraTarget);
        console.log('Camera initialized successfully');
        
        // Initialize renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);
        console.log('Renderer initialized successfully');
        
        // Create debug menu and status display
        createDebugMenu();
        createStatusDisplay();
        DEBUG.menu = document.getElementById('debug-container');
        
        // Try to initialize Stats if enabled
        if (DEBUG.toggles.showFPS.value) {
            try {
                initStats();
            } catch (error) {
                console.warn('Failed to initialize FPS counter:', error);
                DEBUG.toggles.showFPS.value = false;
            }
        }
        
        // Save initial state as default preset
        DEBUG.presets.default = {
            variables: {},
            toggles: {},
            sceneObjectsState: { ...DEBUG.sceneObjectsState }
        };
        
        Object.entries(DEBUG.variables).forEach(([key, config]) => {
            DEBUG.presets.default.variables[key] = config.value;
        });
        
        Object.entries(DEBUG.toggles).forEach(([key, config]) => {
            DEBUG.presets.default.toggles[key] = config.value;
        });
        
        // Load any saved presets from local storage
        DEBUG.loadPresetsFromLocalStorage();
        
        // Initialize all scene objects
        createLighting();
        createSun();
        createDesertGround();
        createSpecks();
        createRoad();
        createStreetLamps();
        createBuildings();
        createDesertObjects();
        createMountains();
        createStars();
        createClouds();
        
        // Initialize at night
        dayNightCycle = Math.PI;
        isNight = true;
        
        // Set up event listeners
        setupEventListeners();
        
        // Start animation loop
        animate();
        console.log('Animation loop started');
        console.log('Initialization complete');
        console.log('Scene contains', scene.children.length, 'objects');
        console.log('Road segments:', roadSegments.length);
        console.log('Camera position:', camera.position);
        console.log('Current scene:', scenes[currentSceneIndex]);
        
    } catch (error) {
        console.error('Critical initialization error:', error);
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
    const currentPalette = palettes[scenes[currentSceneIndex]];
    const speckCount = DEBUG.variables.speckCount.value;
    
    // Clear existing specks first
    specks.forEach(speck => {
        if (speck) {
            scene.remove(speck);
            speck.geometry.dispose();
            speck.material.dispose();
        }
    });
    specks = [];
    
    // Create a single geometry for all specks
    const speckGeometry = new THREE.SphereGeometry(0.1, 4, 4); // Reduced segments for better performance
    
    for (let i = 0; i < speckCount; i++) {
        const speckColor = currentPalette[Math.floor(Math.random() * currentPalette.length)];
        const speckMaterial = new THREE.MeshBasicMaterial({ 
            color: speckColor,
            transparent: true,
            opacity: 0.8,
            depthWrite: false // Prevents shadow artifacts
        });
        const speck = new THREE.Mesh(speckGeometry, speckMaterial);
        
        // Position specks
        speck.position.z = camera.position.z - 400 + Math.random() * 400;
        const side = Math.random() < 0.5 ? -1 : 1;
        const distance = roadWidth / 2 + 5 + Math.random() * 200;
        speck.position.x = side * distance;
        speck.position.y = 0;
        
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
    
    // Position the road starting exactly at z=0 extending forward and backward
    // This places the start of the road directly under the camera (which is now at z=0)
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
    streetLamps.forEach(lamp => {
        if (lamp && lamp.visible) {
            lamp.visible = false;
            if (lamp.userData.glow) lamp.userData.glow.visible = false;
            if (lamp.userData.outerGlow) lamp.userData.outerGlow.visible = false;
            if (lamp.userData.light) lamp.userData.light.visible = false;
        }
    });
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
    // Clear any existing buildings
    buildings.forEach(building => scene.remove(building));
    buildings = [];
    
    // Use building density from debug settings
    const buildingCount = DEBUG.variables.buildingDensity.value;
    
    for (let i = 0; i < buildingCount; i++) {
        const building = createRandomBuilding();
        building.position.set(
            (Math.random() < 0.5 ? -1 : 1) * (roadWidth / 2 + 15 + Math.random() * 20),
            0,
            -i * (roadLength * 4 / buildingCount) - Math.random() * 50
        );
        scene.add(building);
        buildings.push(building);
    }
    
    log(`Created ${buildingCount} buildings`, 'info');
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

function createDesertObjects(preserveExisting = false) {
    if (!preserveExisting) {
        // Remove existing objects
        desertObjects.forEach(object => {
            if (object) scene.remove(object);
        });
        desertObjects = [];
    }

    const objectCount = DEBUG.variables.objectDensity.value;
    
    // Create new objects
    for (let i = 0; i < objectCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const distance = roadWidth / 2 + 5 + Math.random() * 100;
        const z = camera.position.z - 400 + Math.random() * 800;
        
        const object = sceneObjects[scenes[currentSceneIndex]].createObject();
        object.position.set(side * distance, 0, z);
        object.userData = {
            scene: scenes[currentSceneIndex]
        };
        
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
    stars.forEach(star => {
        if (star) {
            scene.remove(star);
            if (star.geometry) star.geometry.dispose();
            if (star.material) star.material.dispose();
        }
    });
    stars = [];

    if (!DEBUG.toggles.showStars.value) return;

    console.log("Creating stars with count:", DEBUG.variables.starCount.value);
    
    // Add the initial set of stars in batches for better performance
    // This helps prevent frame drops when a large number of stars are created
    const targetStarCount = DEBUG.variables.starCount.value * 2; // Double the count for initial visibility
    const batchSize = 5000; // Create stars in batches of 5000
    
    // Add the first batch immediately
    const firstBatchSize = Math.min(batchSize, targetStarCount);
    addStars(firstBatchSize);
    
    // If we need more stars beyond the first batch, create them in subsequent frames
    if (targetStarCount > batchSize) {
        let remainingStars = targetStarCount - batchSize;
        let batchIndex = 1;
        
        const createNextBatch = () => {
            const nextBatchSize = Math.min(batchSize, remainingStars);
            if (nextBatchSize <= 0) return;
            
            addStars(nextBatchSize);
            remainingStars -= nextBatchSize;
            batchIndex++;
            
            if (remainingStars > 0) {
                // Schedule next batch in the next frame
                requestAnimationFrame(createNextBatch);
            }
        };
        
        // Start creating batches in the next frame
        requestAnimationFrame(createNextBatch);
    }
}

function addStars(count) {
    if (!DEBUG.toggles.showStars.value) return;

    const starCount = count || DEBUG.variables.starCount.value;
    const starGeometry = new THREE.BufferGeometry();
    
    // Calculate the correct opacity based on day/night cycle for target opacity
    const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
    let targetOpacity = 0;
    
    if (dayFactor <= 0.3) {
        targetOpacity = 0.7; // Full brightness during deep night
    } else if (dayFactor < 0.7) {
        // Extended transition from 30% to 70% light
        const transitionProgress = (dayFactor - 0.3) / 0.4; 
        targetOpacity = 0.7 * (1 - (transitionProgress * transitionProgress));
    } else {
        targetOpacity = 0;
    }
    
    // Start with a small initial opacity so stars are at least slightly visible
    const initialOpacity = Math.min(0.1, targetOpacity);
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: DEBUG.variables.starSize.value,
        transparent: true,
        opacity: initialOpacity, // Start with a small opacity
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        vertexColors: true // Enable vertex colors
    });
    
    // Store the target opacity to fade towards
    starMaterial.userData = {
        isNew: true,
        targetOpacity: targetOpacity,
        creationTime: Date.now()
    };

    // Create arrays for star positions and custom attributes
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const twinkleSpeeds = new Float32Array(starCount);
    const twinklePhases = new Float32Array(starCount);
    const movementSpeeds = new Float32Array(starCount);

    // Get safe values for calculations
    const starDistance = Math.max(200, DEBUG.variables.starDistance.value || 800);
    const starSpread = Math.max(0.1, Math.min(1.0, DEBUG.variables.starSpread.value || 0.8));
    
    // Set minimum and maximum height for stars
    const minStarHeight = 10; // Reduced to 10 as requested
    const maxStarHeight = 250; // Changed maximum height from 500 to 250 as requested
    
    // Initialize star positions in a dome shape that doesn't go below minStarHeight
    for (let i = 0; i < starCount; i++) {
        const radius = starDistance + Math.random() * 200;
        const phi = Math.random() * Math.PI * 2;
        
        // Use original theta calculation but ensure height is evenly distributed
        // This combines our even distribution with the original movement behavior
        const randomValue = Math.random();
        // Adjust theta calculation to ensure even height distribution between min and max
        const normalizedHeight = minStarHeight + randomValue * (maxStarHeight - minStarHeight);
        // Calculate theta that would give us this height
        const theta = Math.acos(Math.min(0.99, Math.max(-0.99, normalizedHeight / radius)));
        
        // Apply original positioning formula but restrict height to our min-max range
        positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
        const heightComponent = radius * Math.cos(theta);
        positions[i * 3 + 1] = Math.min(maxStarHeight, Math.max(minStarHeight, heightComponent));
        positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi);

        // Set initial color (white)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 1.0; // B

        // Get safe value for twinkle speed
        const twinkleSpeed = Math.max(0.1, DEBUG.variables.starTwinkleSpeed.value || 1.0);
        twinkleSpeeds[i] = twinkleSpeed * (0.5 + Math.random());
        twinklePhases[i] = Math.random() * Math.PI * 2;
        movementSpeeds[i] = 0.05 + Math.random() * 0.05;
    }

    // Add attributes to geometry
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
    starGeometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));
    starGeometry.setAttribute('movementSpeed', new THREE.BufferAttribute(movementSpeeds, 1));

    // Create stars and add to scene
    const particleSystem = new THREE.Points(starGeometry, starMaterial);
    particleSystem.name = 'stars';
    scene.add(particleSystem);
    stars.push(particleSystem);
    
    // Log for debugging
    console.log(`Added ${starCount} stars, target opacity: ${targetOpacity}`);
}

function animateStars() {
    try {
        if (!stars.length) return;

        // Calculate time-based values
        const time = Date.now() * 0.001;
        const currentTime = Date.now();
        
        // Use the same dayFactor calculation as in animate function
        const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
        
        // Calculate target opacity based on time of day
        let targetOpacity = 0;
        if (!DEBUG.toggles.showStars.value) {
            targetOpacity = 0;
        } else {
            if (dayFactor <= 0.3) {
                targetOpacity = 0.7; // Full brightness during deep night
            } else if (dayFactor < 0.7) {
                // Extended transition from 30% to 70% light
                const transitionProgress = (dayFactor - 0.3) / 0.4; 
                targetOpacity = 0.7 * (1 - (transitionProgress * transitionProgress));
            } else {
                // Low visibility during bright daylight
                targetOpacity = 0;
            }
        }

        // Day fade rate - extremely slow fade out during day
        const fadeDaySpeed = 0.001;
        // Night fade rate - faster fade in during night
        const fadeNightSpeed = 0.03;
        // Even faster fade-in for newly created stars
        const newStarFadeSpeed = 0.05;
        
        // Process each star particle system in the array
        for (let s = 0; s < stars.length; s++) {
            const particleSystem = stars[s];
            if (!particleSystem) continue;
            
            // Check if this is a newly created star system
            const isNew = particleSystem.material.userData && particleSystem.material.userData.isNew;
            
            // Get the target opacity - either from userData or current calculation
            let thisTargetOpacity = targetOpacity;
            if (isNew && particleSystem.material.userData && 
                typeof particleSystem.material.userData.targetOpacity === 'number') {
                thisTargetOpacity = Math.max(targetOpacity, particleSystem.material.userData.targetOpacity);
            }
            
            // Choose appropriate fade speed
            let fadeSpeed;
            if (isNew && particleSystem.material.opacity < thisTargetOpacity) {
                // New stars fade in faster
                fadeSpeed = newStarFadeSpeed;
                
                // If we've reached the target, mark as no longer new
                if (Math.abs(thisTargetOpacity - particleSystem.material.opacity) < newStarFadeSpeed) {
                    particleSystem.material.userData.isNew = false;
                }
            } else if (thisTargetOpacity > particleSystem.material.opacity) {
                // Normal fade in
                fadeSpeed = fadeNightSpeed;
            } else {
                // Fade out
                fadeSpeed = fadeDaySpeed;
            }
            
            // Adjust opacity towards target
            if (Math.abs(thisTargetOpacity - particleSystem.material.opacity) < fadeSpeed) {
                particleSystem.material.opacity = thisTargetOpacity;
            } else if (thisTargetOpacity > particleSystem.material.opacity) {
                particleSystem.material.opacity += fadeSpeed;
            } else {
                particleSystem.material.opacity -= fadeSpeed;
            }
            
            // Get star attributes
            const positions = particleSystem.geometry.attributes.position.array;
            const colors = particleSystem.geometry.attributes.color.array;
            const twinkleSpeeds = particleSystem.geometry.attributes.twinkleSpeed.array;
            const twinklePhases = particleSystem.geometry.attributes.twinklePhase.array;
            const movementSpeeds = particleSystem.geometry.attributes.movementSpeed.array;
            
            // Variables for calculating average star distance from camera
            let totalDistanceFromCamera = 0;
            let starsInFront = 0;
            
            // Minimum and maximum height for stars - same as used in addStars
            const minStarHeight = 10; // Updated to match the new minimum height
            const maxStarHeight = 250; // Added to match the maximum height in addStars
            
            // Update each star in this particle system
            for (let i = 0; i < positions.length; i += 3) {
                // Update position based on camera movement - reversed direction
                const movementSpeed = movementSpeeds[i / 3];
                
                // Adjust for camera position change (added 20 to Z to emulate original camera position)
                // This compensates for changing camera.position.z from 20 to 0
                const adjustedCameraX = camera.position.x;
                const adjustedCameraZ = camera.position.z + 20; // Add 20 to emulate original camera z-position
                
                positions[i] += adjustedCameraX * movementSpeed * 0.1;
                positions[i + 2] += adjustedCameraZ * movementSpeed * 0.1;
                
                // Ensure stars maintain minimum height
                if (positions[i + 1] < minStarHeight) {
                    positions[i + 1] = minStarHeight;
                }
                
                // Calculate distance from camera for size scaling
                const starX = positions[i];
                const starY = positions[i + 1];
                const starZ = positions[i + 2];
                
                // Only count stars in front of the camera for average distance calculation
                if (starZ < camera.position.z) {
                    // Calculate distance from camera using adjusted camera position
                    const distanceFromCamera = Math.sqrt(
                        Math.pow(starX - adjustedCameraX, 2) +
                        Math.pow(starY - camera.position.y, 2) +
                        Math.pow(starZ - adjustedCameraZ, 2)
                    );
                    totalDistanceFromCamera += distanceFromCamera;
                    starsInFront++;
                }
    
                // Reset position if too far from original and generate new star position
                if (Math.abs(positions[i]) > 2000 || Math.abs(positions[i + 2]) > 2000) {
                    const radius = 800 + Math.random() * 200;
                    const phi = Math.random() * Math.PI * 2;
                    
                    // Use the same approach as in addStars for height distribution
                    const randomValue = Math.random();
                    const normalizedHeight = minStarHeight + randomValue * (maxStarHeight - minStarHeight);
                    const theta = Math.acos(Math.min(0.99, Math.max(-0.99, normalizedHeight / radius)));
    
                    // Position new star behind the camera
                    positions[i] = radius * Math.sin(theta) * Math.cos(phi);
                    const heightComponent = radius * Math.cos(theta);
                    positions[i + 1] = Math.min(maxStarHeight, Math.max(minStarHeight, heightComponent));
                    
                    // Use adjusted camera position (add 20 to Z) to maintain original behavior
                    positions[i + 2] = (camera.position.z + 20) - 1000 - Math.random() * 500;
                }
    
                // Update twinkle effect using luminosity
                const twinkle = Math.sin(time * twinkleSpeeds[i / 3] + twinklePhases[i / 3]);
                const luminosity = 0.5 + 0.5 * twinkle;
                
                // Apply luminosity to RGB values
                colors[i] = luminosity;     // R
                colors[i + 1] = luminosity; // G
                colors[i + 2] = luminosity; // B
            }
            
            // Adjust star size based on average distance from camera
            if (starsInFront > 0) {
                const avgDistance = totalDistanceFromCamera / starsInFront;
                
                // Calculate size based on distance - stars get smaller as they get closer
                // Base size from debug settings
                const baseSize = DEBUG.variables.starSize.value;
                
                // Distance factor: closer stars are smaller, distant stars are larger
                // These values can be adjusted for the desired effect
                const minDistance = 300;  // Distance at which stars are smallest
                const maxDistance = 2000; // Distance at which stars are at max size
                
                let sizeFactor;
                if (avgDistance < minDistance) {
                    // Stars very close to camera are very small
                    sizeFactor = 0.5;
                } else if (avgDistance > maxDistance) {
                    // Distant stars are at full size
                    sizeFactor = 1.0;
                } else {
                    // Linear interpolation between min and max
                    sizeFactor = 0.5 + (0.5 * (avgDistance - minDistance) / (maxDistance - minDistance));
                }
                
                // Apply the size adjustment to individual stars based on their distance to z=0
                const positions = particleSystem.geometry.attributes.position.array;
                const colors = particleSystem.geometry.attributes.color.array;
                
                // Now let's make nearby stars (those close to z=0) even smaller
                // We'll apply this sizing effect to each individual vertex
                for (let i = 0; i < positions.length; i += 3) {
                    const starZ = positions[i + 2];
                    
                    // Calculate z-distance from camera (how close the star is to z=0)
                    const zDistanceToCamera = Math.abs(starZ - camera.position.z);
                    
                    // Apply size reduction for stars approaching z=0
                    const zDistanceThreshold = 100; // Distance from z=0 at which stars start shrinking
                    const minZSizeFactor = 0.1; // Smallest size factor for stars very close to z=0
                    
                    // Calculate the z-based size factor
                    let zSizeFactor = 1.0;
                    if (zDistanceToCamera < zDistanceThreshold) {
                        // Linear interpolation: stars get smaller as they approach z=0
                        zSizeFactor = minZSizeFactor + (1.0 - minZSizeFactor) * (zDistanceToCamera / zDistanceThreshold);
                        
                        // Shrink stars that are getting close to z=0 by reducing their brightness
                        if (starZ < camera.position.z) { // Only affect stars in front of camera
                            const currentLuminosity = colors[i]; // Get current star brightness
                            const reducedLuminosity = currentLuminosity * zSizeFactor;
                            
                            // Apply reduced brightness to make star appear smaller
                            colors[i] = reducedLuminosity;     // R
                            colors[i + 1] = reducedLuminosity; // G
                            colors[i + 2] = reducedLuminosity; // B
                        }
                    }
                }
                
                // Apply the overall size adjustment
                particleSystem.material.size = baseSize * sizeFactor;
            }
    
            // Mark attributes as needing update
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleSystem.geometry.attributes.color.needsUpdate = true;
        }
    } catch (error) {
        console.error("Error in stars animation:", error);
    }
}

function animateStreetLamps() {
    // If street lamps array is empty and toggle is on, create initial lamps
    if (streetLamps.length === 0 && DEBUG.toggles.showStreetLamps.value) {
        createStreetLamps();
        return;
    }

    streetLamps.forEach((lamp, index) => {
        if (!lamp) return;
        
        lamp.position.z += speed;
        
        if (lamp.position.z > camera.position.z + 10) {
            if (!DEBUG.toggles.showStreetLamps.value) {
                // Remove lamp when it passes behind camera if toggle is off
                scene.remove(lamp);
                streetLamps[index] = null;
                return;
            }
            
            lamp.position.z = camera.position.z - 400 + Math.random() * 50;
            
            // Keep on same side of road
            const keepOnSameSide = lamp.position.x < 0 ? -1 : 1;
            lamp.position.x = keepOnSameSide * (roadWidth / 2 + 2);
        }
        
        // Update lamp light based on time of day
        const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
        const lampLight = lamp.children.find(child => child instanceof THREE.PointLight);
        if (lampLight) {
            lampLight.intensity = Math.max(0, 0.8 - dayFactor);
        }
    });
}

function animateBuildings() {
    // If buildings array is empty and toggle is on, create initial buildings
    if (buildings.length === 0 && DEBUG.toggles.showBuildings.value) {
        createBuildings();
        return;
    }

    buildings.forEach((building, index) => {
        if (!building) return;
        
        building.position.z += speed;
        
        if (building.position.z > camera.position.z + 10) {
            if (!DEBUG.toggles.showBuildings.value) {
                // Remove building when it passes behind camera if toggle is off
                scene.remove(building);
                buildings[index] = null;
                return;
            }
            
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

function animateDesertObjects() {
    // If desert objects array is empty and toggle is on, create initial objects
    if (desertObjects.length === 0 && DEBUG.toggles.showSceneObjects.value) {
        createDesertObjects();
        return;
    }

    const objectsToRemove = [];
    
    desertObjects.forEach(object => {
        if (!object) return;
        
        object.position.z += speed;
        
        if (object.position.z > camera.position.z + 10) {
            if (!DEBUG.toggles.showSceneObjects.value || object.userData.scene !== scenes[currentSceneIndex]) {
                objectsToRemove.push(object);
                return;
            }
            
            const newObject = sceneObjects[scenes[currentSceneIndex]].createObject();
            newObject.position.z = camera.position.z - 400 + Math.random() * 50;
            
            const sign = object.position.x < 0 ? -1 : 1;
            const distance = roadWidth / 2 + 5 + Math.random() * 100;
            newObject.position.x = sign * distance;
            
            newObject.userData = {
                scene: scenes[currentSceneIndex]
            };
            
            scene.remove(object);
            scene.add(newObject);
            
            const index = desertObjects.indexOf(object);
            if (index !== -1) {
                desertObjects[index] = newObject;
            }
        }
    });
    
    objectsToRemove.forEach(object => {
        scene.remove(object);
        const index = desertObjects.indexOf(object);
        if (index !== -1) {
            desertObjects.splice(index, 1);
        }
    });
}

function animateMountains() {
    // If mountains array is empty and toggle is on, create initial mountains
    if (mountains.length === 0 && DEBUG.toggles.showMountains.value) {
        createMountains();
        return;
    }

    mountains.forEach((mountain, index) => {
        if (!mountain) return;

        mountain.position.z += speed;
        
        if (mountain.position.z > camera.position.z + 100) {
            if (!DEBUG.toggles.showMountains.value) {
                // Remove mountain when it passes behind camera if toggle is off
                scene.remove(mountain);
                mountains[index] = null;
                return;
            }
            
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

function animate() {
    try {
        requestAnimationFrame(animate);
        
        // Update FPS if enabled
        if (DEBUG.toggles.showFPS.value) {
            stats.begin();
        }
        
        // Auto rotate scenes if enabled
        if (DEBUG.toggles.autoRotateScenes.value) {
            const currentTime = Date.now();
            if (currentTime - lastSceneChangeTime > sceneChangeDuration && !isSceneTransitioning) {
                startSceneTransition();
            }
        }
        
        // Update day/night cycle
        dayNightCycle += dayNightSpeed;
        if (dayNightCycle > Math.PI * 2) {
            dayNightCycle = 0;
        }
        
        // Calculate day/night factor (0 = night, 1 = day)
        const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
        const wasNight = isNight;
        isNight = dayFactor < 0.3; // Consider it night when the light level is below 30%
        
        // Manage stars during night and transition
        if (dayFactor < 0.7 && DEBUG.toggles.showStars.value) {
            // Create initial stars if they don't exist at all
            if (stars.length === 0) {
                try {
                    console.log("Creating initial stars");
                    createStars();
                    if (isNight) {
                        log('Stars created for nighttime', 'info');
                    }
                } catch (error) {
                    console.error('Error creating stars:', error);
                }
            }
            
            // Continuous star generation at night - less frequent than before
            if (isNight && Math.random() < 0.005) { // 0.5% chance per frame to add stars
                try {
                    // Add a small number of new stars
                    const starCount = Math.floor(DEBUG.variables.starCount.value * 0.03); // 3% of configured count
                    if (starCount > 0) {
                        addStars(starCount);
                    }
                } catch (error) {
                    console.error('Error adding stars:', error);
                }
            }
            
            // Clean up only star systems that have passed behind the camera
            if (stars.length > 1) { // Keep at least one star system
                const starsToKeep = [];
                
                for (let i = 0; i < stars.length; i++) {
                    const starSystem = stars[i];
                    if (!starSystem) continue;
                    
                    // Check if all stars in this system are behind the camera
                    const positions = starSystem.geometry.attributes.position.array;
                    let allStarsBehindCamera = true;
                    
                    // Sample some stars to determine if the system is behind the camera
                    const sampleSize = Math.min(50, positions.length / 3); // Check up to 50 stars
                    const step = Math.max(1, Math.floor((positions.length / 3) / sampleSize));
                    
                    for (let j = 0; j < positions.length; j += 3 * step) {
                        const starZ = positions[j + 2];
                        if (starZ < camera.position.z) {
                            // At least one star is in front of camera, keep this system
                            allStarsBehindCamera = false;
                            break;
                        }
                    }
                    
                    if (allStarsBehindCamera) {
                        // All sampled stars are behind camera, remove this system
                        scene.remove(starSystem);
                        if (starSystem.geometry) starSystem.geometry.dispose();
                        if (starSystem.material) starSystem.material.dispose();
                        
                        // Add new stars when old ones are behind the camera
                        // Use a threshold of 100 ft (convert to scene units)
                        const threshold = 100 * 0.3048; // Convert feet to meters (scene units)
                        
                        // Calculate average z position of the first few stars to determine distance
                        let avgStarZ = 0;
                        const sampleCount = Math.min(10, positions.length / 3);
                        for (let k = 0; k < sampleCount; k++) {
                            avgStarZ += positions[k * 3 + 2];
                        }
                        avgStarZ /= sampleCount;
                        
                        if (camera.position.z - avgStarZ > threshold) {
                            try {
                                // Add a new star system to replace the one that was removed
                                addStars(Math.floor(DEBUG.variables.starCount.value / 2));
                                console.log("Added new stars after old ones went behind camera");
                            } catch (error) {
                                console.error('Error adding replacement stars:', error);
                            }
                        }
                    } else {
                        // Some stars are still visible, keep this system
                        starsToKeep.push(starSystem);
                    }
                }
                
                stars = starsToKeep;
            }
        }
        
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

        // End FPS measurement
        if (DEBUG.toggles.showFPS.value) {
            stats.end();
        }

    } catch (error) {
        log('Critical animation error: ' + error.message, 'error');
        cancelAnimationFrame(animate);
        throw error;
    }
}

function startSceneTransition() {
    isSceneTransitioning = true;
    sceneTransitionProgress = 0;
    nextSceneIndex = (currentSceneIndex + 1) % scenes.length;
    console.log(`Starting transition from ${scenes[currentSceneIndex]} to ${scenes[nextSceneIndex]}`);
    
    // Instead of letting specks drop to 0 and then rebuilding, 
    // we'll pre-populate with some specks from the next scene
    if (DEBUG.toggles.showSpecks.value) {
        // Calculate how many next-scene specks to add
        const initialNextSceneSpecks = Math.floor(DEBUG.variables.speckCount.value * 0.2); // 20% of target count
        const speckGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const nextPalette = palettes[scenes[nextSceneIndex]];
        
        for (let i = 0; i < initialNextSceneSpecks; i++) {
            const speckColor = nextPalette[Math.floor(Math.random() * nextPalette.length)];
            const speckMaterial = new THREE.MeshBasicMaterial({ 
                color: speckColor,
                transparent: true,
                opacity: 0.8,
                depthWrite: false
            });
            
            const speck = new THREE.Mesh(speckGeometry, speckMaterial);
            speck.position.z = camera.position.z - 400 - Math.random() * 200; // Place further back
            const side = Math.random() < 0.5 ? -1 : 1;
            const distance = roadWidth / 2 + 5 + Math.random() * 200;
            speck.position.x = side * distance;
            speck.position.y = 0;
            
            scene.add(speck);
            specks.push(speck);
        }
    }
}

function updateSceneTransition() {
    sceneTransitionProgress += (1000 / 120) / sceneTransitionDuration;
    
    if (sceneTransitionProgress >= 1) {
        isSceneTransitioning = false;
        currentSceneIndex = nextSceneIndex;
        lastSceneChangeTime = Date.now();
        sceneTransitionProgress = 0;
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
    
    // Gradually create new scene objects during transition
    if (Math.random() < 0.1) { // 10% chance each frame to create a new object
        const newObject = sceneObjects[scenes[nextSceneIndex]].createObject();
        newObject.position.z = camera.position.z - 400 - Math.random() * 200; // Place further back
        
        const side = Math.random() < 0.5 ? -1 : 1;
        const distance = roadWidth / 2 + 5 + Math.random() * 100;
        newObject.position.x = side * distance;
        
        newObject.userData = {
            scene: scenes[nextSceneIndex]
        };
        
        scene.add(newObject);
        desertObjects.push(newObject);
    }
}

// Add easing function for smoother transitions
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function animateRoad() {
    if (!DEBUG.toggles.showRoad.value) {
        return; // Road is immediately removed when toggled off
    }

    // If toggle is on and road elements don't exist, recreate them
    if (roadSegments.length === 0) {
        createRoad();
        return;
    }

    // Move the main road
    roadSegments.forEach(segment => {
        if (!segment) return;
        segment.position.z += speed;
        
        // Reset road when it's far behind the camera
        const roadEndPosition = segment.position.z + roadLength * segmentCount * 4;
        if (roadEndPosition < camera.position.z + 200) { // Keep 200 units of road ahead at all times
            // Position the road at z=0 relative to the camera
            segment.position.z = 0;
        }
    });
    
    // Move and reset the lines with the same logic
    [leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine].forEach(line => {
        if (line) {
            line.position.z += speed;
            const lineEndPosition = line.position.z + roadLength * segmentCount * 4;
            if (lineEndPosition < camera.position.z + 200) {
                // Position the lines at z=0 relative to the camera
                line.position.z = 0;
            }
        }
    });
}

function animateSpecks() {
    // If specks array is empty and toggle is on, create initial specks
    if (specks.length === 0 && DEBUG.toggles.showSpecks.value) {
        createSpecks();
        return;
    }

    // Remove specks if toggle is off
    if (!DEBUG.toggles.showSpecks.value) {
        specks.forEach(speck => {
            if (speck) {
                scene.remove(speck);
                speck.geometry.dispose();
                speck.material.dispose();
            }
        });
        specks = [];
        return;
    }

    const specksToRemove = [];
    specks.forEach(speck => {
        if (!speck) return;
        
        speck.position.z += speed;
        
        // Remove specks that are too far behind the camera
        if (speck.position.z > camera.position.z + 50) {
            specksToRemove.push(speck);
        }
    });

    // Clean up removed specks
    specksToRemove.forEach(speck => {
        const index = specks.indexOf(speck);
        if (index !== -1) {
            scene.remove(speck);
            speck.geometry.dispose();
            speck.material.dispose();
            specks.splice(index, 1);
        }
    });

    // Calculate how many specks to create to maintain the count
    const targetSpeckCount = DEBUG.variables.speckCount.value;
    const speckDeficit = targetSpeckCount - specks.length;
    
    // Don't create too many specks in a single frame to avoid performance issues
    const maxNewSpecksPerFrame = Math.min(speckDeficit, 50);
    
    // Create new specks to maintain count
    if (speckDeficit > 0) {
        const speckGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        
        // Determine which palette to use based on transition state
        let currentPalette, nextPalette;
        if (isSceneTransitioning) {
            currentPalette = palettes[scenes[currentSceneIndex]];
            nextPalette = palettes[scenes[nextSceneIndex]];
        } else {
            currentPalette = palettes[scenes[currentSceneIndex]];
        }

        for (let i = 0; i < maxNewSpecksPerFrame; i++) {
            // During transition, gradually increase chance of using next scene's palette
            // as the transition progresses
            let speckColor;
            if (isSceneTransitioning && Math.random() < sceneTransitionProgress * 1.5) {
                // Use next scene's palette (with 1.5x multiplier to start earlier)
                speckColor = nextPalette[Math.floor(Math.random() * nextPalette.length)];
            } else {
                // Use current scene's palette
                speckColor = currentPalette[Math.floor(Math.random() * currentPalette.length)];
            }
            
            const speckMaterial = new THREE.MeshBasicMaterial({ 
                color: speckColor,
                transparent: true,
                opacity: 0.8,
                depthWrite: false
            });
            
            const speck = new THREE.Mesh(speckGeometry, speckMaterial);
            speck.position.z = camera.position.z - 400;
            const side = Math.random() < 0.5 ? -1 : 1;
            const distance = roadWidth / 2 + 5 + Math.random() * 200;
            speck.position.x = side * distance;
            speck.position.y = 0;
            
            scene.add(speck);
            specks.push(speck);
        }
    }
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
    try {
        window.addEventListener('keydown', (e) => {
            keysPressed[e.key] = true;
            
            // Toggle debug menu with backtick
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                if (DEBUG.menu) {
                    DEBUG.menu.style.display = DEBUG.menu.style.display === 'none' ? 'flex' : 'none';
                }
            }
            
            // Toggle day/night with 'n' key
            if (e.key === 'n' || e.key === 'N') {
                if (!isTransitioning) {
                    isTransitioning = true;
                    transitionProgress = 0;
                    transitionDirection = isNight ? -1 : 1;
                    log(`Starting transition from ${isNight ? 'night to day' : 'day to night'}`, 'info');
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
                camera.position.set(5, 5, 0); // Changed from (5, 5, 20) to position camera at start of road
                cameraTarget = new THREE.Vector3(0, 0, -40); // Adjusted to keep the same viewing angle
                camera.lookAt(cameraTarget);
                log('Camera position reset', 'info');
            }

            // Rotate camera 180 degrees with 'r' key
            if (e.key === 'r' || e.key === 'R') {
                // Rotate camera target 180 degrees around camera position
                const dx = cameraTarget.x - camera.position.x;
                const dz = cameraTarget.z - camera.position.z;
                cameraTarget.x = camera.position.x - dx;
                cameraTarget.z = camera.position.z - dz;
                camera.lookAt(cameraTarget);
                log('Camera rotated 180 degrees', 'info');
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
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
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
    const statusDisplay = document.getElementById('status-display');
    if (!statusDisplay) return;
    
    statusDisplay.style.cssText = `
        padding: 10px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 5px;
        margin-bottom: 15px;
    `;
}

function updateStatusDisplay(dayFactor) {
    const statusDisplay = document.getElementById('status-display');
    if (!statusDisplay) return;
    
    const timeOfDay = dayFactor > 0.5 ? 'Day' : 'Night';
    const currentScene = scenes[currentSceneIndex].charAt(0).toUpperCase() + scenes[currentSceneIndex].slice(1);
    const lightLevel = Math.round(dayFactor * 100);
    
    // Format camera position with 2 decimal places
    const posX = camera ? camera.position.x.toFixed(2) : "N/A";
    const posY = camera ? camera.position.y.toFixed(2) : "N/A";
    const posZ = camera ? camera.position.z.toFixed(2) : "N/A";
    
    statusDisplay.innerHTML = `
        <div style="font-size: 14px; margin-bottom: 5px;">
            <strong>Status</strong>
        </div>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px; font-size: 12px;">
            <div>Time:</div><div>${timeOfDay}</div>
            <div>Scene:</div><div>${currentScene}</div>
            <div>Light Level:</div><div>${lightLevel}%</div>
            <div>Position:</div><div>X: ${posX}, Y: ${posY}, Z: ${posZ}</div>
        </div>
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

// Add new function to create visibility section
function createVisibilitySection() {
    const section = document.createElement('div');
    
    // Add main object toggles
    const mainToggles = ['showRoad', 'showStreetLamps', 'showBuildings', 'showMountains', 'showSceneObjects', 'showStars', 'showSpecks'];
    addToggles(section, mainToggles);
    
    // Add scene-specific object toggles
    const sceneTogglesDiv = document.createElement('div');
    sceneTogglesDiv.style.cssText = `
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
    `;
    sceneTogglesDiv.innerHTML = '<div style="font-size: 12px; margin-bottom: 10px;">Scene-Specific Objects</div>';
    
    scenes.forEach(scene => {
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        `;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = DEBUG.sceneObjectsState[scene];
        checkbox.id = `toggle-${scene}-objects`;
        
        const label = document.createElement('label');
        label.textContent = scene.charAt(0).toUpperCase() + scene.slice(1);
        label.htmlFor = `toggle-${scene}-objects`;
        label.style.fontSize = '12px';
        
        checkbox.addEventListener('change', (e) => {
            DEBUG.sceneObjectsState[scene] = e.target.checked;
            log(`Toggled ${scene} objects to ${e.target.checked}`, 'info');
        });
        
        toggleContainer.appendChild(checkbox);
        toggleContainer.appendChild(label);
        sceneTogglesDiv.appendChild(toggleContainer);
    });
    
    section.appendChild(sceneTogglesDiv);
    return section;
}

// Add new function to create presets section
function createPresetsSection() {
    const section = document.createElement('div');
    section.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
    section.style.paddingBottom = '15px';
    section.style.marginBottom = '15px';
    
    // Create preset selector
    const presetSelect = document.createElement('select');
    presetSelect.style.cssText = `
        width: 200px;
        padding: 5px;
        margin-right: 10px;
        background: rgba(0, 0, 0, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
    `;
    
    function updatePresetOptions() {
        presetSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = 'Default';
        presetSelect.appendChild(defaultOption);
        
        // Add saved presets
        Object.keys(DEBUG.presets.saved).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelect.appendChild(option);
        });
    }
    
    // Create load button
    const loadButton = createButton('Load', () => {
        DEBUG.loadPreset(presetSelect.value);
        updateDebugMenu();
    });
    
    // Create save input and button
    const saveContainer = document.createElement('div');
    saveContainer.style.marginTop = '10px';
    
    const saveInput = document.createElement('input');
    saveInput.type = 'text';
    saveInput.placeholder = 'Preset name';
    saveInput.style.cssText = `
        width: 150px;
        padding: 5px;
        margin-right: 10px;
        background: rgba(0, 0, 0, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
    `;
    
    const saveButton = createButton('Save', () => {
        const name = saveInput.value.trim();
        if (name) {
            DEBUG.savePreset(name);
            saveInput.value = '';
            updatePresetOptions();
        }
    });
    
    // Create delete button
    const deleteButton = createButton('Delete', () => {
        const name = presetSelect.value;
        if (name !== 'default') {
            delete DEBUG.presets.saved[name];
            DEBUG.savePresetsToLocalStorage();
            updatePresetOptions();
            log(`Deleted preset: ${name}`, 'info');
        }
    });
    deleteButton.style.marginLeft = '10px';
    
    // Add elements to section
    section.appendChild(presetSelect);
    section.appendChild(loadButton);
    section.appendChild(saveContainer);
    saveContainer.appendChild(saveInput);
    saveContainer.appendChild(saveButton);
    saveContainer.appendChild(deleteButton);
    
    // Initialize preset options
    updatePresetOptions();
    
    return section;
}

// Add stars when settings change (now adds instead of replacing)
function updateStars() {
    try {
        // Turn on stars toggle if it's off
        if (!DEBUG.toggles.showStars.value) {
            DEBUG.toggles.showStars.value = true;
            // Update the UI toggle if it exists
            const toggle = document.getElementById('toggle-showStars');
            if (toggle) toggle.checked = true;
        }
        
        // Add stars without clearing existing ones
        addStars(Math.floor(DEBUG.variables.starCount.value / 2)); // Add half the configured number each time
        
        log('Additional stars added', 'info');
    } catch (error) {
        console.error('Error adding stars:', error);
        log('Failed to add stars: ' + error.message, 'error');
    }
} 