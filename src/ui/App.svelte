<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer3D } from '../engine/Renderer3D';
  import { sceneStore } from '../engine/SceneStore';

  let container: HTMLDivElement;
  let renderer: Renderer3D;

  onMount(() => {
    renderer = new Renderer3D(container);
    renderer.init();
    renderer.updateNodes($sceneStore);
  });

  onDestroy(() => {
    if (renderer) renderer.dispose();
  });

  // MAGIC: This Svelte reactive statement watches the Obsidian vault.
  // Anytime a markdown file is edited, it pushes the new data to the 3D engine!
  $: if (renderer && $sceneStore) {
    renderer.updateNodes($sceneStore);
  }
</script>

<div class="ne3d-wrapper">
  <div class="ne3d-toolbar">
    <div class="ne3d-title">Narrative Engine 3D</div>
    <div class="ne3d-controls">
      <label>Scenes tracked: {$sceneStore.length}</label>
    </div>
  </div>

  <div bind:this={container} class="ne3d-canvas-container" style="touch-action: none;"></div>
</div>

<style>
  .ne3d-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  .ne3d-toolbar {
    padding: 10px;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ne3d-title {
    font-weight: bold;
    color: var(--text-normal);
  }
  .ne3d-canvas-container {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>