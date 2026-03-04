import { Plugin, WorkspaceLeaf } from 'obsidian';
import { NE3DView, VIEW_TYPE_NE3D } from './NE3DView';
import { SceneIndexer } from './engine/SceneIndexer';

export default class NE3DPlugin extends Plugin {
  public indexer!: SceneIndexer;

  async onload() {
    // 1. Initialize the Data Layer
    this.indexer = new SceneIndexer(this.app);
    
    // Wait for Obsidian to finish indexing its metadata cache on startup
    this.app.workspace.onLayoutReady(() => {
      this.indexer.indexVault();
      // Bind the listener so the visualizer updates when you type
      this.indexer.registerListeners(this.registerEvent.bind(this));
    });

    // 2. Register the custom ItemView
    this.registerView(VIEW_TYPE_NE3D, (leaf: WorkspaceLeaf) => new NE3DView(leaf));

    // 3. Add a ribbon icon to open the 3D Canvas
    this.addRibbonIcon('box', 'Open NE3D Canvas', () => {
      this.activateView();
    });
  }

    async onunload() {
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