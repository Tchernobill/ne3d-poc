import { App, TFile } from 'obsidian';

export class FrontmatterWriteQueue {
  private app: App;
  private queues = new Map<string, Promise<void>>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(app: App) {
    this.app = app;
  }

  enqueue(file: TFile, updateFn: (fm: any) => void) {
    const path = file.path;

    // 1. Clear any pending writes for this file (Debounce)
    if (this.debounceTimers.has(path)) {
      clearTimeout(this.debounceTimers.get(path)!);
    }

    // 2. Wait 250ms after the last slider movement before writing
    const timer = setTimeout(() => {
      // 3. Chain promises to ensure writes happen sequentially
      const prev = this.queues.get(path) || Promise.resolve();
      
      const next = prev.then(() => 
        this.app.fileManager.processFrontMatter(file, updateFn)
      ).catch((e) => {
        console.error("NE3D Write Error: ", e);
      });

      this.queues.set(path, next);
    }, 250);

    this.debounceTimers.set(path, timer);
  }
}