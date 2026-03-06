import { App, TFile } from 'obsidian';
import { SceneNode, sceneStore, timelineBoundsStore } from './SceneStore';

export class SceneIndexer {
  private app: App;
  private targetFolder: string; 

  constructor(app: App, targetFolder: string = "") {
    this.app = app;
    this.targetFolder = targetFolder;
  }

  public indexVault() {
    const files = this.app.vault.getMarkdownFiles();
    const nodes: SceneNode[] =[];
    
    let minDate = Infinity;
    let maxDate = -Infinity;

    console.log(`[SceneIndexer] Scanning vault... Found ${files.length} markdown files total.`);

    for (const file of files) {
      if (this.targetFolder && !file.path.startsWith(this.targetFolder)) continue;
      
      const node = this.parseFile(file);
      if (node) {
        nodes.push(node);
        if (node.storyDate < minDate) minDate = node.storyDate;
        if (node.storyDate > maxDate) maxDate = node.storyDate;
      }
    }

    if (nodes.length === 0) {
      minDate = 0; maxDate = 0;
    } else {
      if (minDate === Infinity) minDate = 0;
      if (maxDate === -Infinity) maxDate = 0;
    }

    console.log(`[SceneIndexer] Successfully parsed ${nodes.length} scenes.`);
    console.log(`[SceneIndexer] Extracted Date Range: ${minDate} to ${maxDate}`);

    timelineBoundsStore.set({ min: minDate, max: maxDate });
    sceneStore.set(nodes);
  }

  // NEW: Robust Date Parser for 'YYYY-MM-DD HHMM' format
  private parseDateString(dateRaw: any): number {
    if (!dateRaw) return 0;
    if (typeof dateRaw === 'number') return dateRaw; // If it's already a number
    
    let dateStr = String(dateRaw).trim();
    
    // Fix "YYYY-MM-DD HHMM" format (insert a colon into the time and replace space with T)
    // "2108-08-15 1400" -> "2108-08-15T14:00:00"
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2})(\d{2})$/);
    if (match) {
      dateStr = `${match[1]}T${match[2]}:${match[3]}:00`;
    } else {
      // Fallback for standard date strings
      dateStr = dateStr.replace(' ', 'T');
    }

    const timestamp = Date.parse(dateStr);
    return isNaN(timestamp) ? 0 : timestamp;
  }

  private parseFile(file: TFile): SceneNode | null {
    if (!file.path.startsWith('02_Eras/Era_01/Summaries')) return null;

    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;

    if (fm?.note_type !== 'scene_summary') return null;

    return {
      id: file.path,
      title: file.basename,
      file: file,
      // FIX: Use the new date parser and check for snake_case "story_date"
      storyDate: this.parseDateString(fm?.story_date), 
      era: fm?.era ? Number(fm.era) : 1,
      emotional: {
        valence: fm?.valence ? Number(fm.valence) : 0,
        intensity: fm?.intensity ? Number(fm.intensity) : 0.5,
      }
    };
  }

  public registerListeners(registerEvent: (event: any) => void) {
    registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        if (this.targetFolder && !file.path.startsWith(this.targetFolder)) return;
        this.indexVault(); 
      })
    );
  }
}