import { App, ButtonComponent, Modal, Notice, setIcon } from "obsidian";
import "./googleDriveConnectModal.css";

export type GoogleDeviceAuthorizationView = {
	userCode: string;
	verificationUrl: string;
	expiresIn: number;
};

export class GoogleDriveConnectModal extends Modal {
	private statusEl: HTMLElement | null = null;
	private cancelled = false;
	private buttonClicked = false;
	private wasclosedResolver = Promise.withResolvers<boolean>();

	private cancelButton: ButtonComponent | undefined = undefined;
	private loginButton: ButtonComponent | undefined = undefined;

	constructor(app: App) {
		super(app);
		this.modalEl.addClass("gdrive-connect-modal");
		this.setTitle("Connect Google Drive");
	}

	showDeviceAuthorizationAsync(authUrl: string) {
		this.contentEl.empty();

		this.contentEl.createEl("p", {
			text: "Click the button below to login to your Google Drive from the web.",
		});

		this.statusEl = this.contentEl.createDiv({ cls: "gdrive-connect-status" }, (el) => el.hide())
		const buttons = this.contentEl.createDiv({ cls: "gdrive-connect-modal-buttons" });
		

		this.loginButton = new ButtonComponent(buttons)
		.setButtonText("Login")
		.setClass("gdrive-login-btn")
		.setCta()
		.onClick(() => {
			this.buttonClicked = true;
			this.loginButton!.setDisabled(true);
			this.statusEl?.show();
			this.setStatus("Waiting for Google sign-in…", "loader");
			window.open(authUrl, "_blank", "noopener,noreferrer")
		});


		this.cancelButton = new ButtonComponent(buttons)
			.setButtonText("Cancel")
			.onClick(() => {
				this.buttonClicked = true;
				this.cancelled = true;
				this.close();
			})

		return this.wasclosedResolver.promise;
	}

	setButtonsAfterLogin(){
		this.cancelButton
			?.setButtonText("Close")
			.onClick(() => {
				this.buttonClicked = true;
				this.close();
			});
		this.loginButton
			?.setClass("gdrive-login-btn")
			.setClass("hidden")
	}

	setStatus(message: string, icon?: string) {
		if (!this.statusEl) {
			return;
		}

		this.statusEl.empty();
		const statusInner = this.statusEl.createDiv({ cls: "gdrive-connect-status-inner" });
		if (icon) {
			const iconEl = statusInner.createDiv();
			setIcon(iconEl, icon);
		}
		statusInner.createEl("span", { text: message });
	}

	onOpen(): Promise<void> | void {
		this.modalEl.querySelector<HTMLElement>(".modal-close-button")
		?.addEventListener("click", () => {
			this.cancelled = true;
			this.onClose();
			super.close();
		})
	}

	close(): void {
		if(!this.buttonClicked) return;
		super.close();
	}

	onClose() {
		this.contentEl.empty();
		this.wasclosedResolver.resolve(this.cancelled);
	}
}
