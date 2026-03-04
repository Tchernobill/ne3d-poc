import { Plugin, WorkspaceLeaf } from 'obsidian';
import { NE3DView, VIEW_TYPE_NE3D } from './NE3DView';
import { SceneIndexer } from './engine/SceneIndexer';
import { FrontmatterWriteQueue } from './engine/FrontmatterWriteQueue';

export default class NE3DPlugin extends Plugin {
  public indexer!: SceneIndexer;
  public writeQueue!: FrontmatterWriteQueue;

  async onload() {
    // 1. Initialize the Data Layer
    // Passing "" means it will scan the entire vault for now
    this.indexer = new SceneIndexer(this.app, ""); 
    this.writeQueue = new FrontmatterWriteQueue(this.app);
    
    // Wait for Obsidian's cache to be ready, then index
    this.app.workspace.onLayoutReady(() => {
      this.indexer.indexVault();
    });

    // 2. Register Live Updates (Event-driven Architecture)
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        // When any file changes, re-index to update the 3D view live
        this.indexer.indexVault();
      })
    );

    // 3. Register the custom ItemView
    //this.registerView(VIEW_TYPE_NE3D, (leaf) => new NE3DView(leaf));

    // NEW: Pass the writeQueue into the View
    this.registerView(VIEW_TYPE_NE3D, (leaf) => new NE3DView(leaf, this.writeQueue));

    // 4. Add a ribbon icon to open the 3D Canvas
    this.addRibbonIcon('box', 'Open NE3D Canvas', () => {
      this.activateView();
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_NE3D);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_NE3D);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE_NE3D, active: true });
    }

    if (leaf) workspace.revealLeaf(leaf);
  }
}