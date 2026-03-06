// src/engine/Renderer3D.ts

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ResourceTracker } from './ResourceTracker';
import { TimelineLayout } from './TimelineLayout';
import { SceneNode, selectedSceneStore } from './SceneStore';

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
  private currentNodes: SceneNode[] =[];

  private layoutEngine = new TimelineLayout();
  private instancedMesh!: THREE.InstancedMesh;

  // NEW: Store physical boundaries for scrolling
  private timelineMinY: number = 0;
  private timelineMaxY: number = 100;

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
    this.camera.position.set(0, 0, 15); // Start at Y=0

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupControls();
    this.setupEventBoundaries();
    
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
    
    // NEW: Strict Camera Constraints
    this.controls.enableZoom = false; // Disable normal scroll zooming
    this.controls.enablePan = false;  // Disable right-click free panning
    this.controls.target.set(0, 0, 0); // Lock focus to center X and Z
  }

  /**
   * Architecture 6.0: Event Boundary Management
   * Prevents Three.js gestures from triggering Obsidian's native pane dragging/scrolling
   */
  private setupEventBoundaries() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', (e) => e.stopPropagation());
    canvas.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });

    // RAYCASTING
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
            selectedSceneStore.set(this.currentNodes[instanceId]); 
          }
        } else {
          selectedSceneStore.set(null);
        }
      }
    });

    // CUSTOM WHEEL SCROLLING (Elevator along Y-Axis)
    canvas.addEventListener('wheel', (e) => {
      e.stopPropagation();
      e.preventDefault(); // Stop normal zoom and page scroll

      const scrollSpeed = 0.05;
      const delta = e.deltaY * scrollSpeed;

      // Calculate new target Y position
      let newY = this.controls.target.y + delta;
      
      // Constrain scrolling to the physical bounds of the timeline
      const padding = 5;
      newY = THREE.MathUtils.clamp(newY, this.timelineMinY - padding, this.timelineMaxY + padding);

      // Move both target and camera together to create a smooth panning elevator effect
      const diff = newY - this.controls.target.y;
      this.controls.target.y += diff;
      this.camera.position.y += diff;

    }, { passive: false });
  }

  /**
   * Performance Strategy: InstancedMesh for 1000+ nodes
   * Now driven entirely by Obsidian File Data
   */
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

    // Use the new TimelineLayout math
    const result = this.layoutEngine.compute(nodes, bounds.min, bounds.max);
    
    // Update camera constraints based on actual node spread
    this.timelineMinY = result.bounds.minY;
    this.timelineMaxY = result.bounds.maxY;

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