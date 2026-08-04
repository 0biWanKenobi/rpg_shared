declare module globalThis {

    // Support for Settings opening in separate window from Obsidian 1.13 onwards
    interface Window {
        activeDocument: Document | undefined;
    }
    var activeWindow: Window | undefined;
}