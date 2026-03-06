<script lang="ts">
  import { selectedSceneStore } from '../engine/SceneStore';
  import type { FrontmatterWriteQueue } from '../engine/FrontmatterWriteQueue';

  export let writeQueue: FrontmatterWriteQueue;

  // When a slider moves, optimistically update the UI, then queue the disk write
  function handleValence(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if ($selectedSceneStore) {
      $selectedSceneStore.emotional.valence = val; 
      writeQueue.enqueue($selectedSceneStore.file, (fm) => { fm.valence = val; });
    }
  }

  function handleIntensity(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if ($selectedSceneStore) {
      $selectedSceneStore.emotional.intensity = val;
      writeQueue.enqueue($selectedSceneStore.file, (fm) => { fm.intensity = val; });
    }
  }
</script>

<div class="ne3d-inspector">
  {#if $selectedSceneStore}
    <div class="inspector-header">
      <h3>{$selectedSceneStore.title}</h3>
      <p class="file-path">{$selectedSceneStore.id}</p>
    </div>
    
    <div class="slider-group">
      <label for="valence-slider">Valence (Positive/Negative): {$selectedSceneStore.emotional.valence.toFixed(2)}</label>
      <input id="valence-slider" type="range" min="-1" max="1" step="0.1" 
             value={$selectedSceneStore.emotional.valence} 
             on:input={handleValence} />
    </div>

    <div class="slider-group">
      <label for="intensity-slider">Intensity (Low/High): {$selectedSceneStore.emotional.intensity.toFixed(2)}</label>
      <input id="intensity-slider" type="range" min="0" max="1" step="0.1" 
             value={$selectedSceneStore.emotional.intensity} 
             on:input={handleIntensity} />
    </div>
  {:else}
    <div class="empty-state">
      <p>Click a cube in the 3D canvas to inspect its properties.</p>
    </div>
  {/if}
</div>

<style>
  .ne3d-inspector {
    width: 300px;
    background-color: var(--background-secondary-alt);
    border-left: 1px solid var(--background-modifier-border);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  }
  .inspector-header h3 {
    margin: 0 0 5px 0;
    color: var(--text-normal);
  }
  .file-path {
    font-size: 0.8em;
    color: var(--text-muted);
    margin: 0;
    word-break: break-all;
  }
  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--text-muted);
  }
  input[type=range] {
    width: 100%;
    cursor: pointer;
  }
  .empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    text-align: center;
    color: var(--text-faint);
  }
</style>