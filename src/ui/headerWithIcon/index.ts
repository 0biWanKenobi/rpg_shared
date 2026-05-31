import { setIcon, Setting } from "obsidian";
import "./headerWithIcon.css";


class HeaderWithIcon extends Setting {

	#icon: HTMLDivElement;

	constructor(parent: HTMLElement) {
		super(parent);
		this.#icon = this.settingEl.createDiv({ cls: 'header-icon-wrapper' });
		this
			.setClass('header-with-icon')
			.setHeading()
		Object.seal(this);
	}

	setIcon(icon: string) {
		setIcon(this.#icon, icon);
		return this;
	}
}

Object.freeze(HeaderWithIcon.prototype);

export { HeaderWithIcon }
