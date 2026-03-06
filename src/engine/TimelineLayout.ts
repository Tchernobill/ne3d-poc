// src/engine/TimelineLayout.ts

import { SceneNode } from './SceneStore';
import * as THREE from 'three';

export interface LayoutBounds {
  minY: number;
  maxY: number;
}

export class TimelineLayout {
  public compute(nodes: SceneNode[], minDate: number, maxDate: number): { matrices: THREE.Matrix4[], bounds: LayoutBounds } {
    const matrices: THREE.Matrix4[] =[];
    const dummy = new THREE.Object3D();

    // Define the total physical height of the 3D timeline (scales with node count)
    const timelineHeight = Math.max(nodes.length * 3.0, 10);
    const dateRange = maxDate - minDate;

    nodes.forEach((node) => {
      // Y-AXIS: Proportional position in time
      let y = 0;
      if (dateRange > 0) {
        const proportion = (node.storyDate - minDate) / dateRange;
        y = proportion * timelineHeight;
      } else {
        y = timelineHeight / 2; // Fallback if all dates are the same
      }
      
      // X-AXIS: Emotional Valence (swapped from Y)
      const x = node.emotional.valence * 5.0; 
      
      // Z-AXIS: Era or spatial separation
      const z = node.era * -3.0;

      dummy.position.set(x, y, z);
      
      // Scale based on emotional intensity
      const scale = 0.5 + (node.emotional.intensity * 1.5);
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    });

    return { 
      matrices, 
      bounds: { minY: 0, maxY: timelineHeight } 
    };
  }
}