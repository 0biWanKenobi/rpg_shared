import { setIcon, Setting } from "obsidian";
import "./headerWithIcon.css";

export const headerWithIcon = (parent: HTMLElement, title: string, icon: string) => {
	const header = new Setting(parent)
	.setName(title)
	.setClass('header-with-icon')
	.setHeading();
	setIcon(header.settingEl.createDiv({cls: 'header-icon-wrapper'}), icon);

	return header;
}