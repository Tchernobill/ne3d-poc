declare module 'obsidian' {
    export interface Plugin {
        onload(): void;
        onunload(): void;
        [key: string]: any;
    }
    export class Plugin {
        async onload(): Promise<void> {}
        async onunload(): Promise<void> {}
    }
    export interface WorkspaceLeaf { [key: string]: any }
    export interface TFile { [key: string]: any }
}
