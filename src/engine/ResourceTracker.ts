import * as THREE from 'three';

/**
 * Architecture 9.2: ResourceTracker Class (Mandatory)
 * Prevents WebGL memory leaks when switching layouts or reloading plugins.
 */
export class ResourceTracker {
  private resources = new Set<any>();

  track<T>(resource: T): T {
    if (!resource) return resource;

    // Track Geometries, Materials, Textures, and Object3Ds
    if (
      (resource as any).dispose || 
      resource instanceof THREE.Object3D
    ) {
      this.resources.add(resource);
    }
    return resource;
  }

  dispose() {
    for (const resource of this.resources) {
      if (resource instanceof THREE.Object3D) {
        if (resource.parent) {
          resource.parent.remove(resource);
        }
      }
      if ((resource as any).dispose) {
        (resource as any).dispose();
      }
    }
    this.resources.clear();
  }
}