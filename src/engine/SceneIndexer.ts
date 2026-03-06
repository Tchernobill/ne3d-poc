// src/engine/SceneIndexer.ts

import { App, TFile } from 'obsidian';
import { SceneNode, sceneStore, timelineBoundsStore } from './SceneStore'; // Import bounds store

export class SceneIndexer {
  private app: App;
  private targetFolder: string; 

  constructor(app: App, targetFolder: string = "") {
    this.app = app;
    this.targetFolder = targetFolder;
  }

  public indexVault() {
    const files = this.app.vault.getMarkdownFiles();
    const nodes: SceneNode[] =[];
    
    // Track min and max dates
    let minDate = Infinity;
    let maxDate = -Infinity;

    for (const file of files) {
      if (this.targetFolder && !file.path.startsWith(this.targetFolder)) continue;
      
      const node = this.parseFile(file);
      if (node) {
        nodes.push(node);
        // Calculate bounds
        if (node.storyDate < minDate) minDate = node.storyDate;
        if (node.storyDate > maxDate) maxDate = node.storyDate;
      }
    }

    // Safety fallbacks if vault is empty or dates are invalid
    if (nodes.length === 0) {
      minDate = 0; maxDate = 0;
    } else {
      if (minDate === Infinity) minDate = 0;
      if (maxDate === -Infinity) maxDate = 0;
    }

    // Update both stores
    timelineBoundsStore.set({ min: minDate, max: maxDate });
    sceneStore.set(nodes);
  }

  private parseFile(file: TFile): SceneNode | null {
    if (!file.path.startsWith('02_Eras/Era_01/Summaries')) return null;

    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;

    if (fm?.note_type !== 'scene_summary') return null;

    return {
      id: file.path,
      title: file.basename,
      file: file,
      storyDate: fm?.storyDate ? Number(fm.storyDate) : 0,
      era: fm?.era ? Number(fm.era) : 1,
      emotional: {
        valence: fm?.valence ? Number(fm.valence) : 0,
        intensity: fm?.intensity ? Number(fm.intensity) : 0.5,
      }
    };
  }

  public registerListeners(registerEvent: (event: any) => void) {
    registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        if (this.targetFolder && !file.path.startsWith(this.targetFolder)) return;
        this.indexVault(); 
      })
    );
  }
}
