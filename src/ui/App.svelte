<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer3D } from '../engine/Renderer3D';

  let container: HTMLDivElement;
  let renderer: Renderer3D;
  let sceneCount = 500; // Testing scalable requirement

  // Architecture 5.2: UI Layer completely separated from rendering logic
  onMount(() => {
    renderer = new Renderer3D(container);
    renderer.init();
    renderer.updateNodes(sceneCount);
  });

  onDestroy(() => {
    // Architecture 9.3: Lifecycle Integration / Hard disposal
    if (renderer) {
      renderer.dispose();
    }
  });

  function handleSliderChange() {
    renderer.updateNodes(sceneCount);
  }
</script>

<div class="ne3d-wrapper">
  <!-- UI Layer: Toolbar / Inspector (Vanilla Svelte, completely reactive) -->
  <div class="ne3d-toolbar">
    <div class="ne3d-title">Narrative Engine 3D</div>
    <div class="ne3d-controls">
      <label>Scenes: {sceneCount}</label>
      <input type="range" min="10" max="1000" bind:value={sceneCount} on:input={handleSliderChange} />
    </div>
  </div>

  <!-- 3D Viewport container -->
  <!-- touch-action: none is critical for preventing trackpad swipe pane conflicts -->
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