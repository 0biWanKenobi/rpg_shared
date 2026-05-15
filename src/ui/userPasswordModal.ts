import { App, ButtonComponent, Setting } from "obsidian";
import { ConfirmModal } from "rpg_shared/ui/confirmModal";
import "./usePasswordModal.css";

class UserPasswordModal extends ConfirmModal {

    #responseResolver = Promise.withResolvers<string | undefined>();
    #password: string | undefined;

    constructor(app: App) {
        super(app);

        const form = this.contentEl.createEl("form", { cls: "pwd_form" });
        new Setting(form)
            .setName("Protect your Google account with a password")
            .addText(t => {
                t.inputEl.setAttr("type", "password");
                t.onChange(v => {
                    this.#password = v
                })
            })

        const btnContainer = this.contentEl.createEl('div', { cls: 'confirm-modal-buttons' })

        new ButtonComponent(btnContainer)
            .setButtonText('Ok')
            .onClick(() => {
                this.close();
            });

        new ButtonComponent(btnContainer)
            .setButtonText('Cancel')
            .onClick(() => {
                this.#password = undefined;
                this.close();
            });

        Object.seal(this);
    }

    waitInput(): Promise<string | undefined> {
        this.open();
        return this.#responseResolver.promise;
    }

    onClose(): void {
        this.#responseResolver.resolve(this.#password)
    }
}

Object.freeze(UserPasswordModal.prototype);

export { UserPasswordModal }