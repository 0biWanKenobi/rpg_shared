import { Notice as ObsidianNotice, setIcon } from "obsidian";


type WarningNoticeIcon = "file-exclamation-point" | "book-alert" | "triangle-alert" | "circle-alert" 
| "octagon-alert" | "clock-alert" | "cloud-alert" | "mail-warning" | "message-circle-warning" | "message-square-warning";

type ErrorNoticeIcon = "circle-x" | "circle-off" | "circle-slash" | "ban" | "shield-alert" | "shield-x";


type ErrorOptions = {
    icon: ErrorNoticeIcon | (string & {}),
    type: "notice-contents error-notice-contents"
    duration?: number
}

type WarningOptions = {
    icon: WarningNoticeIcon | (string & {}),
    type: "notice-contents warning-notice-contents"
    duration?: number
}

export type CustomOptions = WarningOptions | ErrorOptions;

class Notice extends ObsidianNotice {

    /**
     * Creates a `Notice` with a default warning icon set to 'circle-alert'.
     */
    
    constructor(message: string, duration?: number) {
        super(message, duration)
    }

    private static Custom(message: string, options: CustomOptions) {
        const frg = createFragment();
        frg.appendChild(createDiv(options.type, el => {

            setIcon(el, options.icon)
            el.appendChild(createSpan( undefined, msg => msg.setText(message)))
        }))

        return new ObsidianNotice(frg, options?.duration)
    }

    static Warning(message: string, options?: Omit<WarningOptions, "type">){
        return Notice.Custom(message, {
            icon: options?.icon ?? 'circle-alert',
            type: 'notice-contents warning-notice-contents',
            duration: options?.duration
        })
    }
    
    
    static Error(message: string, options?: ErrorOptions){
        return Notice.Custom(message, {
            icon: options?.icon ?? 'circle-x',
            type: 'notice-contents error-notice-contents',
            duration: options?.duration
        })
    }
}


export {Notice}