import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ResourceTracker } from './ResourceTracker';
import { TimelineLayout } from './TimelineLayout';
import { SceneNode, selectedSceneStore } from './SceneStore';

export class Renderer3D {
  private container: HTMLDivElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private tracker: ResourceTracker;
  private animationFrameId: number = 0;
  
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private currentNodes: SceneNode[] =[];

  private layoutEngine = new TimelineLayout();
  private instancedMesh!: THREE.InstancedMesh;

  private timelineMinX: number = 0;
  private timelineMaxX: number = 100;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.tracker = new ResourceTracker();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e1e);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 30); // Pull camera back to see X-Axis

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // 🛠️ MOUSE FIX: Apply strict CSS to the canvas to block Obsidian interference
    const canvas = this.renderer.domElement;
    canvas.classList.add('no-drag'); // Tell Obsidian NOT to drag the pane
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '10'; // Force it to the top
    canvas.style.touchAction = 'none'; // Critical for capturing pointer events

    this.container.appendChild(canvas);

    this.setupLighting();
    this.setupControls();
    this.setupEventBoundaries();
    
    // Debug Axes & Origin
    const axesHelper = this.tracker.track(new THREE.AxesHelper(10));
    this.scene.add(axesHelper);

    const debugGeo = this.tracker.track(new THREE.BoxGeometry(4, 4, 4));
    const debugMat = this.tracker.track(new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }));
    const debugCube = this.tracker.track(new THREE.Mesh(debugGeo, debugMat));
    this.scene.add(debugCube);

    const resizeObserver = new ResizeObserver(() => this.resize());
    resizeObserver.observe(this.container);

    this.animate();
  }

  private setupLighting() {
    const ambientLight = this.tracker.track(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = this.tracker.track(new THREE.DirectionalLight(0xffffff, 0.8));
    dirLight.position.set(10, 20, 10);
    this.scene.add(ambientLight);
    this.scene.add(dirLight);
  }

  private setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    this.controls.enableZoom = false; 
    this.controls.enablePan = false;  
    this.controls.target.set(0, 0, 0); 

    // Explicitly define the mouse mapping
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    
    this.controls.update();

    // 🛠️ DEBUGGER: We will now see these trigger!
    this.controls.addEventListener('start', () => console.log('[Orbit] 🟢 START'));
    this.controls.addEventListener('end', () => console.log('[Orbit] 🔴 END'));
  }

  private setupEventBoundaries() {
    const canvas = this.renderer.domElement;

    // We removed 'pointerdown' stopPropagation so OrbitControls can breathe.
    
    // RAYCASTING: Detect clicks on our cubes
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      if (this.instancedMesh) {
        const intersects = this.raycaster.intersectObject(this.instancedMesh);
        if (intersects.length > 0) {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined) {
            console.log("[Raycast] Hit a Cube!");
            selectedSceneStore.set(this.currentNodes[instanceId]); 
          }
        } else {
          selectedSceneStore.set(null);
        }
      }
    });

    // CUSTOM SCROLL WHEEL (Pan Camera along X-Axis)
    canvas.addEventListener('wheel', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const scrollSpeed = 0.05;
      const delta = e.deltaY * scrollSpeed;

      let newX = this.controls.target.x + delta; 
      
      const padding = 10;
      newX = THREE.MathUtils.clamp(newX, this.timelineMinX - padding, this.timelineMaxX + padding);

      const diff = newX - this.controls.target.x;
      this.controls.target.x += diff;
      this.camera.position.x += diff;

    }, { passive: false });
  }

  updateNodes(nodes: SceneNode[], bounds: {min: number, max: number}) {
    this.currentNodes = nodes;
    const count = nodes.length;

    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
      this.instancedMesh.dispose();
    }

    if (count === 0) return;

    const result = this.layoutEngine.compute(nodes, bounds.min, bounds.max);
    
    this.timelineMinX = result.bounds.minX;
    this.timelineMaxX = result.bounds.maxX;

    const geometry = this.tracker.track(new THREE.BoxGeometry(0.5, 0.5, 0.5));
    const material = this.tracker.track(new THREE.MeshStandardMaterial({ color: 0x44aadd }));
    this.instancedMesh = this.tracker.track(new THREE.InstancedMesh(geometry, material, count));

    for (let i = 0; i < count; i++) {
      this.instancedMesh.setMatrixAt(i, result.matrices[i]);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedMesh);
  }

  private resize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth; 
    const height = this.container.clientHeight; 
    
    if (width === 0 || height === 0) return; 

    this.camera.aspect = width / height; 
    this.camera.updateProjectionMatrix(); 
    this.renderer.setSize(width, height); 
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId);
    if (this.controls) this.controls.dispose();
    this.tracker.dispose();
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}