import { SceneNode } from './SceneStore';
import * as THREE from 'three';

export interface LayoutBounds {
  minX: number;
  maxX: number;
}

export class TimelineLayout {
  public compute(nodes: SceneNode[], minDate: number, maxDate: number): { matrices: THREE.Matrix4[], bounds: LayoutBounds } {
    const matrices: THREE.Matrix4[] =[];
    const dummy = new THREE.Object3D();

    // Define the total physical width of the 3D timeline
    const timelineWidth = Math.max(nodes.length * 3.0, 10);
    const dateRange = maxDate - minDate;

    nodes.forEach((node) => {
      // X-AXIS (Left-to-Right): Proportional position in time
      let x = 0;
      if (dateRange > 0) {
        const proportion = (node.storyDate - minDate) / dateRange;
        x = proportion * timelineWidth;
      } else {
        x = timelineWidth / 2; 
      }
      
      // Y-AXIS (Up/Down): Emotional Valence
      const y = node.emotional.valence * 5.0; 
      
      // Z-AXIS (Depth): Era or spatial separation
      const z = node.era * -3.0;

      dummy.position.set(x, y, z);
      
      const scale = 0.5 + (node.emotional.intensity * 1.5);
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    });

    return { 
      matrices, 
      bounds: { minX: 0, maxX: timelineWidth } 
    };
  }
}