import { SceneNode } from './SceneStore';
import * as THREE from 'three';

export class TimelineLayout {
  public compute(nodes: SceneNode[]): THREE.Matrix4[] {
    const matrices: THREE.Matrix4[] =[];
    const dummy = new THREE.Object3D();

    // Sort nodes chronologically
    const sortedNodes = [...nodes].sort((a, b) => a.storyDate - b.storyDate);

    sortedNodes.forEach((node, index) => {
      // X Axis: Progression of time (index or storyDate)
      const x = index * 2.0; 
      
      // Y Axis: Emotional Valence (High = positive, Low = negative)
      const y = node.emotional.valence * 5.0; 
      
      // Z Axis: Era or spatial separation
      const z = node.era * -3.0;

      dummy.position.set(x, y, z);
      
      // Scale based on emotional intensity
      const scale = 0.5 + (node.emotional.intensity * 1.5);
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    });

    return matrices;
  }
}