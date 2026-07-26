// --- THREE.JS STL VIEWER & SIMULATOR ---

let scene, camera, renderer, controls;
let currentMesh = null;
let parsedVolume = 0; // in cubic mm
let parsedDimensions = { x: 0, y: 0, z: 0 }; // in mm

// Configuration parameters for pricing
const PRICING_CONFIG = {
    materials: {
        'pla': { name: 'PLA+', density: 1.24, pricePerGram: 0.35, factor: 1.0 },
        'petg': { name: 'PETG', density: 1.27, pricePerGram: 0.40, factor: 1.15 },
        'tpu': { name: 'TPU גמיש', density: 1.21, pricePerGram: 0.60, factor: 1.4 }
    },
    infills: {
        '15': { name: '15% (קל)', factor: 0.4 },
        '30': { name: '30% (סטנדרטי)', factor: 0.6 },
        '50': { name: '50% (חזק ומלא)', factor: 0.8 }
    },
    colors: {
        'gold-silk': { hex: '#D4AF37', roughness: 0.2, metalness: 0.8, label: 'זהב משי (Silk Gold)' },
        'silver-silk': { hex: '#C0C0C0', roughness: 0.2, metalness: 0.8, label: 'כסף משי (Silk Silver)' },
        'black-matte': { hex: '#1E293B', roughness: 0.8, metalness: 0.1, label: 'שחור מט' },
        'white-matte': { hex: '#F8FAFC', roughness: 0.8, metalness: 0.1, label: 'לבן מט' },
        'blue-electric': { hex: '#0284C7', roughness: 0.4, metalness: 0.5, label: 'כחול אלקטריק' },
        'sky-blue': { hex: '#38BDF8', roughness: 0.4, metalness: 0.4, label: 'תכלת שמיים' },
        'red-ruby': { hex: '#EF4444', roughness: 0.3, metalness: 0.6, label: 'אדום רובי' }
    },
    baseSetupFee: 15 // Base fee for setup and slicing (ILS)
};

// State variables
let activeMaterial = 'pla';
let activeColor = 'gold-silk';
let activeInfill = '30';
let activeFile = null;

// Initialize 3D Scene
function init3DViewer() {
    const container = document.getElementById('viewer-container');
    if (!container) return;

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);

    // Create camera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 100);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    
    // Clear previous canvas
    const oldCanvas = document.getElementById('canvas3d');
    if (oldCanvas) oldCanvas.remove();
    
    renderer.domElement.id = 'canvas3d';
    container.appendChild(renderer.domElement);

    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2; // Don't go below ground
    controls.minDistance = 10;
    controls.maxDistance = 300;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight1.position.set(100, 100, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.3);
    dirLight2.position.set(-100, -50, -50);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 200);
    pointLight.position.set(0, 80, 50);
    scene.add(pointLight);

    // Ground grid/floor
    const gridHelper = new THREE.GridHelper(100, 20, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -20;
    scene.add(gridHelper);

    // Start animation loop
    animate();

    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    
    // Slow auto-rotation when user is not interacting
    if (currentMesh && !controls.state == -1) {
        currentMesh.rotation.y += 0.005;
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    const container = document.getElementById('viewer-container');
    if (!container || !camera || !renderer) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Calculate signed volume of triangle mesh to get accurate volume in mm3
function calculateVolume(geometry) {
    let position = geometry.attributes.position;
    if (!position) return 0;
    
    let count = position.count;
    let volume = 0;
    
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();
    
    for (let i = 0; i < count; i += 3) {
        p1.fromBufferAttribute(position, i);
        p2.fromBufferAttribute(position, i + 1);
        p3.fromBufferAttribute(position, i + 2);
        
        volume += signedVolumeOfTriangle(p1, p2, p3);
    }
    
    return Math.abs(volume);
}

function signedVolumeOfTriangle(p1, p2, p3) {
    return p1.dot(p2.cross(p3)) / 6.0;
}

// Load STL Array Buffer and display
function loadSTL(arrayBuffer, filename) {
    const loader = new THREE.STLLoader();
    const geometry = loader.parse(arrayBuffer);
    
    // Clean up old mesh
    if (currentMesh) {
        scene.remove(currentMesh);
    }
    
    // Calculate volume & dimensions
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    
    parsedDimensions = {
        x: bbox.max.x - bbox.min.x,
        y: bbox.max.y - bbox.min.y,
        z: bbox.max.z - bbox.min.z
    };
    
    parsedVolume = calculateVolume(geometry);
    if (parsedVolume === 0) {
        // Fallback calculation using bounding box volume if signed volume is zero (non-closed mesh)
        parsedVolume = parsedDimensions.x * parsedDimensions.y * parsedDimensions.z * 0.4;
    }
    
    // Create Material based on active filament configuration
    const matConfig = PRICING_CONFIG.colors[activeColor];
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(matConfig.hex),
        roughness: matConfig.roughness,
        metalness: matConfig.metalness,
        flatShading: true
    });
    
    currentMesh = new THREE.Mesh(geometry, material);
    
    // Center geometry
    geometry.center();
    
    // Scale mesh to fit comfortably in view
    const maxDim = Math.max(parsedDimensions.x, parsedDimensions.y, parsedDimensions.z);
    const scale = 40 / maxDim;
    currentMesh.scale.set(scale, scale, scale);
    
    // Adjust height to sit on the grid (grid is at y = -20)
    currentMesh.position.y = -20 + (parsedDimensions.y * scale) / 2;
    
    scene.add(currentMesh);
    
    // Reset camera position based on object
    camera.position.set(0, 15, 75);
    controls.target.set(0, -20 + (parsedDimensions.y * scale) / 2, 0);
    
    // Hide loading overlay and placeholder
    document.getElementById('viewer-loading').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('viewer-loading').style.display = 'none';
    }, 300);
    document.getElementById('viewer-placeholder').style.display = 'none';
    
    // Update pricing in UI
    updatePricing();
}

// Calculate price based on volume, infill, and material selection
function calculatePrice() {
    if (parsedVolume === 0) return 0;
    
    const volCc = parsedVolume / 1000; // convert mm3 to cc (cubic cm)
    const mat = PRICING_CONFIG.materials[activeMaterial];
    const inf = PRICING_CONFIG.infills[activeInfill];
    
    // Weight calculation
    const infillRatio = inf.factor; // multiplier for infill
    const estimatedWeight = volCc * mat.density * infillRatio;
    
    // Cost calculation
    let cost = (estimatedWeight * mat.pricePerGram * mat.factor) + PRICING_CONFIG.baseSetupFee;
    
    // Round to whole ILS
    return Math.ceil(cost);
}

function updatePricing() {
    if (parsedVolume === 0) return;
    
    const volCc = parsedVolume / 1000;
    const mat = PRICING_CONFIG.materials[activeMaterial];
    const inf = PRICING_CONFIG.infills[activeInfill];
    const col = PRICING_CONFIG.colors[activeColor];
    
    const weight = (volCc * mat.density * inf.factor).toFixed(1);
    const printTimeHours = Math.ceil(weight * 0.4); // rough estimate: 24 mins per gram
    const price = calculatePrice();
    
    // Update UI elements
    document.getElementById('calc-vol').innerText = `${volCc.toFixed(1)} סמ"ק`;
    document.getElementById('calc-weight').innerText = `${weight} גרם`;
    document.getElementById('calc-time').innerText = `כ-${printTimeHours} שעות`;
    document.getElementById('calc-total-price').innerText = `₪${price}`;
    
    // Update model display name and details for WhatsApp submit
    document.getElementById('submit-order-btn').disabled = false;
}

// Update mesh color and roughness properties in real-time
function updateMeshMaterial() {
    if (!currentMesh) return;
    
    const matConfig = PRICING_CONFIG.colors[activeColor];
    currentMesh.material.color.setHex(parseInt(matConfig.hex.replace('#', '0x')));
    currentMesh.material.roughness = matConfig.roughness;
    currentMesh.material.metalness = matConfig.metalness;
    currentMesh.material.needsUpdate = true;
}

// Handle File Processing
function processFile(file) {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.stl')) {
        alert('אנא העלה קובץ בפורמט STL בלבד.');
        return;
    }
    
    activeFile = file;
    
    // Show selected file banner
    const banner = document.getElementById('file-banner');
    const nameLabel = document.getElementById('lbl-file-name');
    const sizeLabel = document.getElementById('lbl-file-size');
    const dropzone = document.getElementById('dropzone');
    
    nameLabel.innerText = file.name;
    sizeLabel.innerText = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    banner.style.display = 'flex';
    dropzone.style.display = 'none';
    
    // Show viewer loading state
    const loading = document.getElementById('viewer-loading');
    loading.style.display = 'flex';
    loading.style.opacity = '1';
    
    // Initialize 3D scene if not done already
    if (!scene) {
        init3DViewer();
    }
    
    // Read file as ArrayBuffer
    const reader = new FileReader();
    reader.onload = function(e) {
        loadSTL(e.target.result, file.name);
    };
    reader.onerror = function() {
        alert('שגיאה בקריאת הקובץ. אנא נסה שנית.');
        loading.style.display = 'none';
    };
    reader.readAsArrayBuffer(file);
}

// Clear selected file
function resetFile() {
    activeFile = null;
    parsedVolume = 0;
    parsedDimensions = { x: 0, y: 0, z: 0 };
    
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
    }
    
    document.getElementById('file-banner').style.display = 'none';
    document.getElementById('dropzone').style.display = 'block';
    document.getElementById('viewer-placeholder').style.display = 'flex';
    
    document.getElementById('calc-vol').innerText = '0 סמ"ק';
    document.getElementById('calc-weight').innerText = '0 גרם';
    document.getElementById('calc-time').innerText = '0 שעות';
    document.getElementById('calc-total-price').innerText = '₪0';
    document.getElementById('submit-order-btn').disabled = true;
}

// Compile order info and send to WhatsApp
function sendOrderToWhatsApp() {
    if (!activeFile || parsedVolume === 0) return;
    
    const mat = PRICING_CONFIG.materials[activeMaterial];
    const inf = PRICING_CONFIG.infills[activeInfill];
    const col = PRICING_CONFIG.colors[activeColor];
    const price = calculatePrice();
    const volCc = (parsedVolume / 1000).toFixed(1);
    const weight = (volCc * mat.density * inf.factor).toFixed(1);
    
    const message = `שלום ProPrint!
אני מעוניין להזמין הדפסה תלת-ממדית אישית.
להלן פרטי המודל שלי:
📂 שם הקובץ: ${activeFile.name}
📐 מידות: ${parsedDimensions.x.toFixed(0)}x${parsedDimensions.y.toFixed(0)}x${parsedDimensions.z.toFixed(0)} מ"מ
⚖️ נפח משוער: ${volCc} סמ"ק (${weight} גרם)
⚙️ חומר גלם: ${mat.name}
🎨 צבע פילמנט: ${col.label}
🔋 אחוז מילוי: ${inf.name}
💰 הערכת מחיר באתר: ₪${price}

*צירפתי כאן את קובץ ה-STL לבדיקה.*`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=972532708553&text=${encodedMsg}`;
    
    window.open(whatsappUrl, '_blank');
}

// Wire Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Material Selector
    const materialOpts = document.querySelectorAll('.material-opt');
    materialOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            materialOpts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            activeMaterial = opt.getAttribute('data-material');
            updatePricing();
        });
    });

    // 2. Color Selector
    const colorOpts = document.querySelectorAll('.color-opt');
    const colorNameDisplay = document.getElementById('active-color-name');
    colorOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            colorOpts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            activeColor = opt.getAttribute('data-color');
            
            if (colorNameDisplay) {
                colorNameDisplay.innerText = PRICING_CONFIG.colors[activeColor].label;
            }
            
            updateMeshMaterial();
            updatePricing();
        });
    });

    // 3. Infill Selector
    const infillOpts = document.querySelectorAll('.infill-opt');
    infillOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            infillOpts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            activeInfill = opt.getAttribute('data-infill');
            updatePricing();
        });
    });

    // 4. File input & Drag & Drop
    const fileInput = document.getElementById('stl-file-input');
    const dropzone = document.getElementById('dropzone');
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                processFile(e.target.files[0]);
            }
        });
    }
    
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                processFile(e.dataTransfer.files[0]);
            }
        });
    }

    // Reset button
    const removeBtn = document.getElementById('remove-file');
    if (removeBtn) {
        removeBtn.addEventListener('click', resetFile);
    }

    // Submit order button
    const submitBtn = document.getElementById('submit-order-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', sendOrderToWhatsApp);
    }
});
