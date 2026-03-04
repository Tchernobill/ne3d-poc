import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ResourceTracker } from './ResourceTracker';
import { TimelineLayout } from './TimelineLayout';
import { SceneNode } from './SceneStore';
import { selectedSceneStore } from './SceneStore';

/**
 * Architecture 11.5: Renderer3D
 * Owns Three.js scene, uses ResourceTracker, enforces event boundaries.
 */
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
  private currentNodes: SceneNode[] =[]; // Keep track of the nodes we are rendering

  // Phase 1: Layout Engine Integration
  private layoutEngine = new TimelineLayout();

  // Using InstancedMesh as per Section 15: Performance Strategy
  private instancedMesh!: THREE.InstancedMesh;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.tracker = new ResourceTracker();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e1e); // Obsidian dark mode feel

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupControls();
    this.setupEventBoundaries();
    
    // Resize observer to handle Obsidian pane resizing dynamically
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
  }

  /**
   * Architecture 6.0: Event Boundary Management
   * Prevents Three.js gestures from triggering Obsidian's native pane dragging/scrolling
   */
  private setupEventBoundaries() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
    canvas.addEventListener('pointerdown', (e) => e.stopPropagation());
    canvas.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });

    // --- NEW: RAYCASTING CLICK DETECTION ---
    canvas.addEventListener('click', (event) => {
      // 1. Calculate mouse position in normalized device coordinates (-1 to +1)
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 2. Raycast from camera
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // 3. Check for intersections with our instanced mesh
      if (this.instancedMesh) {
        const intersects = this.raycaster.intersectObject(this.instancedMesh);
        if (intersects.length > 0) {
          // We hit a cube! Get its instance ID (0 to 69)
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined) {
            const clickedNode = this.currentNodes[instanceId];
            console.log("Clicked Scene:", clickedNode.title);
            
            // Send it to the Svelte UI!
            selectedSceneStore.set(clickedNode); 
          }
        } else {
          // Clicked empty space
          selectedSceneStore.set(null);
        }
      }
    });

    // Prevent scrolling from moving the whole Obsidian view
    canvas.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: false });

    // Prevent dragging the canvas from dragging the Obsidian pane
    canvas.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });

    // Touch event containment
    canvas.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });
  }

  /**
   * Performance Strategy: InstancedMesh for 1000+ nodes
   * Now driven entirely by Obsidian File Data
   */
  updateNodes(nodes: SceneNode[]) {
    this.currentNodes = nodes; // Save the reference
    const count = nodes.length;
    console.log(`Updating ${count} nodes`);

    // 1. Safely clean up the old mesh without wiping the lights out
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
      this.instancedMesh.dispose();
    }

    // 2. If there are no scene files found, just return an empty space
    if (count === 0) return;

    // 3. Compute layout matrices using the Phase 1 Data Model
    const matrices = this.layoutEngine.compute(nodes);

    // 4. Create new geometry & material and track them for the final plugin unload
    const geometry = this.tracker.track(new THREE.BoxGeometry(0.5, 0.5, 0.5));
    const material = this.tracker.track(new THREE.MeshStandardMaterial({ color: 0x44aadd }));
    
    this.instancedMesh = this.tracker.track(new THREE.InstancedMesh(geometry, material, count));

    // 5. Apply the calculated timeline coordinates to each instanced block
    for (let i = 0; i < count; i++) {
      this.instancedMesh.setMatrixAt(i, matrices[i]);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedMesh);
  }

  private resize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth; //
    const height = this.container.clientHeight; //
    
    // Prevent NaN projection matrix corruption
    if (width === 0 || height === 0) return; 

    this.camera.aspect = width / height; //
    this.camera.updateProjectionMatrix(); //
    this.renderer.setSize(width, height); //
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Architecture 9.3: Hard disposal on view close
   */
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