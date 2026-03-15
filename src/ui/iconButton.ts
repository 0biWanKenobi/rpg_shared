import { ButtonComponent, setIcon } from "obsidian";
import "./iconButton.css"

export class IconButtonComponent extends ButtonComponent {
    constructor(containerEl: HTMLElement) {
        super(containerEl);
        this.buttonEl.classList.add('icon-button');
    }

    addIcon(icon: string): this {
        const iconEl = createDiv({ cls: 'icon' });
        this.buttonEl.prepend(iconEl);
        setIcon(iconEl, icon);
        return this;
    }
}