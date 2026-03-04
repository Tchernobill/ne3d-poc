import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ResourceTracker } from './ResourceTracker';

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
    this.camera.position.set(0, 10, 20);

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
   */
  updateNodes(count: number) {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.tracker.dispose(); // Cleans up previous geometry/materials
    }

    const geometry = this.tracker.track(new THREE.BoxGeometry(0.5, 0.5, 0.5));
    const material = this.tracker.track(new THREE.MeshStandardMaterial({ color: 0x44aadd }));
    
    this.instancedMesh = this.tracker.track(new THREE.InstancedMesh(geometry, material, count));

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      // Create a random mock layout along a timeline axis
      dummy.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedMesh);
  }

  private resize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
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