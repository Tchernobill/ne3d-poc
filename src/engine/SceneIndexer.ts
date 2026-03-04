import { App, TFile } from 'obsidian';
import { SceneNode, sceneStore } from './SceneStore';

export class SceneIndexer {
  private app: App;
  private targetFolder: string; // e.g., "Scenes/" to restrict the scope

  constructor(app: App, targetFolder: string = "") {
    this.app = app;
    this.targetFolder = targetFolder;
  }

  // Initial scan of the vault
  public indexVault() {
    const files = this.app.vault.getMarkdownFiles();
    const nodes: SceneNode[] =[];

    for (const file of files) {
      if (this.targetFolder && !file.path.startsWith(this.targetFolder)) continue;
      
      const node = this.parseFile(file);
      if (node) nodes.push(node);
    }

    // Update the Svelte store
    sceneStore.set(nodes);
  }


  // Parse a single file's frontmatter into our canonical model
  private parseFile(file: TFile): SceneNode | null {
    // 1. Strict Folder Filter (Obsidian uses forward slashes internally)
    if (!file.path.startsWith('02_Eras/Era_01/Summaries')) return null;

    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;

    // 2. Strict Frontmatter Property Filter
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

  // Listen for live updates when the user edits a markdown file
  public registerListeners(registerEvent: (event: any) => void) {
    registerEvent(
      this.app.metadataCache.on('changed', (file: TFile, data: string, cache: any) => {
        if (this.targetFolder && !file.path.startsWith(this.targetFolder)) return;
        
        console.log(`Live update detected on: ${file.basename}`);
        this.indexVault(); // Simple implementation: re-index all. (Can be optimized later)
      })
    );
  }
}