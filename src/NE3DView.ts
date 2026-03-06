import { ItemView, WorkspaceLeaf } from 'obsidian';
import App from './ui/App.svelte';
import { FrontmatterWriteQueue } from './engine/FrontmatterWriteQueue';

export const VIEW_TYPE_NE3D = "ne3d-view";

export class NE3DView extends ItemView {
  component!: App;
  writeQueue: FrontmatterWriteQueue; // NEW

  constructor(leaf: WorkspaceLeaf, writeQueue: FrontmatterWriteQueue) { // NEW
    super(leaf);
    this.writeQueue = writeQueue; // NEW
  }

  getViewType() { return VIEW_TYPE_NE3D; }
  getDisplayText() { return "NE3D Visualizer"; }
  getIcon() { return "box"; }

  async onOpen() {
    this.component = new App({
      target: this.contentEl,
      props: {
        writeQueue: this.writeQueue // NEW: Pass it as a prop to Svelte
      }
    });
  }

  async onClose() {
    if (this.component) this.component.$destroy();
  }
}