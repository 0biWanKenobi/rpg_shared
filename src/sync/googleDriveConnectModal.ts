import { App, ButtonComponent, Modal, setIcon } from "obsidian";
import "./googleDriveConnectModal.css";

export type GoogleDeviceAuthorizationView = {
	userCode: string;
	verificationUrl: string;
	expiresIn: number;
};

class GoogleDriveConnectModal extends Modal {
	#statusEl: HTMLElement | null = null;
	#cancelled = false;
	#wasclosedResolver = Promise.withResolvers<boolean>();

	#cancelButton: ButtonComponent | undefined = undefined;
	#loginButton: ButtonComponent | undefined = undefined;

	constructor(app: App) {
		super(app);
		this.modalEl.addClass("gdrive-connect-modal");
		this.setTitle("Connect Google Drive");
		Object.seal(this);
	}

	openAsync(authUrl: string) {
		this.contentEl.empty();

		this.contentEl.createEl("p", {
			text: "Click the button below to login to your Google Drive from the web.",
		});

		this.#statusEl = this.contentEl.createDiv({ cls: "gdrive-connect-status" }, (el) => el.hide())
		const buttons = this.contentEl.createDiv({ cls: "gdrive-connect-modal-buttons" });
		

		this.#loginButton = new ButtonComponent(buttons)
		.setButtonText("Login")
		.setClass("gdrive-login-btn")
		.setCta()
		.onClick(() => {
			this.#loginButton!.setDisabled(true);
			this.#statusEl?.show();
			this.setStatus("Waiting for Google sign-in…", "loader");
			window.open(authUrl, "_blank", "noopener,noreferrer")
		});


		this.#cancelButton = new ButtonComponent(buttons)
			.setButtonText("Cancel")
			.onClick(() => {
				this.#cancelled = true;
				this.userClose();
			})

		this.open();

		return this.#wasclosedResolver.promise;
	}

	setButtonsAfterLogin(){
		this.#cancelButton
			?.setButtonText("Close")
			.onClick(() => {
				this.userClose();
			});
		this.#loginButton
			?.setClass("gdrive-login-btn")
			.setClass("hidden")
	}

	setStatus(message: string, icon?: string) {
		if (!this.#statusEl) {
			return;
		}

		this.#statusEl.empty();
		const statusInner = this.#statusEl.createDiv({ cls: "gdrive-connect-status-inner" });
		if (icon) {
			const iconEl = statusInner.createDiv();
			setIcon(iconEl, icon);
		}
		statusInner.createEl("span", { text: message });
	}

	onOpen(): Promise<void> | void {
		this.modalEl.querySelector<HTMLElement>(".modal-close-button")
		?.addEventListener("click", () => {
			this.#cancelled = true;
			this.userClose();
		})
	}

	close(): void {
		return;
	}

	private userClose(){
		this.onClose();
		super.close();
	}

	onClose() {
		this.contentEl.empty();
		this.#wasclosedResolver.resolve(this.#cancelled);
	}
}

Object.freeze(GoogleDriveConnectModal.prototype)

export {GoogleDriveConnectModal}