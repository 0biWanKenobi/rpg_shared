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
	private wasclosedResolver = Promise.withResolvers<boolean>();

	constructor(app: App) {
		super(app);
		this.modalEl.addClass("gdrive-connect-modal");
		this.setTitle("Connect Google Drive");
	}

	showDeviceAuthorizationAsync(data: GoogleDeviceAuthorizationView) {
		this.contentEl.empty();

		this.contentEl.createEl("p", {
			text: "Open Google’s verification page in your browser, then enter the code shown below.",
		});

		const codeWrapper = this.contentEl.createDiv({ cls: "gdrive-device-code-wrapper" });
		codeWrapper.createEl("code", {
			text: data.userCode,
			cls: "gdrive-device-code",
		});

		const urlWrapper = this.contentEl.createDiv({ cls: "gdrive-device-url-wrapper" });
		urlWrapper.createEl("span", { text: "Verification URL" });
		urlWrapper.createEl("code", {
			text: data.verificationUrl,
			cls: "gdrive-device-url",
		});

		const buttons = this.contentEl.createDiv({ cls: "gdrive-connect-modal-buttons" });

		new ButtonComponent(buttons)
			.setButtonText("Open Google")
			.setCta()
			.onClick(() => window.open(data.verificationUrl, "_blank", "noopener,noreferrer"));

		new ButtonComponent(buttons)
			.setButtonText("Copy code")
			.onClick(async () => {
				await navigator.clipboard.writeText(data.userCode);
				new Notice("Google verification code copied.");
			});

		new ButtonComponent(buttons)
			.setButtonText("Copy link")
			.onClick(async () => {
				await navigator.clipboard.writeText(data.verificationUrl);
				new Notice("Google verification link copied.");
			});

		new ButtonComponent(buttons)
			.setButtonText("Cancel")
			.onClick(() => {
				this.cancelled = true;
				this.close();
			})

		this.statusEl = this.contentEl.createDiv({ cls: "gdrive-connect-status" });
		this.setStatus("Waiting for Google sign-in…", "loader");

		this.contentEl.createEl("small", {
			text: `This code expires in about ${Math.floor(data.expiresIn / 60)} minutes.`,
			cls: "gdrive-connect-hint",
		});

		return this.wasclosedResolver.promise;
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

	onClose() {
		this.contentEl.empty();
		this.wasclosedResolver.resolve(this.cancelled);
	}
}
