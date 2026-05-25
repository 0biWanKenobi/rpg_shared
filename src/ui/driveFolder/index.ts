import { setIcon } from "obsidian";
import "./driveFolder.css";
import { signal } from "@preact/signals";

class DriveFolder {
  
    #folder = signal<string|undefined>(undefined);
    #btnElement!: HTMLElement;

    constructor(container: HTMLElement) {

      this.#folder.subscribe((v) => {
        if(!v) return;
        this.#btnElement = this.#draw(container, v)
      })
      Object.seal(this);
    }


    #draw(container: HTMLElement, folder: string){
      
      const btn = container.createEl("button", {
        cls: "folder-list-item nav-file-title",
        attr: {
          type: "button",
          "aria-label": `Open folder ${folder}`,
        },
      });

      const icon = btn.createSpan({ cls: "folder-list-icon" });
      setIcon(icon, "folder");

      btn.createSpan({
        cls: "folder-list-name nav-file-title-content",
        text: folder,
      });

      return btn;
    }

    setLabel(label: string){
      this.#folder.value = label;
      return this;
    }

    onClick(action: () => void){
      this.#btnElement.addEventListener("click", action);
      return this;
    }
}

Object.freeze(DriveFolder.prototype);

export {DriveFolder}