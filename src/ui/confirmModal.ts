import { Modal, App, ButtonComponent } from "obsidian";
import "./confirmModal.css";


class ConfirmModal extends Modal {
	#confirmed = false; 
	
	#responseResolver = Promise.withResolvers<boolean>();
	
	constructor(app: App) {
		super(app);
		
		const btnContainer = this.contentEl.createEl('div', { cls: 'confirm-modal-buttons' })
		
		new	ButtonComponent(btnContainer)
					.setButtonText('Yes')
					.setWarning()
					.onClick(() => {
						this.#confirmed = true;
						this.close();
					});
		new	ButtonComponent(btnContainer)
			.setButtonText('No')
			.onClick(() => this.close());

		Object.seal(this);
	}
	
	onOpen(): Promise<void> | void {
		this.#confirmed = false;
		return super.onOpen();
	}

	onClose() {
		this.#responseResolver.resolve(this.#confirmed);
		super.onClose();
	}

	waitResponse() {
		super.open();
		return this.#responseResolver.promise;
	}
}

Object.freeze(ConfirmModal.prototype)

export {ConfirmModal}