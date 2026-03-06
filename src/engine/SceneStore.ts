// src/engine/SceneStore.ts

import { writable } from 'svelte/store';
import { TFile } from 'obsidian';

// Architecture 7: Canonical Data Model
export interface SceneNode {
  id: string;          // File path
  title: string;       // File basename
  file: TFile;         // Reference to the actual Obsidian file
  storyDate: number;   // Frontmatter: date or sequence number
  era: number;         // Frontmatter: era
  emotional: {
    valence: number;   // Frontmatter: valence (-1 to 1)
    intensity: number; // Frontmatter: intensity (0 to 1)
  };
}

// Architecture 11.2: Central observable store
export const sceneStore = writable<SceneNode[]>([]);
export const selectedSceneStore = writable<SceneNode | null>(null);

// Store the first and last dates for proportional mapping
export const timelineBoundsStore = writable<{minDate: number, maxDate: number}>({ minDate: 0, maxDate: 0 });
