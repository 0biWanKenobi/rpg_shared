import {signal, Signal} from "@preact/signals";
import type { Setting, TextComponent } from "obsidian";

class PluginSetting<T> {
    setting: Setting;
    signal:Signal<T>;


    /**
     *
     */
    constructor(setting: Setting, campaignId: Signal<T>) {
        this.setting = setting;
        this.signal = campaignId;
    }

    public subscribe(callback: (value: T, setting: Setting) => void) {
        this.signal.subscribe((value) => callback(value, this.setting));
        return this;
    }
	
	
}

Object.freeze(PluginSetting.prototype)

const PRIVATE_TPS_CTOR = Symbol('private_textpluginsetting_ctor')

class TextPluginSetting extends PluginSetting<string> {
    public readonly text: TextComponent;

    private constructor(setting: Setting, signal: Signal<string>, text: TextComponent, key?: typeof PRIVATE_TPS_CTOR) {
        if(key !== PRIVATE_TPS_CTOR) throw("Cannot use private constructor")
        super(setting, signal);
        this.text = text;
        Object.seal(this)
    }

    public static build(setting: Setting, name: string, desc: string, value: string) {
		const _signal = signal(value);
        let _text: TextComponent;
		setting
			.setName(name)
			.setDesc(desc)
			.addText(text => {
                _text = text;
                text.onChange( v => _signal.value = v);
            });
		
		return new TextPluginSetting(setting, _signal, _text!, PRIVATE_TPS_CTOR);
	}
}

Object.freeze(TextPluginSetting.prototype)

export {PluginSetting, TextPluginSetting}