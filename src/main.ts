import { Plugin, WorkspaceLeaf } from 'obsidian';
import { NE3DView, VIEW_TYPE_NE3D } from './NE3DView';

export default class NE3DPlugin extends Plugin {
  async onload() {
    // 1. Register the custom ItemView
    this.registerView(VIEW_TYPE_NE3D, (leaf) => new NE3DView(leaf));

    // 2. Add a ribbon icon to open the 3D Canvas
    this.addRibbonIcon('box', 'Open NE3D Canvas', () => {
      this.activateView();
    });
  }

  onunload() {
    // Ensure all views are closed to trigger ResourceTracker disposal
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