import { ItemView, WorkspaceLeaf } from 'obsidian';
import App from './ui/App.svelte';

export const VIEW_TYPE_NE3D = "ne3d-view";

export class NE3DView extends ItemView {
  component!: App;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_NE3D;
  }

  getDisplayText() {
    return "NE3D Visualizer";
  }

  getIcon() {
    return "box";
  }

  async onOpen() {
    // Mount the Svelte App to the Obsidian view container
    this.component = new App({
      target: this.contentEl,
      props: {}
    });
  }

  async onClose() {
    // Unmount Svelte. This triggers onDestroy() in App.svelte, 
    // which cascades down to the Three.js ResourceTracker.
    if (this.component) {
      this.component.$destroy();
    }
  }
}