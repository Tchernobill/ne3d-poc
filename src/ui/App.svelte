<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer3D } from '../engine/Renderer3D';
  import { sceneStore, selectedSceneStore, timelineBoundsStore } from '../engine/SceneStore';
  import InspectorPanel from './InspectorPanel.svelte'; 
  import type { FrontmatterWriteQueue } from '../engine/FrontmatterWriteQueue'; 

  export let writeQueue: FrontmatterWriteQueue; 

  let container: HTMLDivElement;
  let renderer: Renderer3D;

  onMount(() => {
    renderer = new Renderer3D(container);
    renderer.init();
    // Pass both the nodes and the bounds
    renderer.updateNodes($sceneStore, { min: $timelineBoundsStore.minDate, max: $timelineBoundsStore.maxDate });
  });

  onDestroy(() => {
    if (renderer) renderer.dispose();
  });

  // Reactive trigger updates if nodes or bounds change
  $: if (renderer && $sceneStore && $timelineBoundsStore) {
    renderer.updateNodes($sceneStore, { min: $timelineBoundsStore.minDate, max: $timelineBoundsStore.maxDate });
  }
</script>

<div class="ne3d-wrapper">
  <div class="ne3d-toolbar">
    <div class="ne3d-title">Narrative Engine 3D</div>
    <div class="ne3d-controls">
      <p>Scenes tracked: {$sceneStore.length}</p>
      <span style="margin-left: 20px; color: var(--text-accent);">
        {#if $selectedSceneStore}
          Selected: {$selectedSceneStore.title}
        {:else}
          Click a scene...
        {/if}
      </span>
    </div>
  </div>

  <div class="ne3d-workspace">
    <div bind:this={container} class="ne3d-canvas-container" style="touch-action: none;"></div>
    <InspectorPanel writeQueue={writeQueue} />
  </div>
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
  .ne3d-workspace {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .ne3d-canvas-container {
    flex: 1;
    position: relative;
    height: 100%;
  }
</style>